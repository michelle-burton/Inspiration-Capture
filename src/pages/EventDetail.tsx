import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'

import { getEntries } from '../utils/db'
import type { Event, Entry } from '../types'
import { GlowButton } from '../components/ui/GlowButton'
import { SignedImage } from '../components/ui/SignedImage'

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()

  const [event,   setEvent]   = useState<Event | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return
    loadData()
  }, [eventId])

  async function loadData() {
    // Load event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    // Load entries
    const { data: entryData } = await getEntries(eventId!)

    setEvent(eventData)
    setEntries(entryData ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">
          progress_activity
        </span>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-on-surface-variant">Event not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface px-6 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/events')}
          className="text-on-surface-variant active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            {event.title}
          </h1>
          {event.location && (
            <p className="text-on-surface-variant text-xs mt-0.5">{event.location}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <GlowButton
          variant="primary"
          onClick={() => navigate(`/events/${eventId}/capture`)}
          icon="add_a_photo"
          className="py-4"
        >
          New Capture
        </GlowButton>
        <GlowButton
          variant="secondary"
          onClick={() => navigate(`/events/${eventId}/gallery`)}
          icon="photo_library"
          className="py-4"
        >
          Gallery
        </GlowButton>
      </div>

      {/* Entry count */}
      <p className="text-on-surface-variant text-xs">
        {entries.length} capture{entries.length !== 1 ? 's' : ''} in this event
      </p>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="rounded-xl bg-surface-container p-10 flex flex-col items-center text-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl">
            add_a_photo
          </span>
          <div>
            <p className="font-headline font-bold text-on-surface">No captures yet</p>
            <p className="text-on-surface-variant text-sm mt-1">
              Tap New Capture to start capturing inspiration
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => navigate(`/entry/${entry.id}`)}
              className="w-full text-left rounded-xl bg-surface-container overflow-hidden hover:bg-surface-container-high transition-all active:scale-[0.98]"
            >
              {/* Thumbnail */}
              {entry.entry_images && entry.entry_images.length > 0 && (
                <SignedImage
                  storagePath={entry.entry_images[0].storage_path}
                  className="w-full h-40 rounded-t-xl"
                />
              )}

              {/* Text content */}
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-headline font-bold text-on-surface">
                    {entry.title || entry.booth_name || entry.artist_name || 'Untitled'}
                  </p>
                  {entry.is_favorite && (
                    <span className="material-symbols-outlined text-primary text-sm material-symbols-filled">
                      favorite
                    </span>
                  )}
                </div>
                {entry.booth_name && entry.title && (
                  <p className="text-xs text-on-surface-variant">{entry.booth_name}</p>
                )}
                {entry.visual_inspiration && (
                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {entry.visual_inspiration}
                  </p>
                )}
                {entry.entry_tags && entry.entry_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {entry.entry_tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
