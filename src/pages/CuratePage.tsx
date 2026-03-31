import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { getEntries, getCuratedSets, createCuratedSet, addEntryToCuratedSet } from '../utils/db'
import { SignedImage } from '../components/ui/SignedImage'
import { GlowButton } from '../components/ui/GlowButton'
import { formatDate } from '../utils/format'
import type { Entry, CuratedSet, CuratedSetStatus } from '../types'

const STATUS_STYLE: Record<CuratedSetStatus, string> = {
  draft:    'bg-secondary-container/30 text-secondary',
  ready:    'bg-primary/20 text-primary',
  archived: 'bg-surface-container-highest text-on-surface-variant',
}

export default function CuratePage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()

  const [eventTitle,   setEventTitle]   = useState('')
  const [entries,      setEntries]      = useState<Entry[]>([])
  const [sets,         setSets]         = useState<CuratedSet[]>([])
  const [loading,      setLoading]      = useState(true)

  // View mode: 'browse' = see existing sets | 'selecting' = pick entries for new set
  const [mode,         setMode]         = useState<'browse' | 'selecting'>('browse')
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())

  // New-set form
  const [showForm,     setShowForm]     = useState(false)
  const [setTitle,     setSetTitle]     = useState('')
  const [setDesc,      setSetDesc]      = useState('')
  const [creating,     setCreating]     = useState(false)

  // Tag / search filter (in selecting mode)
  const [searchQuery,  setSearchQuery]  = useState('')

  const loadData = useCallback(async () => {
    if (!eventId) return
    const [{ data: ev }, { data: active }, { data: setsData }] = await Promise.all([
      supabase.from('events').select('title').eq('id', eventId).single(),
      getEntries(eventId, false),
      getCuratedSets(eventId),
    ])
    setEventTitle(ev?.title ?? '')
    setEntries(active ?? [])
    setSets(setsData ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => { loadData() }, [loadData])

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function enterSelecting() {
    setMode('selecting')
    setSelectedIds(new Set())
    setShowForm(false)
    setSetTitle('')
    setSetDesc('')
  }

  function cancelSelecting() {
    setMode('browse')
    setSelectedIds(new Set())
    setShowForm(false)
    setSearchQuery('')
  }

  async function handleCreateSet() {
    if (!eventId || !setTitle.trim() || selectedIds.size === 0) return
    setCreating(true)
    const { data: newSet, error } = await createCuratedSet({
      event_id:    eventId,
      title:       setTitle.trim(),
      description: setDesc.trim() || undefined,
    })
    if (error || !newSet) {
      alert('Could not create set: ' + error?.message)
      setCreating(false)
      return
    }
    // Add selected entries in order
    const ids = Array.from(selectedIds)
    await Promise.all(ids.map((entryId, i) => addEntryToCuratedSet(newSet.id, entryId, i)))
    navigate(`/events/${eventId}/curated-sets/${newSet.id}`)
  }

  // Filter entries in selecting mode
  const q = searchQuery.trim().toLowerCase()
  const displayed = q
    ? entries.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.booth_name?.toLowerCase().includes(q) ||
        e.artist_name?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q) ||
        e.entry_tags?.some(({ tag }) => tag.name.toLowerCase().includes(q))
      )
    : entries

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-surface px-6 py-10 space-y-6 ${mode === 'selecting' ? 'pb-48' : 'pb-10'}`}>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => mode === 'selecting' ? cancelSelecting() : navigate(`/events/${eventId}`)}
          className="text-on-surface-variant active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">
            {mode === 'selecting' ? 'close' : 'arrow_back'}
          </span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-2xl text-on-surface">Curate</h1>
          {eventTitle && <p className="text-on-surface-variant text-xs mt-0.5">{eventTitle}</p>}
        </div>
        {mode === 'browse' && (
          <GlowButton variant="primary" onClick={enterSelecting} icon="add">
            New Set
          </GlowButton>
        )}
      </div>

      {/* ── BROWSE MODE ─────────────────────────────────── */}
      {mode === 'browse' && (
        <>
          {sets.length === 0 ? (
            <div className="rounded-xl bg-surface-container p-10 flex flex-col items-center text-center gap-4">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">collections_bookmark</span>
              <div>
                <p className="font-headline font-bold text-on-surface">No curated sets yet</p>
                <p className="text-on-surface-variant text-sm mt-1">
                  Select entries from your captures and group them into a named set.
                </p>
              </div>
              <GlowButton variant="primary" onClick={enterSelecting} icon="add">
                Create Your First Set
              </GlowButton>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                {sets.length} Curated {sets.length === 1 ? 'Set' : 'Sets'}
              </p>
              {sets.map(set => {
                const entryCount = set.curated_set_entries?.length ?? 0
                return (
                  <button
                    key={set.id}
                    onClick={() => navigate(`/events/${eventId}/curated-sets/${set.id}`)}
                    className="w-full text-left rounded-xl bg-surface-container p-5 space-y-2 hover:bg-surface-container-high transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-headline font-bold text-on-surface">{set.title}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[set.status]}`}>
                        {set.status}
                      </span>
                    </div>
                    {set.description && (
                      <p className="text-xs text-on-surface-variant line-clamp-2">{set.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">photo_library</span>
                        {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                      </span>
                      <span>·</span>
                      <span>{formatDate(set.created_at)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── SELECTING MODE ──────────────────────────────── */}
      {mode === 'selecting' && (
        <>
          {/* Instruction */}
          <div className="rounded-xl bg-primary/5 ring-1 ring-primary/20 px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-lg">info</span>
            <p className="text-xs text-on-surface-variant">
              Tap entries to select them, then name your curated set below.
            </p>
          </div>

          {/* Search */}
          {entries.length > 4 && (
            <div className="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-primary/40">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search entries…"
                className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          )}

          {/* Select all / deselect */}
          {displayed.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                {selectedIds.size === 0
                  ? `${displayed.length} entries available`
                  : `${selectedIds.size} of ${displayed.length} selected`}
              </p>
              <button
                onClick={() => {
                  const allShownSelected = displayed.every(e => selectedIds.has(e.id))
                  if (allShownSelected) {
                    setSelectedIds(new Set())
                  } else {
                    setSelectedIds(new Set(displayed.map(e => e.id)))
                  }
                }}
                className="text-xs font-bold text-primary uppercase tracking-widest"
              >
                {displayed.every(e => selectedIds.has(e.id)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}

          {/* Entry list */}
          <div className="space-y-3">
            {displayed.map(entry => {
              const isSelected = selectedIds.has(entry.id)
              const thumb      = entry.entry_images?.[0]
              const label      = entry.title || entry.booth_name || entry.artist_name || formatDate(entry.created_at)
              return (
                <button
                  key={entry.id}
                  onClick={() => toggleSelect(entry.id)}
                  className={`w-full text-left rounded-xl overflow-hidden transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'bg-surface-container hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-4 p-3">
                    {/* Thumbnail */}
                    {thumb ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <SignedImage storagePath={thumb.storage_path} className="w-full h-full" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-lg material-symbols-filled">check_circle</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        isSelected ? 'bg-primary/20' : 'bg-surface-container-high'
                      }`}>
                        {isSelected
                          ? <span className="material-symbols-outlined text-primary text-xl material-symbols-filled">check_circle</span>
                          : <span className="material-symbols-outlined text-on-surface-variant text-xl">text_snippet</span>
                        }
                      </div>
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-headline font-bold text-sm text-on-surface truncate">{label}</p>
                      {entry.visual_inspiration && (
                        <p className="text-xs text-on-surface-variant line-clamp-1">{entry.visual_inspiration}</p>
                      )}
                      {entry.entry_tags && entry.entry_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {entry.entry_tags.slice(0, 3).map(({ tag }) => (
                            <span key={tag.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Checkbox */}
                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-primary border-primary' : 'border-on-surface-variant/40'
                    }`}>
                      {isSelected && <span className="material-symbols-outlined text-on-primary text-sm material-symbols-filled">check</span>}
                    </div>
                  </div>
                </button>
              )
            })}

            {displayed.length === 0 && (
              <div className="rounded-xl bg-surface-container p-8 flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">search_off</span>
                <p className="text-sm text-on-surface-variant">No entries match your search</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Fixed bottom bar (selecting mode) ───────────── */}
      {mode === 'selecting' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/20 space-y-3">
          {selectedIds.size === 0 ? (
            <p className="text-center text-xs text-on-surface-variant">Select entries above to continue</p>
          ) : showForm ? (
            /* Name the set */
            <div className="space-y-3">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">
                {selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'} selected
              </p>
              <input
                type="text"
                value={setTitle}
                onChange={e => setSetTitle(e.target.value)}
                placeholder="Set name  e.g. Celestial Motifs"
                autoFocus
                className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40"
              />
              <input
                type="text"
                value={setDesc}
                onChange={e => setSetDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40"
              />
              <div className="flex gap-3">
                <GlowButton
                  variant="primary"
                  onClick={handleCreateSet}
                  disabled={!setTitle.trim() || creating}
                  className="flex-1 py-3"
                >
                  {creating ? 'Creating…' : 'Create Set'}
                </GlowButton>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 text-on-surface-variant text-sm font-bold"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <GlowButton
              variant="primary"
              onClick={() => setShowForm(true)}
              icon="collections_bookmark"
              className="w-full py-3"
            >
              Create Set from {selectedIds.size} {selectedIds.size === 1 ? 'Entry' : 'Entries'}
            </GlowButton>
          )}
        </div>
      )}
    </div>
  )
}
