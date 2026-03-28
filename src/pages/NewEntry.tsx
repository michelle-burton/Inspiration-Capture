import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { TagInput } from '../components/capture/TagInput'
import { GlowButton } from '../components/ui/GlowButton'
import { defaultTitle } from '../utils/format'
import type { NewCaptureEntry, Tag } from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compress a base64 image via Canvas.
 * iPhone photos at full res are 4–10 MB → exceed the 5 MB localStorage quota.
 * Resizing to ≤1200 px wide at JPEG 0.75 brings them to ~150–300 KB.
 */
function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl) // fallback: keep original
    img.src = dataUrl
  })
}

/**
 * Pick the first MIME type the current browser's MediaRecorder actually supports.
 * iOS (Safari + Chrome) only supports audio/mp4 — audio/webm is a desktop-only format.
 */
function getSupportedAudioMime(): string {
  const candidates = [
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

/** Convert any Blob to a persistent base64 data URL via FileReader. */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewEntry() {
  const navigate = useNavigate()
  const { addEntry } = useEntries()

  // Two separate refs — iOS Safari/Chrome breaks when capture + multiple are on one input
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const mediaRef        = useRef<MediaRecorder | null>(null)
  const audioChunks     = useRef<Blob[]>([])

  const [title,        setTitle]        = useState(defaultTitle())
  const [photos,       setPhotos]       = useState<string[]>([])
  const [audioUrl,     setAudioUrl]     = useState<string>()
  const [isRecording,  setIsRecording]  = useState(false)
  const [isSaving,     setIsSaving]     = useState(false)
  const [transcript,   setTranscript]   = useState('')
  const [observations, setObservations] = useState('')
  const [tags,         setTags]         = useState<Tag[]>([])

  // ── Photo handling ──────────────────────────────────────────────────────────
  // Root cause of "photo not saved": iPhone photos are 4–10 MB. As base64 they
  // exceed iOS localStorage's 5 MB quota → silent QuotaExceededError → entry
  // never written. Fix: compress to ≤1200 px / JPEG 0.75 before storing.
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // reset input so same photo can be re-selected

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const raw        = ev.target?.result as string
        const compressed = await compressImage(raw)
        console.log('[photo] compressed to', Math.round(compressed.length / 1024), 'KB')
        setPhotos((prev) => [...prev, compressed])
      }
      reader.readAsDataURL(file)
    })
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  // ── Voice recording ─────────────────────────────────────────────────────────
  // Root cause of "recording error": two problems stacked:
  //   1. `new Blob(chunks, { type: 'audio/webm' })` — iOS only supports audio/mp4.
  //      Mislabelling the blob makes the <audio> element refuse to play it.
  //   2. URL.createObjectURL() produces an ephemeral blob: URL that dies after
  //      navigation. Even if localStorage wrote it, it's an unresolvable pointer
  //      on any reload. Must convert to base64 before saving.
  async function toggleRecording() {
    if (isRecording) {
      mediaRef.current?.stop()
      setIsRecording(false)
      return
    }

    if (!window.MediaRecorder) {
      alert('Voice recording is not supported on this browser.')
      return
    }

    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedAudioMime()
      console.log('[audio] using mimeType:', mimeType || '(browser default)')

      const recorderOpts = mimeType ? { mimeType } : {}
      const recorder     = new MediaRecorder(stream, recorderOpts)
      audioChunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      recorder.onerror = (e) => {
        console.error('[audio] MediaRecorder error:', e)
        setIsRecording(false)
        stream.getTracks().forEach((t) => t.stop())
        alert('Recording failed. Please try again.')
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const effectiveMime = mimeType || recorder.mimeType || 'audio/mp4'
        const blob = new Blob(audioChunks.current, { type: effectiveMime })
        console.log('[audio] blob size:', blob.size, 'bytes, type:', blob.type)
        try {
          const base64 = await blobToBase64(blob)
          console.log('[audio] base64 length:', base64.length)
          setAudioUrl(base64)
        } catch (err) {
          console.error('[audio] base64 conversion failed:', err)
          alert('Audio could not be processed. Please try again.')
        }
      }

      // timeslice=250ms: collect chunks periodically — safer on iOS than waiting for stop
      recorder.start(250)
      mediaRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('[audio] getUserMedia failed:', err)
      alert('Microphone access denied.')
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setIsSaving(true)
    const source: NewCaptureEntry['source'] =
      photos.length > 0 && audioUrl ? 'mixed'
      : photos.length > 0           ? 'photo'
      : audioUrl                    ? 'voice'
      :                               'text'

    try {
      console.log('[save] photos:', photos.length, '| audioUrl:', !!audioUrl, '| source:', source)
      addEntry({ title, photos, audioUrl, transcript, observations, tags, source })
      console.log('[save] entry written to localStorage ✓')
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[save] localStorage write failed:', err)
      setIsSaving(false)
      alert(
        photos.length > 0
          ? 'Save failed — photos may be too large. Try fewer photos or use From Library.'
          : 'Save failed. Please try again.'
      )
    }
  }

  const canSave = !isSaving && title.trim().length > 0 && (photos.length > 0 || audioUrl || observations.trim())

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => navigate(-1)} className="text-on-surface-variant active:scale-95 transition-transform">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-headline font-bold text-base text-on-surface">New Entry</h2>
        <GlowButton variant="primary" onClick={handleSave} disabled={!canSave}>
          {isSaving ? 'Saving…' : 'Save'}
        </GlowButton>
      </div>

      {/* ── Title ────────────────────────────────────────── */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title"
        className="w-full bg-transparent font-headline font-bold text-2xl text-on-surface placeholder:text-on-surface-variant/40 outline-none border-b border-outline-variant/20 pb-2 focus:border-primary/40 transition-colors"
      />

      {/* ── Photo capture ────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Photos
        </p>

        <div className="grid grid-cols-2 gap-2">
          {/* Opens camera via iOS action sheet — no capture attr to avoid black screen */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="rounded-xl bg-surface-container py-4 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">photo_camera</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Take Photo</span>
          </button>

          {/* Opens photo library — multiple allowed since no capture attr */}
          <button
            onClick={() => libraryInputRef.current?.click()}
            className="rounded-xl bg-surface-container py-4 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">photo_library</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">From Library</span>
          </button>
        </div>

        {/* Thumbnails — fed by both inputs via shared handler */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((src, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden relative group">
                <img src={src} alt={`photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm text-white">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* INPUT 1: no capture attr — prevents iOS Chrome black screen */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        {/* INPUT 2: library picker — multiple OK here since no capture attr */}
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />
      </section>

      {/* ── Voice memo ───────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Voice Memo
        </p>
        <button
          onClick={toggleRecording}
          className={`
            w-full rounded-xl p-5 flex items-center gap-4 transition-all active:scale-[0.98]
            ${isRecording
              ? 'bg-tertiary/10 ring-1 ring-tertiary/40'
              : 'bg-surface-container-high hover:bg-surface-container-highest'
            }
          `}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-tertiary shadow-neon-pink' : 'bg-secondary-container/30'}`}>
            <span className={`material-symbols-outlined text-2xl ${isRecording ? 'text-on-tertiary material-symbols-filled' : 'text-secondary'}`}>
              {isRecording ? 'stop' : 'mic'}
            </span>
          </div>
          <div className="text-left">
            <p className="font-headline font-bold text-sm text-on-surface">
              {isRecording ? 'Recording… tap to stop' : audioUrl ? 'Re-record voice memo' : 'Record voice memo'}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {audioUrl && !isRecording ? 'Memo saved ✓' : 'Dictate your creative thoughts'}
            </p>
          </div>
          {isRecording && (
            <div className="ml-auto flex gap-0.5">
              {[3, 6, 4, 7, 2, 5].map((h, i) => (
                <div key={i} className="w-1 rounded-full bg-tertiary animate-pulse" style={{ height: `${h * 3}px`, animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          )}
        </button>
        {audioUrl && !isRecording && (
          <audio controls src={audioUrl} className="w-full h-10 accent-primary" />
        )}
      </section>

      {/* ── Transcript / notes ───────────────────────────── */}
      <section className="space-y-2">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Transcript / Notes
        </p>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Any notes or voice transcript…"
          rows={3}
          className="w-full bg-surface-container-lowest rounded-md px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none font-body focus:outline focus:outline-1 focus:outline-primary/40 transition-all"
        />
      </section>

      {/* ── Observations ─────────────────────────────────── */}
      <section className="space-y-2">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Key Observations
        </p>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="What stood out? Patterns, ideas, insights…"
          rows={4}
          className="w-full bg-surface-container-lowest rounded-md px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none font-body focus:outline focus:outline-1 focus:outline-primary/40 transition-all"
        />
      </section>

      {/* ── Tags ─────────────────────────────────────────── */}
      <section className="space-y-2">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Tags
        </p>
        <TagInput tags={tags} onChange={setTags} />
      </section>

      {/* ── Save footer ──────────────────────────────────── */}
      <GlowButton
        variant="primary"
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-4 text-base"
      >
        <span className="material-symbols-outlined">save</span>
        {isSaving ? 'Saving…' : 'Save Entry'}
      </GlowButton>
    </div>
  )
}
