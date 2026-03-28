import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { TagInput } from '../components/capture/TagInput'
import { GlowButton } from '../components/ui/GlowButton'
import { defaultTitle } from '../utils/format'
import type { NewCaptureEntry, Tag } from '../types'

// New Entry page — the main capture form.
// Handles photo upload (base64), voice recording, tags, and observations.
export default function NewEntry() {
  const navigate = useNavigate()
  const { addEntry } = useEntries()
  // Two separate refs — iOS Safari breaks when capture + multiple are combined
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const [title, setTitle] = useState(defaultTitle())
  const [photos, setPhotos] = useState<string[]>([])
  const [audioUrl, setAudioUrl] = useState<string>()
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [observations, setObservations] = useState('')
  const [tags, setTags] = useState<Tag[]>([])

  // ── Photo handling ──────────────────────────────────────
  // Shared handler — both inputs (camera + library) call this.
  // We reset e.target.value so the same photo can be re-selected if needed.
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        setPhotos((prev) => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
    // Reset so the same file can be picked again later
    e.target.value = ''
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  // ── Voice recording ─────────────────────────────────────
  async function toggleRecording() {
    if (isRecording) {
      mediaRef.current?.stop()
      setIsRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunks.current = []
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      mediaRef.current = recorder
      setIsRecording(true)
    } catch {
      alert('Microphone access denied.')
    }
  }

  // ── Save ────────────────────────────────────────────────
  function handleSave() {
    const source: NewCaptureEntry['source'] =
      photos.length > 0 && audioUrl
        ? 'mixed'
        : photos.length > 0
        ? 'photo'
        : audioUrl
        ? 'voice'
        : 'text'

    addEntry({ title, photos, audioUrl, transcript, observations, tags, source })
    navigate('/', { replace: true })
  }

  const canSave = title.trim().length > 0 && (photos.length > 0 || audioUrl || observations.trim())

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => navigate(-1)} className="text-on-surface-variant active:scale-95 transition-transform">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-headline font-bold text-base text-on-surface">New Entry</h2>
        <GlowButton variant="primary" onClick={handleSave} disabled={!canSave}>
          Save
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

        {/* Two separate trigger buttons — critical for iPhone Safari reliability */}
        <div className="grid grid-cols-2 gap-2">
          {/* Button 1: opens native camera directly */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="rounded-xl bg-surface-container py-4 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">photo_camera</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Take Photo</span>
          </button>

          {/* Button 2: opens photo library picker (multi-select allowed) */}
          <button
            onClick={() => libraryInputRef.current?.click()}
            className="rounded-xl bg-surface-container py-4 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">photo_library</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">From Library</span>
          </button>
        </div>

        {/* Photo thumbnails — shared output for both inputs */}
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

        {/*
          INPUT 1 — camera / take photo.
          NO capture attribute: capture="environment" causes a black screen on
          Chrome for iOS (and is unreliable on iOS Safari too). Omitting it lets
          iOS show its native action sheet ("Take Photo or Video / Photo Library
          / Browse"), which works correctly in every iOS browser.
        */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/*
          INPUT 2 — photo library picker.
          multiple is fine here because capture is absent.
          NO capture attribute — lets iOS show the full library sheet.
        */}
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
              {audioUrl && !isRecording ? 'Memo saved' : 'Dictate your creative thoughts'}
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
        Save Entry
      </GlowButton>
    </div>
  )
}
