import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import {
  getEntryById,
  updateEntry,
  addEntryImage,
  deleteEntryImage,
  upsertTag,
  deleteAllEntryTags,
  addTagToEntry,
  getTags,
} from '../utils/db'
import { SignedImage } from '../components/ui/SignedImage'
import { Chip } from '../components/ui/Chip'
import { GlowButton } from '../components/ui/GlowButton'
import { compressImage } from '../utils/image'
import type { Entry, EntryImage, Tag, TagColor } from '../types'

type DraftTag = { value: string; color: TagColor }
const COLOR_CYCLE: TagColor[] = ['cyan', 'purple', 'pink']

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export default function EditEntry() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  const [entry,   setEntry]   = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Text fields
  const [title,             setTitle]             = useState('')
  const [boothName,         setBoothName]         = useState('')
  const [artistName,        setArtistName]        = useState('')
  const [visualInspiration, setVisualInspiration] = useState('')
  const [emotionalReaction, setEmotionalReaction] = useState('')
  const [brandIdea,         setBrandIdea]         = useState('')
  const [materialOrPhrase,  setMaterialOrPhrase]  = useState('')
  const [notes,             setNotes]             = useState('')
  const [priceRange,        setPriceRange]        = useState('')
  const [isFavorite,        setIsFavorite]        = useState(false)

  // Images
  const [existingImages,  setExistingImages]  = useState<EntryImage[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<{ id: string; path: string }[]>([])
  const [newFiles,        setNewFiles]        = useState<File[]>([])
  const [newPreviews,     setNewPreviews]     = useState<string[]>([])

  // Tags
  const [tags,          setTags]          = useState<DraftTag[]>([])
  const [tagInput,      setTagInput]      = useState('')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])

  useEffect(() => {
    if (!id) return
    getEntryById(id).then(({ data }) => {
      if (!data) { setLoading(false); return }
      setEntry(data)
      setTitle(data.title ?? '')
      setBoothName(data.booth_name ?? '')
      setArtistName(data.artist_name ?? '')
      setVisualInspiration(data.visual_inspiration ?? '')
      setEmotionalReaction(data.emotional_reaction ?? '')
      setBrandIdea(data.brand_idea ?? '')
      setMaterialOrPhrase(data.material_or_phrase ?? '')
      setNotes(data.notes ?? '')
      setPriceRange(data.price_range ?? '')
      setIsFavorite(data.is_favorite)
      setExistingImages(data.entry_images ?? [])
      setTags(
        (data.entry_tags ?? []).map((et: { tag: Tag }, i: number) => ({
          value: et.tag.name,
          color: (et.tag.color as TagColor) ?? COLOR_CYCLE[i % COLOR_CYCLE.length],
        }))
      )
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    getTags().then(({ data }) => {
      if (data) setAvailableTags(data)
    })
  }, [])

  // ── Photo handlers ──────────────────────────────────────────────────────────
  async function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const file of files) {
      const base64     = await blobToBase64(file)
      const compressed = await compressImage(base64)
      setNewFiles(prev    => [...prev, file])
      setNewPreviews(prev => [...prev, compressed])
    }
  }

  function removeExistingImage(img: EntryImage) {
    setExistingImages(prev => prev.filter(i => i.id !== img.id))
    setRemovedImageIds(prev => [...prev, { id: img.id, path: img.storage_path }])
  }

  function removeNewPhoto(idx: number) {
    setNewFiles(prev    => prev.filter((_, i) => i !== idx))
    setNewPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Tag handlers ────────────────────────────────────────────────────────────
  function addTag(value: string, color?: TagColor) {
    const clean = value.trim().replace(/^#/, '')
    if (!clean || tags.some(t => t.value === clean)) return
    setTags(prev => [...prev, { value: clean, color: color ?? COLOR_CYCLE[prev.length % COLOR_CYCLE.length] }])
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

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!entry) return
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Update text fields
      await updateEntry(entry.id, {
        title:              title.trim() || null,
        booth_name:         boothName.trim() || null,
        artist_name:        artistName.trim() || null,
        visual_inspiration: visualInspiration.trim() || null,
        emotional_reaction: emotionalReaction.trim() || null,
        brand_idea:         brandIdea.trim() || null,
        material_or_phrase: materialOrPhrase.trim() || null,
        notes:              notes.trim() || null,
        price_range:        priceRange.trim() || null,
        is_favorite:        isFavorite,
      })

      // 2. Delete removed images
      for (const img of removedImageIds) {
        await deleteEntryImage(img.id, img.path)
      }

      // 3. Upload new images
      for (const file of newFiles) {
        const ext         = file.name.split('.').pop() ?? 'jpg'
        const fileName    = `${Date.now()}.${ext}`
        const storagePath = `${user.id}/${entry.id}/${fileName}`
        const base64      = await blobToBase64(file)
        const compressed  = await compressImage(base64)
        const res         = await fetch(compressed)
        const blob        = await res.blob()

        const { error } = await supabase.storage
          .from('entry-images')
          .upload(storagePath, blob, { contentType: blob.type })

        if (!error) {
          await addEntryImage({
            entry_id:     entry.id,
            storage_path: storagePath,
            public_url:   '',
            file_name:    fileName,
            mime_type:    blob.type,
            file_size:    blob.size,
          })
        }
      }

      // 4. Replace all tags
      await deleteAllEntryTags(entry.id)
      for (const draftTag of tags) {
        const { data: savedTag } = await upsertTag(draftTag.value, draftTag.color)
        if (savedTag) await addTagToEntry(entry.id, savedTag.id)
      }

      navigate(`/entry/${entry.id}`, { replace: true })
    } catch (err) {
      console.error('[edit:save] failed:', err)
      alert('Save failed. Please try again.')
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">
          progress_activity
        </span>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-5xl">search_off</span>
        <p className="font-headline font-bold text-on-surface">Entry not found</p>
        <GlowButton variant="secondary" onClick={() => navigate(-1)}>Go back</GlowButton>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">

      {/* Nav */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => navigate(-1)} className="text-on-surface-variant active:scale-95 transition-transform">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-headline font-bold text-base text-on-surface">Edit Entry</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsFavorite(f => !f)} className="active:scale-95 transition-transform">
            <span className={`material-symbols-outlined text-2xl ${isFavorite ? 'text-primary material-symbols-filled' : 'text-on-surface-variant'}`}>
              favorite
            </span>
          </button>
          <GlowButton variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </GlowButton>
        </div>
      </div>

      {/* Who / Where */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Who / Where</p>
        <input type="text" value={boothName}  onChange={e => setBoothName(e.target.value)}  placeholder="Booth name"   className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40" />
        <input type="text" value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artist name"  className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40" />
      </section>

      {/* Photos */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Photos</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => cameraInputRef.current?.click()}  className="rounded-xl bg-surface-container py-4 flex flex-col items-center gap-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all active:scale-95">
            <span className="material-symbols-outlined text-2xl">photo_camera</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Take Photo</span>
          </button>
          <button onClick={() => libraryInputRef.current?.click()} className="rounded-xl bg-surface-container py-4 flex flex-col items-center gap-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-all active:scale-95">
            <span className="material-symbols-outlined text-2xl">photo_library</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">From Library</span>
          </button>
        </div>

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map(img => (
              <div key={img.id} className="aspect-square rounded-xl overflow-hidden relative">
                <SignedImage storagePath={img.storage_path} className="w-full h-full" />
                <button onClick={() => removeExistingImage(img)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-white">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New previews */}
        {newPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {newPreviews.map((src, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden relative">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeNewPhoto(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-white">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <input ref={cameraInputRef}  type="file" accept="image/*"          onChange={handlePhotoAdd} className="hidden" />
        <input ref={libraryInputRef} type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
      </section>

      {/* Inspiration fields */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">What You Noticed</p>
        <textarea value={visualInspiration}  onChange={e => setVisualInspiration(e.target.value)}  placeholder="Visual inspiration"    rows={2} className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40" />
        <textarea value={emotionalReaction}  onChange={e => setEmotionalReaction(e.target.value)}  placeholder="Emotional reaction"    rows={2} className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40" />
        <textarea value={brandIdea}          onChange={e => setBrandIdea(e.target.value)}          placeholder="Brand idea"            rows={2} className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40" />
      </section>

      {/* Details */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Details</p>
        <input type="text" value={materialOrPhrase} onChange={e => setMaterialOrPhrase(e.target.value)} placeholder="Material or phrase" className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40" />
        <input type="text" value={priceRange}        onChange={e => setPriceRange(e.target.value)}        placeholder="Price range"        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40" />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" rows={3} className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40" />
      </section>

      {/* Tags */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tags</p>

        {/* Available tags quick-select */}
        {availableTags.filter(t => !tags.some(dt => dt.value === t.name)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTags
              .filter(t => !tags.some(dt => dt.value === t.name))
              .map(t => (
                <Chip
                  key={t.id}
                  label={t.name}
                  color={t.color as TagColor}
                  selected={false}
                  onClick={() => addTag(t.name, t.color as TagColor)}
                />
              ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-primary/40">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">sell</span>
          <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type a tag and press Enter" className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none" />
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Chip key={tag.value} label={tag.value} color={tag.color} selected onRemove={() => removeTag(tag.value)} />
            ))}
          </div>
        )}
      </section>

      {/* Optional title */}
      <section className="space-y-2">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Custom Title (optional)</p>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Leave blank to use booth/artist name" className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40" />
      </section>

      {/* Save footer */}
      <GlowButton variant="primary" onClick={handleSave} disabled={isSaving} className="w-full py-4 text-base">
        <span className="material-symbols-outlined">save</span>
        {isSaving ? 'Saving…' : 'Save Changes'}
      </GlowButton>

    </div>
  )
}
