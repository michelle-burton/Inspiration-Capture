import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEntries } from '../utils/db'
import { SignedImage } from '../components/ui/SignedImage'
import { Chip } from '../components/ui/Chip'
import { GlowButton } from '../components/ui/GlowButton'
import type { Entry, TagColor } from '../types'

export default function Gallery() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()

  const [entries,   setEntries]   = useState<Entry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    getEntries(eventId).then(({ data }) => {
      setEntries(data ?? [])
      setLoading(false)
    })
  }, [eventId])

  // Collect unique tags across all entries
  const tagMap = new Map<string, TagColor>()
  entries.forEach(e =>
    e.entry_tags?.forEach(({ tag }) => {
      if (!tagMap.has(tag.name)) tagMap.set(tag.name, tag.color as TagColor)
    })
  )
  const allTags = Array.from(tagMap.entries())

  const filtered = activeTag
    ? entries.filter(e => e.entry_tags?.some(({ tag }) => tag.name === activeTag))
    : entries

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="text-on-surface-variant active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="font-headline font-bold text-2xl text-on-surface">Gallery</h2>
          <p className="text-on-surface-variant text-xs">
            {entries.length} capture{entries.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip
            label="All"
            selected={activeTag === null}
            onClick={() => setActiveTag(null)}
          />
          {allTags.map(([name, color]) => (
            <Chip
              key={name}
              label={name}
              color={color}
              selected={activeTag === name}
              onClick={() => setActiveTag(activeTag === name ? null : name)}
            />
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-surface-container p-10 flex flex-col items-center text-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl">
            photo_library
          </span>
          <div>
            <p className="font-headline font-bold text-on-surface">No captures yet</p>
            <p className="text-on-surface-variant text-sm mt-1">
              {activeTag
                ? `No entries tagged #${activeTag}`
                : 'Start capturing inspiration to fill your gallery'}
            </p>
          </div>
          {!activeTag && (
            <GlowButton
              variant="primary"
              onClick={() => navigate(`/events/${eventId}/capture`)}
              icon="add_a_photo"
            >
              New Capture
            </GlowButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(entry => (
            <button
              key={entry.id}
              onClick={() => navigate(`/entry/${entry.id}`)}
              className="text-left rounded-xl bg-surface-container overflow-hidden hover:bg-surface-container-high transition-all active:scale-[0.98]"
            >
              {/* Thumbnail */}
              {entry.entry_images && entry.entry_images.length > 0 ? (
                <SignedImage
                  storagePath={entry.entry_images[0].storage_path}
                  className="w-full h-32"
                />
              ) : (
                <div className="w-full h-32 bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">
                    {entry.source_type === 'text_only' ? 'notes' : 'image'}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="font-headline font-bold text-sm text-on-surface line-clamp-1">
                  {entry.title || entry.booth_name || entry.artist_name || 'Untitled'}
                </p>
                {entry.visual_inspiration && (
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">
                    {entry.visual_inspiration}
                  </p>
                )}
                <div className="flex items-center justify-between pt-0.5">
                  {entry.entry_tags && entry.entry_tags.length > 0 && (
                    <span className="text-[10px] font-bold text-primary">
                      {entry.entry_tags[0].tag.name}
                      {entry.entry_tags.length > 1 && ` +${entry.entry_tags.length - 1}`}
                    </span>
                  )}
                  {entry.is_favorite && (
                    <span className="material-symbols-outlined text-primary text-sm material-symbols-filled ml-auto">
                      favorite
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
