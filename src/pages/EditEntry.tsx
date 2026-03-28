import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { TagInput } from '../components/capture/TagInput'
import { GlowButton } from '../components/ui/GlowButton'
import { compressImage } from '../utils/image'
import type { Tag } from '../types'

// Edit Entry page — pre-populated form for updating an existing capture.
// Editable: title, photos (add / remove), transcript, observations, tags.
// Preserved read-only: audio memo, createdAt, id.
export default function EditEntry() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { getById, editEntry } = useEntries()

  const entry = id ? getById(id) : undefined

  // File input refs — same split pattern as NewEntry (iOS Safari/Chrome safe)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  // Pre-populate all editable fields from the existing entry.
  // useState initialisers run once, so these are stable even if entry updates.
  const [title,        setTitle]        = useState(entry?.title ?? '')
  const [photos,       setPhotos]       = useState<string[]>(entry?.photos ?? [])
  const [transcript,   setTranscript]   = useState(entry?.transcript ?? '')
  const [observations, setObservations] = useState(entry?.observations ?? '')
  const [tags,         setTags]         = useState<Tag[]>(entry?.tags ?? [])
  const [isSaving,     setIsSaving]     = useState(false)

  // ── Not found guard ────────────────────────────────────────────────────────
  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-5xl">search_off</span>
        <p className="font-headline font-bold text-on-surface">Entry not found</p>
        <GlowButton variant="secondary" onClick={() => navigate('/gallery')}>
          Back to Gallery
        </GlowButton>
      </div>
    )
  }

  // ── Photo handlers ─────────────────────────────────────────────────────────
  // Compress before adding — same logic as NewEntry to stay within localStorage quota.
  function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const raw        = ev.target?.result as string
        const compressed = await compressImage(raw)
        console.log('[edit:photo] compressed to', Math.round(compressed.length / 1024), 'KB')
        setPhotos((prev) => [...prev, compressed])
      }
      reader.readAsDataURL(file)
    })
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!id || !entry) return
    setIsSaving(true)

    // Recalculate source based on final photo + audio state
    const source =
      photos.length > 0 && entry.audioUrl ? 'mixed'
      : photos.length > 0                 ? 'photo'
      : entry.audioUrl                    ? 'voice'
      :                                     'text'

    try {
      console.log('[edit:save] id:', id, '| photos:', photos.length, '| source:', source)
      editEntry(id, {
        title,
        photos,
        transcript,
        observations,
        tags,
        source,
        audioUrl: entry.audioUrl, // preserve original audio untouched
      })
      console.log('[edit:save] entry updated ✓')
      navigate(`/entry/${id}`, { replace: true })
    } catch (err) {
      console.error('[edit:save] localStorage write failed:', err)
      setIsSaving(false)
      alert(
        photos.length > 0
          ? 'Save failed — photos may be too large. Try removing one and saving again.'
          : 'Save failed. Please try again.',
      )
    }
  }

  const canSave = !isSaving && title.trim().length > 0

  return (
    <div className="space-y-6">
      {/* ── Nav bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate(-1)}
          className="text-on-surface-variant active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-headline font-bold text-base text-on-surface">Edit Entry</h2>
        <GlowButton variant="primary" onClick={handleSave} disabled={!canSave}>
          {isSaving ? 'Saving…' : 'Save'}
        </GlowButton>
      </div>

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title"
        className="w-full bg-transparent font-headline font-bold text-2xl text-on-surface placeholder:text-on-surface-variant/40 outline-none border-b border-outline-variant/20 pb-2 focus:border-primary/40 transition-colors"
      />

      {/* ── Photos ───────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Photos
        </p>

        {/* Add-photo buttons — same split pattern as NewEntry */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="rounded-xl bg-surface-container py-4 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">photo_camera</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Take Photo</span>
          </button>
          <button
            onClick={() => libraryInputRef.current?.click()}
            className="rounded-xl bg-surface-container py-4 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">photo_library</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">From Library</span>
          </button>
        </div>

        {/* Photo grid — existing + newly added, all removable */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((src, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden relative">
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

        {/* INPUT 1: camera — no capture attr (iOS Chrome black screen prevention) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoAdd}
          className="hidden"
        />
        {/* INPUT 2: library — multiple allowed, no capture attr */}
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoAdd}
          className="hidden"
        />
      </section>

      {/* ── Voice memo (read-only) ────────────────────────────────────────── */}
      {entry.audioUrl && (
        <section className="space-y-2">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Voice Memo
          </p>
          <div className="bg-surface-container-high rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-secondary material-symbols-filled">mic</span>
            </div>
            <audio controls src={entry.audioUrl} className="flex-1 h-10 accent-primary" />
          </div>
          <p className="text-[10px] text-on-surface-variant/50 text-center tracking-wide">
            Voice memo preserved from original entry
          </p>
        </section>
      )}

      {/* ── Transcript / Notes ───────────────────────────────────────────── */}
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

      {/* ── Key Observations ─────────────────────────────────────────────── */}
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

      {/* ── Tags ─────────────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Tags
        </p>
        <TagInput tags={tags} onChange={setTags} />
      </section>

      {/* ── Save footer ──────────────────────────────────────────────────── */}
      <GlowButton
        variant="primary"
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-4 text-base"
      >
        <span className="material-symbols-outlined">save</span>
        {isSaving ? 'Saving…' : 'Save Changes'}
      </GlowButton>
    </div>
  )
}
