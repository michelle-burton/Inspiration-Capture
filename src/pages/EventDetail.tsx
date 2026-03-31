import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { getEntries, toggleFavorite, setArchived } from '../utils/db'
import type { Event, Entry } from '../types'
import { GlowButton } from '../components/ui/GlowButton'
import { SignedImage } from '../components/ui/SignedImage'

type FilterMode = 'all' | 'favorites' | 'archived'

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()

  const [event,         setEvent]         = useState<Event | null>(null)
  const [entries,       setEntries]       = useState<Entry[]>([])
  const [archivedList,  setArchivedList]  = useState<Entry[]>([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState<FilterMode>('all')
  const [searchQuery,   setSearchQuery]   = useState('')
  const [activeTag,     setActiveTag]     = useState<string | null>(null)

  // ── Bulk select state ───────────────────────────────────────────────────────
  const [selectMode,  setSelectMode]  = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    if (!eventId) return
    const [{ data: eventData }, { data: active }, { data: arch }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      getEntries(eventId, false),
      getEntries(eventId, true),
    ])
    setEvent(eventData)
    setEntries(active ?? [])
    setArchivedList(arch ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => { loadData() }, [loadData])

  // ── Filter mode switch ──────────────────────────────────────────────────────
  function switchFilter(mode: FilterMode) {
    setFilter(mode)
    setSearchQuery('')
    setActiveTag(null)
  }

  // ── Select mode helpers ─────────────────────────────────────────────────────
  function enterSelectMode() {
    setSelectMode(true)
    setSelectedIds(new Set())
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(displayed.map(e => e.id)))
  }

  // ── Single-entry actions ────────────────────────────────────────────────────
  async function handleToggleFavorite(e: React.MouseEvent, entry: Entry) {
    e.stopPropagation()
    const next = !entry.is_favorite
    setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, is_favorite: next } : en))
    await toggleFavorite(entry.id, next)
  }

  async function handleArchive(e: React.MouseEvent, entry: Entry) {
    e.stopPropagation()
    setEntries(prev      => prev.filter(en => en.id !== entry.id))
    setArchivedList(prev => [{ ...entry, is_archived: true }, ...prev])
    await setArchived(entry.id, true)
  }

  async function handleUnarchive(e: React.MouseEvent, entry: Entry) {
    e.stopPropagation()
    setArchivedList(prev => prev.filter(en => en.id !== entry.id))
    setEntries(prev      => [{ ...entry, is_archived: false }, ...prev])
    await setArchived(entry.id, false)
    if (archivedList.length === 1) setFilter('all')
  }

  // ── Bulk actions ────────────────────────────────────────────────────────────
  async function bulkArchive() {
    const ids = Array.from(selectedIds)
    setEntries(prev      => prev.filter(en => !selectedIds.has(en.id)))
    setArchivedList(prev => [
      ...entries.filter(en => selectedIds.has(en.id)).map(en => ({ ...en, is_archived: true })),
      ...prev,
    ])
    await Promise.all(ids.map(id => setArchived(id, true)))
    exitSelectMode()
  }

  async function bulkUnarchive() {
    const ids = Array.from(selectedIds)
    const toRestore = archivedList.filter(en => selectedIds.has(en.id))
    setArchivedList(prev => prev.filter(en => !selectedIds.has(en.id)))
    setEntries(prev      => [...toRestore.map(en => ({ ...en, is_archived: false })), ...prev])
    await Promise.all(ids.map(id => setArchived(id, false)))
    if (archivedList.length === ids.length) setFilter('all')
    exitSelectMode()
  }

  async function bulkFavorite(value: boolean) {
    const ids = Array.from(selectedIds)
    setEntries(prev => prev.map(en => selectedIds.has(en.id) ? { ...en, is_favorite: value } : en))
    await Promise.all(ids.map(id => toggleFavorite(id, value)))
    exitSelectMode()
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const favoriteCount = entries.filter(e => e.is_favorite).length
  const archivedCount = archivedList.length

  // Base list for current filter mode
  const baseList =
    filter === 'favorites' ? entries.filter(e => e.is_favorite) :
    filter === 'archived'  ? archivedList :
                             entries

  // Collect unique tags from the base list for the tag chip row
  const tagMap = new Map<string, string>()
  baseList.forEach(e =>
    e.entry_tags?.forEach(({ tag }) => {
      if (!tagMap.has(tag.name)) tagMap.set(tag.name, tag.color)
    })
  )
  const allTags = Array.from(tagMap.entries()) // [name, color][]

  // Apply tag filter then search filter
  const tagFiltered = activeTag
    ? baseList.filter(e => e.entry_tags?.some(({ tag }) => tag.name === activeTag))
    : baseList

  const q = searchQuery.trim().toLowerCase()
  const displayed = q
    ? tagFiltered.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.booth_name?.toLowerCase().includes(q) ||
        e.artist_name?.toLowerCase().includes(q) ||
        e.visual_inspiration?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q) ||
        e.material_or_phrase?.toLowerCase().includes(q) ||
        e.entry_tags?.some(({ tag }) => tag.name.toLowerCase().includes(q))
      )
    : tagFiltered

  const allSelected     = displayed.length > 0 && selectedIds.size === displayed.length
  const selectedCount   = selectedIds.size
  const anyFavorited    = displayed.some(e => selectedIds.has(e.id) && e.is_favorite)

  // ── Card tap handler ────────────────────────────────────────────────────────
  function handleCardTap(entry: Entry) {
    if (selectMode) {
      toggleSelect(entry.id)
    } else {
      navigate(`/entry/${entry.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
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
    <div className={`min-h-screen bg-surface px-6 py-10 space-y-6 ${selectMode ? 'pb-32' : ''}`}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {selectMode ? (
          // Select mode header
          <>
            <button onClick={exitSelectMode} className="text-on-surface-variant active:scale-95 transition-transform">
              <span className="material-symbols-outlined">close</span>
            </button>
            <p className="flex-1 font-headline font-bold text-base text-on-surface">
              {selectedCount === 0 ? 'Select entries' : `${selectedCount} selected`}
            </p>
            <button
              onClick={allSelected ? () => setSelectedIds(new Set()) : selectAll}
              className="text-xs font-bold text-primary uppercase tracking-widest"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </>
        ) : (
          // Normal header
          <>
            <button onClick={() => navigate('/events')} className="text-on-surface-variant active:scale-95 transition-transform">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex-1">
              <h1 className="font-headline font-bold text-2xl text-on-surface">{event.title}</h1>
              {event.location && <p className="text-on-surface-variant text-xs mt-0.5">{event.location}</p>}
            </div>
            {entries.length > 0 && (
              <button
                onClick={enterSelectMode}
                className="text-xs font-bold text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors"
              >
                Select
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Action buttons (hidden in select mode) ─────────── */}
      {!selectMode && (
        <div className="grid grid-cols-2 gap-3">
          <GlowButton variant="primary" onClick={() => navigate(`/events/${eventId}/capture`)} icon="add_a_photo" className="py-4">
            New Capture
          </GlowButton>
          <GlowButton variant="secondary" onClick={() => navigate(`/events/${eventId}/gallery`)} icon="photo_library" className="py-4">
            Gallery
          </GlowButton>
        </div>
      )}

      {/* ── Filter bar (hidden in select mode) ─────────────── */}
      {!selectMode && (entries.length > 0 || archivedCount > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => switchFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filter === 'all' ? 'bg-gradient-cta text-on-primary shadow-neon-cyan' : 'bg-surface-container text-on-surface-variant hover:text-primary'
            }`}
          >
            All {entries.length}
          </button>
          <button
            onClick={() => switchFilter('favorites')}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filter === 'favorites' ? 'bg-gradient-cta text-on-primary shadow-neon-cyan' : 'bg-surface-container text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm material-symbols-filled">favorite</span>
            {favoriteCount > 0 ? favoriteCount : 'Favorites'}
          </button>
          <button
            onClick={() => switchFilter('archived')}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filter === 'archived' ? 'bg-surface-container-highest text-on-surface' : 'bg-surface-container text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            {archivedCount > 0 ? archivedCount : 'Archived'}
          </button>
        </div>
      )}

      {/* ── Search bar ─────────────────────────────────────── */}
      {!selectMode && baseList.length > 0 && (
        <div className="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entries…"
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      )}

      {/* ── Tag chips ──────────────────────────────────────── */}
      {!selectMode && allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {allTags.map(([name, color]) => {
            const isActive = activeTag === name
            const colorClass =
              color === 'cyan'   ? 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/40' :
              color === 'purple' ? 'bg-purple-500/20 text-purple-300 ring-purple-500/40' :
                                   'bg-pink-500/20 text-pink-300 ring-pink-500/40'
            return (
              <button
                key={name}
                onClick={() => setActiveTag(activeTag === name ? null : name)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? `${colorClass} ring-1`
                    : 'bg-surface-container text-on-surface-variant hover:text-primary'
                }`}
              >
                #{name}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Archived banner ─────────────────────────────────── */}
      {!selectMode && filter === 'archived' && (
        <div className="rounded-xl bg-surface-container-highest/50 px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">inventory_2</span>
          <p className="text-xs text-on-surface-variant">
            Archived entries are hidden from All and Gallery views.
          </p>
        </div>
      )}

      {/* ── Entry list ──────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <div className="rounded-xl bg-surface-container p-10 flex flex-col items-center text-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl">
            {q || activeTag ? 'search_off' : filter === 'favorites' ? 'favorite' : filter === 'archived' ? 'inventory_2' : 'add_a_photo'}
          </span>
          <div>
            <p className="font-headline font-bold text-on-surface">
              {q || activeTag ? 'No matches found'
                : filter === 'favorites' ? 'No favorites yet'
                : filter === 'archived'  ? 'Nothing archived'
                : 'No captures yet'}
            </p>
            <p className="text-on-surface-variant text-sm mt-1">
              {q || activeTag ? 'Try a different search term or tag'
                : filter === 'favorites' ? 'Tap the heart on any entry to favorite it'
                : filter === 'archived'  ? 'Archived entries will appear here'
                : 'Tap New Capture to start capturing inspiration'}
            </p>
          </div>
          {(q || activeTag) ? (
            <button onClick={() => { setSearchQuery(''); setActiveTag(null) }} className="text-sm text-primary font-bold">
              Clear search
            </button>
          ) : filter !== 'all' && (
            <button onClick={() => switchFilter('all')} className="text-sm text-primary font-bold">View all entries</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((entry) => {
            const isSelected = selectedIds.has(entry.id)
            return (
              <button
                key={entry.id}
                onClick={() => handleCardTap(entry)}
                className={`w-full text-left rounded-xl overflow-hidden transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'ring-2 ring-primary bg-primary/5'
                    : filter === 'archived'
                      ? 'bg-surface-container/60 opacity-80 hover:opacity-100'
                      : 'bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                {/* Thumbnail with selection overlay */}
                {entry.entry_images && entry.entry_images.length > 0 && (
                  <div className="relative">
                    <SignedImage storagePath={entry.entry_images[0].storage_path} className="w-full h-40 rounded-t-xl" />
                    {selectMode && isSelected && (
                      <div className="absolute inset-0 bg-primary/20 rounded-t-xl flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-neon-cyan">
                          <span className="material-symbols-outlined text-on-primary text-lg material-symbols-filled">check</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text content */}
                <div className="p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">

                    {/* Checkbox (select mode) or title */}
                    {selectMode && !entry.entry_images?.length ? (
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-primary border-primary' : 'border-on-surface-variant/40'
                        }`}>
                          {isSelected && <span className="material-symbols-outlined text-on-primary text-sm material-symbols-filled">check</span>}
                        </div>
                        <p className="font-headline font-bold text-on-surface">
                          {entry.title || entry.booth_name || entry.artist_name || 'Untitled'}
                        </p>
                      </div>
                    ) : (
                      <p className="font-headline font-bold text-on-surface flex-1">
                        {entry.title || entry.booth_name || entry.artist_name || 'Untitled'}
                      </p>
                    )}

                    {/* Action buttons — hidden in select mode */}
                    {!selectMode && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {filter === 'archived' ? (
                          <button
                            onClick={(e) => handleUnarchive(e, entry)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-high text-xs font-bold text-on-surface-variant hover:text-primary active:scale-90 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">unarchive</span>
                            Restore
                          </button>
                        ) : (
                          <>
                            <button onClick={(e) => handleToggleFavorite(e, entry)} className="p-1 active:scale-90 transition-transform">
                              <span className={`material-symbols-outlined text-xl ${entry.is_favorite ? 'text-primary material-symbols-filled' : 'text-on-surface-variant/40'}`}>
                                favorite
                              </span>
                            </button>
                            <button onClick={(e) => handleArchive(e, entry)} className="p-1 active:scale-90 transition-transform">
                              <span className="material-symbols-outlined text-xl text-on-surface-variant/40 hover:text-on-surface-variant">inventory_2</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {entry.booth_name && entry.title && <p className="text-xs text-on-surface-variant">{entry.booth_name}</p>}
                  {entry.visual_inspiration && <p className="text-xs text-on-surface-variant line-clamp-2">{entry.visual_inspiration}</p>}
                  {entry.entry_tags && entry.entry_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {entry.entry_tags.map(({ tag }) => (
                        <span key={tag.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Bulk action bar (fixed bottom) ──────────────────── */}
      {selectMode && selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/20">
          <div className="max-w-lg mx-auto space-y-3">
            <p className="text-center text-xs text-on-surface-variant font-bold uppercase tracking-widest">
              {selectedCount} entr{selectedCount === 1 ? 'y' : 'ies'} selected
            </p>
            <div className="grid grid-cols-2 gap-3">
              {filter === 'archived' ? (
                <GlowButton variant="primary" onClick={bulkUnarchive} icon="unarchive" className="col-span-2 py-3">
                  Restore {selectedCount}
                </GlowButton>
              ) : (
                <>
                  <GlowButton variant="secondary" onClick={bulkArchive} icon="inventory_2" className="py-3">
                    Archive {selectedCount}
                  </GlowButton>
                  <GlowButton
                    variant="secondary"
                    onClick={() => bulkFavorite(!anyFavorited)}
                    icon={anyFavorited ? 'heart_broken' : 'favorite'}
                    className="py-3"
                  >
                    {anyFavorited ? 'Unfavorite' : 'Favorite'}
                  </GlowButton>
                </>
              )}
            </div>
            <button onClick={exitSelectMode} className="w-full text-center text-sm text-on-surface-variant font-bold py-1">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
