import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { getEvents, createEvent } from '../utils/db'
import type { Event } from '../types'
import { GlowButton } from '../components/ui/GlowButton'

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export default function Events() {
  const navigate = useNavigate()
  const [events,   setEvents]   = useState<Event[]>([])
  const [loading,  setLoading]  = useState(true)
  const [creating, setCreating] = useState(false)
  const [title,    setTitle]    = useState('')
  const [location, setLocation] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    const { data } = await getEvents()
    setEvents(data ?? [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)

    const { data, error } = await createEvent({
      title:    title.trim(),
      slug:     slugify(title.trim()),
      location: location.trim() || undefined,
    })

    if (error) {
      alert('Could not create event: ' + error.message)
    } else if (data) {
      navigate(`/events/${data.id}`)
    }
    setCreating(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
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

  return (
    <div className="min-h-screen bg-surface px-6 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            My Events
          </h1>
          <p className="text-on-surface-variant text-xs mt-0.5">
            Select or create an event to begin capturing
          </p>
        </div>
        <button onClick={handleSignOut} className="text-on-surface-variant text-xs">
          Sign out
        </button>
      </div>

      {/* Event list */}
      {events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => navigate(`/events/${event.id}`)}
              className="w-full text-left rounded-xl bg-surface-container p-5 space-y-1 hover:bg-surface-container-high transition-all active:scale-[0.98]"
            >
              <p className="font-headline font-bold text-on-surface">{event.title}</p>
              {event.location && (
                <p className="text-xs text-on-surface-variant">{event.location}</p>
              )}
              <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${
                event.status === 'active'   ? 'bg-primary/20 text-primary' :
                event.status === 'archived' ? 'bg-surface-container-highest text-on-surface-variant' :
                                              'bg-secondary-container/30 text-secondary'
              }`}>
                {event.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm ? (
        <form onSubmit={handleCreate} className="space-y-4 rounded-xl bg-surface-container p-5">
          <p className="font-headline font-bold text-on-surface">New Event</p>
          <input
            type="text"
            placeholder="Event title  e.g. C2E2 Chicago 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40"
          />
          <input
            type="text"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40"
          />
          <div className="flex gap-3">
            <GlowButton variant="primary" disabled={creating} className="flex-1">
              {creating ? 'Creating…' : 'Create Event'}
            </GlowButton>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 text-on-surface-variant text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <GlowButton
          variant="primary"
          onClick={() => setShowForm(true)}
          icon="add"
          className="w-full py-4"
        >
          New Event
        </GlowButton>
      )}
    </div>
  )
}
