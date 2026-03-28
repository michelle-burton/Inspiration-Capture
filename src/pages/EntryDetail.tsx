import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { Chip } from '../components/ui/Chip'
import { GlowButton } from '../components/ui/GlowButton'
import { formatDate, formatTime } from '../utils/format'

// Entry Detail — full view of a single capture.
// Displays photo gallery, audio playback, transcript, tags, observations.
export default function EntryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getById, removeEntry } = useEntries()
  const [activePhoto, setActivePhoto] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const entry = id ? getById(id) : undefined

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-5xl">
          search_off
        </span>
        <p className="font-headline font-bold text-on-surface">Entry not found</p>
        <GlowButton variant="secondary" onClick={() => navigate('/gallery')}>
          Back to Gallery
        </GlowButton>
      </div>
    )
  }

  function handleDelete() {
    if (!entry) return
    removeEntry(entry.id)
    navigate('/gallery', { replace: true })
  }

  return (
    <div className="space-y-6">
      {/* ── Nav bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate(-1)}
          className="text-on-surface-variant active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        {/* Delete trigger — first tap reveals the confirmation strip at the bottom */}
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-on-surface-variant/60 active:scale-95 transition-all hover:text-tertiary"
          aria-label="Delete entry"
        >
          <span className="material-symbols-outlined text-[1.25rem]">delete</span>
        </button>
      </div>

      {/* ── Title + meta ─────────────────────────────────── */}
      <div className="space-y-1">
        <h2 className="font-headline font-bold text-2xl text-on-surface leading-tight">
          {entry.title}
        </h2>
        <div className="flex items-center gap-3 text-on-surface-variant text-xs">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {formatDate(entry.createdAt)}
          </span>
          <span className="text-outline">·</span>
          <span>{formatTime(entry.createdAt)}</span>
          <span className="text-outline">·</span>
          <span className="capitalize">{entry.source}</span>
        </div>
      </div>

      {/* ── Photo gallery ────────────────────────────────── */}
      {entry.photos.length > 0 && (
        <section className="space-y-2">
          <div className="aspect-video rounded-xl overflow-hidden bg-surface-container-low">
            <img
              src={entry.photos[activePhoto]}
              alt={`Photo ${activePhoto + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          {entry.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {entry.photos.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhoto(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                    idx === activePhoto
                      ? 'ring-2 ring-primary'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={src} alt={`thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Audio playback ───────────────────────────────── */}
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
        </section>
      )}

      {/* ── Transcript ───────────────────────────────────── */}
      {entry.transcript && (
        <section className="space-y-2">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Transcript / Notes
          </p>
          <div className="bg-surface-container rounded-xl p-4">
            <p className="text-sm text-on-surface font-body leading-relaxed whitespace-pre-wrap">
              {entry.transcript}
            </p>
          </div>
        </section>
      )}

      {/* ── Observations ─────────────────────────────────── */}
      {entry.observations && (
        <section className="space-y-2">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Key Observations
          </p>
          <div className="bg-surface-container rounded-xl p-4">
            <p className="text-sm text-on-surface font-body leading-relaxed whitespace-pre-wrap">
              {entry.observations}
            </p>
          </div>
        </section>
      )}

      {/* ── Tags ─────────────────────────────────────────── */}
      {entry.tags.length > 0 && (
        <section className="space-y-2">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <Chip key={tag.value} label={tag.value} color={tag.color} selected />
            ))}
          </div>
        </section>
      )}

      {/* ── Footer actions ───────────────────────────────── */}
      {confirmDelete ? (
        /* ── Confirmation strip — replaces footer when delete is tapped ── */
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
              className="flex-1 rounded-xl py-3 bg-surface-container-high text-sm font-bold text-on-surface-variant active:scale-95 transition-all hover:bg-surface-container-highest"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 rounded-xl py-3 bg-tertiary/10 ring-1 ring-tertiary/40 text-sm font-bold text-tertiary active:scale-95 transition-all hover:bg-tertiary/20"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        /* ── Normal footer ────────────────────────────────────────────── */
        <div className="flex gap-3 pt-2">
          <GlowButton variant="secondary" onClick={() => navigate('/gallery')} className="flex-1">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Gallery
          </GlowButton>
          <GlowButton variant="primary" onClick={() => navigate('/capture')} className="flex-1">
            <span className="material-symbols-outlined text-base">add_a_photo</span>
            New Capture
          </GlowButton>
        </div>
      )}
    </div>
  )
}
