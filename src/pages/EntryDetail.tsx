import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEntryById, deleteEntry } from '../utils/db'
import { SignedImage } from '../components/ui/SignedImage'
import { Chip } from '../components/ui/Chip'
import { GlowButton } from '../components/ui/GlowButton'
import { formatDate, formatTime } from '../utils/format'
import type { Entry, TagColor } from '../types'

export default function EntryDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [entry,         setEntry]         = useState<Entry | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [activePhoto,   setActivePhoto]   = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,      setDeleting]      = useState(false)

  useEffect(() => {
    if (!id) return
    getEntryById(id).then(({ data }) => {
      setEntry(data)
      setLoading(false)
    })
  }, [id])

  async function handleDelete() {
    if (!entry) return
    setDeleting(true)
    await deleteEntry(entry.id)
    navigate(`/events/${entry.event_id}`, { replace: true })
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

  const images = entry.entry_images ?? []
  const tags   = entry.entry_tags   ?? []

  return (
    <div className="space-y-6 pb-10">

      {/* Nav */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate(`/events/${entry.event_id}`)}
          className="text-on-surface-variant active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-3">
          {entry.is_favorite && (
            <span className="material-symbols-outlined text-primary material-symbols-filled">favorite</span>
          )}
          <button
            onClick={() => navigate(`/entry/${entry.id}/edit`)}
            className="text-on-surface-variant/60 hover:text-primary active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[1.25rem]">edit</span>
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-on-surface-variant/60 hover:text-tertiary active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[1.25rem]">delete</span>
          </button>
        </div>
      </div>

      {/* Title + meta */}
      <div className="space-y-1">
        <h2 className="font-headline font-bold text-2xl text-on-surface leading-tight">
          {entry.title || entry.booth_name || entry.artist_name || formatDate(entry.created_at)}
        </h2>
        <div className="flex items-center gap-2 text-on-surface-variant text-xs flex-wrap">
          {entry.booth_name && <span>{entry.booth_name}</span>}
          {entry.booth_name && entry.artist_name && <span>·</span>}
          {entry.artist_name && <span>{entry.artist_name}</span>}
          {(entry.booth_name || entry.artist_name) && <span>·</span>}
          <span>{formatDate(entry.created_at)}</span>
          <span>·</span>
          <span>{formatTime(entry.created_at)}</span>
        </div>
      </div>

      {/* Photo gallery */}
      {images.length > 0 && (
        <section className="space-y-2">
          <div className="aspect-video rounded-xl overflow-hidden bg-surface-container-low">
            <SignedImage
              storagePath={images[activePhoto].storage_path}
              className="w-full h-full"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActivePhoto(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                    idx === activePhoto ? 'ring-2 ring-primary' : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <SignedImage storagePath={img.storage_path} className="w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Fields */}
      {[
        { label: 'Visual Inspiration',  value: entry.visual_inspiration  },
        { label: 'Emotional Reaction',  value: entry.emotional_reaction  },
        { label: 'Brand Idea',          value: entry.brand_idea          },
        { label: 'Material or Phrase',  value: entry.material_or_phrase  },
        { label: 'Notes',               value: entry.notes               },
        { label: 'Price Range',         value: entry.price_range         },
      ].filter(f => f.value).map(field => (
        <section key={field.label} className="space-y-2">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            {field.label}
          </p>
          <div className="bg-surface-container rounded-xl p-4">
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
              {field.value}
            </p>
          </div>
        </section>
      ))}

      {/* Tags */}
      {tags.length > 0 && (
        <section className="space-y-2">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag }) => (
              <Chip key={tag.id} label={tag.name} color={tag.color as TagColor} selected />
            ))}
          </div>
        </section>
      )}

      {/* Delete confirmation */}
      {confirmDelete ? (
        <div className="rounded-2xl bg-surface-container ring-1 ring-tertiary/30 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-tertiary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-tertiary text-lg">delete_forever</span>
            </div>
            <div>
              <p className="font-headline font-bold text-sm text-on-surface">Delete this entry?</p>
              <p className="text-xs text-on-surface-variant mt-0.5">This cannot be undone.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-xl py-3 bg-surface-container-high text-sm font-bold text-on-surface-variant active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-xl py-3 bg-tertiary/10 ring-1 ring-tertiary/40 text-sm font-bold text-tertiary active:scale-95 disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 pt-2">
          <GlowButton
            variant="secondary"
            onClick={() => navigate(`/events/${entry.event_id}/gallery`)}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-base">photo_library</span>
            Gallery
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={() => navigate(`/events/${entry.event_id}/capture`)}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-base">add_a_photo</span>
            New Capture
          </GlowButton>
        </div>
      )}
    </div>
  )
}
