import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { createEntry, addEntryImage, upsertTag, addTagToEntry } from '../utils/db'
import { GlowButton } from '../components/ui/GlowButton'
import { Chip } from '../components/ui/Chip'
import { compressImage } from '../utils/image'
import type { TagColor, SourceType } from '../types'

// ── Local draft tag (before saving to DB) ────────────────────────────────────
type DraftTag = { value: string; color: TagColor }

const PRESET_TAGS: DraftTag[] = [
  { value: 'celestial',    color: 'cyan'   },
  { value: 'stickers',     color: 'purple' },
  { value: 'dreamy',       color: 'pink'   },
  { value: 'easy-to-make', color: 'cyan'   },
  { value: 'merch',        color: 'purple' },
  { value: 'ArtStyle',     color: 'pink'   },
  { value: 'Packaging',    color: 'cyan'   },
  { value: 'ColorPalette', color: 'purple' },
  { value: 'Typography',   color: 'pink'   },
  { value: 'Concept',      color: 'cyan'   },
]
const COLOR_CYCLE: TagColor[] = ['cyan', 'purple', 'pink']

// ── Helpers ───────────────────────────────────────────────────────────────────
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function uploadPhoto(
  file: File,
  userId: string,
  entryId: string
): Promise<{ storage_path: string; public_url: string; file_name: string; mime_type: string; file_size: number } | null> {
  try {
    const ext          = file.name.split('.').pop() ?? 'jpg'
    const fileName     = `${Date.now()}.${ext}`
    const storagePath  = `${userId}/${entryId}/${fileName}`

    // Read and compress
    const base64   = await blobToBase64(file)
    const compressed = await compressImage(base64)

    // Convert compressed base64 back to blob for upload
    const res      = await fetch(compressed)
    const blob     = await res.blob()

    const { error } = await supabase.storage
      .from('entry-images')
      .upload(storagePath, blob, { contentType: blob.type, upsert: false })

    if (error) {
      console.error('[upload] storage error:', error.message)
      return null
    }

    return {
      storage_path: storagePath,
      public_url:   '',          // generated at read-time via signed URL
      file_name:    fileName,
      mime_type:    blob.type,
      file_size:    blob.size,
    }
  } catch (err) {
    console.error('[upload] failed:', err)
    return null
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewEntry() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()

  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [title,              setTitle]              = useState('')
  const [boothName,          setBoothName]          = useState('')
  const [artistName,         setArtistName]         = useState('')
  const [visualInspiration,  setVisualInspiration]  = useState('')
  const [emotionalReaction,  setEmotionalReaction]  = useState('')
  const [brandIdea,          setBrandIdea]          = useState('')
  const [materialOrPhrase,   setMaterialOrPhrase]   = useState('')
  const [notes,              setNotes]              = useState('')
  const [priceRange,         setPriceRange]         = useState('')
  const [isFavorite,         setIsFavorite]         = useState(false)
  const [tags,               setTags]               = useState<DraftTag[]>([])
  const [tagInput,           setTagInput]           = useState('')

  // Photo state — keep File objects for upload; base64 only for preview
  const [photoFiles,    setPhotoFiles]    = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [sourceType,    setSourceType]    = useState<SourceType>('text_only')

  const [isSaving, setIsSaving] = useState(false)

  // ── Photo handling ───────────────────────────────────────────────────────
  async function handlePhotoSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    source: 'camera' | 'library'
  ) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setSourceType(source)
    for (const file of files) {
      const base64     = await blobToBase64(file)
      const compressed = await compressImage(base64)
      setPhotoFiles(prev  => [...prev, file])
      setPhotoPreviews(prev => [...prev, compressed])
    }
  }

  function removePhoto(idx: number) {
    setPhotoFiles(prev    => prev.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Tag handling ─────────────────────────────────────────────────────────
  function addTag(value: string, color?: TagColor) {
    const clean = value.trim().replace(/^#/, '')
    if (!clean || tags.some(t => t.value === clean)) return
    const resolvedColor = color ?? COLOR_CYCLE[tags.length % COLOR_CYCLE.length]
    setTags(prev => [...prev, { value: clean, color: resolvedColor }])
  }

  function removeTag(value: string) {
    setTags(prev => prev.filter(t => t.value !== value))
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1].value)
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!eventId) return
    setIsSaving(true)

    try {
      // 1. Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 2. Determine source_type
      const finalSource: SourceType =
        photoFiles.length > 0 ? sourceType : 'text_only'

      // 3. Save entry
      const { data: entry, error: entryError } = await createEntry({
        event_id:           eventId,
        title:              title.trim() || null,
        booth_name:         boothName.trim() || null,
        artist_name:        artistName.trim() || null,
        visual_inspiration: visualInspiration.trim() || null,
        emotional_reaction: emotionalReaction.trim() || null,
        brand_idea:         brandIdea.trim() || null,
        material_or_phrase: materialOrPhrase.trim() || null,
        notes:              notes.trim() || null,
        price_range:        priceRange.trim() || null,
        source_type:        finalSource,
        is_favorite:        isFavorite,
        is_archived:        false,
        captured_at:        new Date().toISOString(),
      })

      if (entryError || !entry) throw new Error(entryError?.message ?? 'Entry save failed')

      // 4. Upload photos
      for (const file of photoFiles) {
        const imgData = await uploadPhoto(file, user.id, entry.id)
        if (imgData) {
          await addEntryImage({ entry_id: entry.id, ...imgData })
        }
      }

      // 5. Save tags
      for (const draftTag of tags) {
        const { data: savedTag } = await upsertTag(draftTag.value, draftTag.color)
        if (savedTag) {
          await addTagToEntry(entry.id, savedTag.id)
        }
      }

      navigate(`/events/${eventId}`, { replace: true })

    } catch (err) {
      console.error('[save] failed:', err)
      alert('Save failed. Please try again.')
      setIsSaving(false)
    }
  }

  const hasContent = boothName || artistName || visualInspiration || notes || photoFiles.length > 0
  const canSave    = !isSaving && !!hasContent

  const selectedTagValues = new Set(tags.map(t => t.value))

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="text-on-surface-variant active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-headline font-bold text-base text-on-surface">New Capture</h2>
        <div className="flex items-center gap-3">
          {/* Favorite toggle */}
          <button onClick={() => setIsFavorite(f => !f)} className="active:scale-95 transition-transform">
            <span className={`material-symbols-outlined text-2xl ${isFavorite ? 'text-primary material-symbols-filled' : 'text-on-surface-variant'}`}>
              favorite
            </span>
          </button>
          <GlowButton variant="primary" onClick={handleSave} disabled={!canSave}>
            {isSaving ? 'Saving…' : 'Save'}
          </GlowButton>
        </div>
      </div>

      {/* ── Booth + Artist ─────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Who / Where
        </p>
        <input
          type="text"
          value={boothName}
          onChange={e => setBoothName(e.target.value)}
          placeholder="Booth name"
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40 transition-all"
        />
        <input
          type="text"
          value={artistName}
          onChange={e => setArtistName(e.target.value)}
          placeholder="Artist name"
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40 transition-all"
        />
      </section>

      {/* ── Photos ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Photos
        </p>
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

        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photoPreviews.map((src, idx) => (
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

        <input ref={cameraInputRef}  type="file" accept="image/*"          onChange={e => handlePhotoSelect(e, 'camera')}  className="hidden" />
        <input ref={libraryInputRef} type="file" accept="image/*" multiple onChange={e => handlePhotoSelect(e, 'library')} className="hidden" />
      </section>

      {/* ── Inspiration fields ─────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          What You Noticed
        </p>
        <textarea
          value={visualInspiration}
          onChange={e => setVisualInspiration(e.target.value)}
          placeholder="Visual inspiration — what caught your eye?"
          rows={2}
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40 transition-all"
        />
        <textarea
          value={emotionalReaction}
          onChange={e => setEmotionalReaction(e.target.value)}
          placeholder="Emotional reaction — how did it make you feel?"
          rows={2}
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40 transition-all"
        />
        <textarea
          value={brandIdea}
          onChange={e => setBrandIdea(e.target.value)}
          placeholder="Brand idea — how does this connect to your work?"
          rows={2}
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40 transition-all"
        />
      </section>

      {/* ── Details ────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Details
        </p>
        <input
          type="text"
          value={materialOrPhrase}
          onChange={e => setMaterialOrPhrase(e.target.value)}
          placeholder="Material or phrase that stood out"
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40 transition-all"
        />
        <input
          type="text"
          value={priceRange}
          onChange={e => setPriceRange(e.target.value)}
          placeholder="Price range (e.g. $10–$40)"
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40 transition-all"
        />
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any other notes…"
          rows={3}
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40 transition-all"
        />
      </section>

      {/* ── Tags ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Tags
        </p>
        <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">sell</span>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type a tag and press Enter"
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none"
          />
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Chip key={tag.value} label={tag.value} color={tag.color} selected onRemove={() => removeTag(tag.value)} />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.filter(t => !selectedTagValues.has(t.value)).map(tag => (
            <Chip key={tag.value} label={tag.value} color={tag.color} onClick={() => addTag(tag.value, tag.color)} />
          ))}
        </div>
      </section>

      {/* ── Optional title ─────────────────────────────────── */}
      <section className="space-y-2">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Custom Title (optional)
        </p>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Leave blank to use booth/artist name"
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40 transition-all"
        />
      </section>

      {/* ── Save footer ────────────────────────────────────── */}
      <GlowButton
        variant="primary"
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-4 text-base"
      >
        <span className="material-symbols-outlined">save</span>
        {isSaving ? 'Saving…' : 'Save Capture'}
      </GlowButton>

    </div>
  )
}
