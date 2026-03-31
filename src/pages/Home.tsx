import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { getEvents } from '../utils/db'
import { GlowButton } from '../components/ui/GlowButton'
import type { Event } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const [events,  setEvents]  = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEvents().then(({ data }) => {
      setEvents(data ?? [])
      setLoading(false)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const mostRecent = events[0] ?? null

  return (
    <div className="space-y-8">

      {/* ── Hero CTA ───────────────────────────────────────── */}
      <section
        role="button"
        onClick={() => mostRecent ? navigate(`/events/${mostRecent.id}/capture`) : navigate('/events')}
        className="relative aspect-video rounded-xl overflow-hidden bg-surface-container-low flex flex-col items-center justify-center cursor-pointer group transition-all ring-1 ring-primary/10 hover:ring-primary/40"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent" />
        <div className="relative z-10 flex flex-col items-center text-center p-8">
          <div className="w-20 h-20 mb-5 rounded-full flex items-center justify-center bg-gradient-cta shadow-neon-cyan group-active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-on-primary text-4xl material-symbols-filled">
              add_a_photo
            </span>
          </div>
          <h2 className="font-headline font-bold text-3xl tracking-tight text-on-surface mb-1">
            {mostRecent ? 'New Capture' : 'Get Started'}
          </h2>
          <p className="text-on-surface-variant text-xs font-bold tracking-widest uppercase">
            {mostRecent ? mostRecent.title : 'Create your first event'}
          </p>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-surface-container-highest/60 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
            Ready
          </span>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow-sm" />
        </div>
      </section>

      {/* ── Recent Events ──────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-headline font-bold text-xl text-on-surface">My Events</h3>
            <p className="text-on-surface-variant text-xs mt-0.5">
              {loading ? 'Loading…' : events.length === 0 ? 'No events yet' : `${events.length} event${events.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {events.length > 0 && (
            <GlowButton variant="ghost" onClick={() => navigate('/events')}>
              View All
            </GlowButton>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl bg-surface-container p-8 flex flex-col items-center text-center gap-4">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl">event</span>
            <div>
              <p className="font-headline font-bold text-on-surface">No events yet</p>
              <p className="text-on-surface-variant text-sm mt-1">Create an event to start capturing inspiration</p>
            </div>
            <GlowButton variant="primary" onClick={() => navigate('/events')} icon="add">
              New Event
            </GlowButton>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 3).map(event => (
              <button
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="w-full text-left rounded-xl bg-surface-container p-4 hover:bg-surface-container-high transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <p className="font-headline font-bold text-on-surface">{event.title}</p>
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">chevron_right</span>
                </div>
                {event.location && (
                  <p className="text-xs text-on-surface-variant mt-0.5">{event.location}</p>
                )}
                <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-2 ${
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
      </section>

      {/* ── Sign out ───────────────────────────────────────── */}
      <div className="flex justify-center pt-2">
        <button onClick={handleSignOut} className="text-xs text-on-surface-variant hover:text-primary transition-colors">
          Sign out
        </button>
      </div>

    </div>
  )
}
