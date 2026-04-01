import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCuratedSetById,
  updateCuratedSet,
  removeEntryFromCuratedSet,
  deleteCuratedSet,
} from '../utils/db'
import { SignedImage } from '../components/ui/SignedImage'
import { GlowButton } from '../components/ui/GlowButton'
import { formatDate } from '../utils/format'
import { AnalysisSetupModal } from '../components/analysis/AnalysisSetupModal'
import { AnalysisRunHistory } from '../components/analysis/AnalysisRunHistory'
import type { CuratedSetWithEntries, CuratedSetStatus, Tag } from '../types'

const STATUS_OPTIONS: { value: CuratedSetStatus; label: string; style: string }[] = [
  { value: 'draft',    label: 'Draft',    style: 'bg-secondary-container/30 text-secondary' },
  { value: 'ready',    label: 'Ready',    style: 'bg-primary/20 text-primary' },
  { value: 'archived', label: 'Archived', style: 'bg-surface-container-highest text-on-surface-variant' },
]

export default function CuratedSetDetail() {
  const { eventId, setId } = useParams<{ eventId: string; setId: string }>()
  const navigate            = useNavigate()

  const [set,            setSet]            = useState<CuratedSetWithEntries | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [editing,        setEditing]        = useState(false)
  const [editTitle,      setEditTitle]      = useState('')
  const [editDesc,       setEditDesc]       = useState('')
  const [saving,         setSaving]         = useState(false)
  const [confirmDelete,  setConfirmDelete]  = useState(false)
  const [deleting,       setDeleting]       = useState(false)
  const [removingId,     setRemovingId]     = useState<string | null>(null)
  const [showAnalysis,   setShowAnalysis]   = useState(false)

  useEffect(() => {
    if (!setId) return
    getCuratedSetById(setId).then(({ data }) => {
      setSet(data as CuratedSetWithEntries)
      setEditTitle(data?.title ?? '')
      setEditDesc(data?.description ?? '')
      setLoading(false)
    })
  }, [setId])

  async function handleSaveEdit() {
    if (!set) return
    setSaving(true)
    const { data } = await updateCuratedSet(set.id, {
      title:       editTitle.trim(),
      description: editDesc.trim() || null,
    })
    if (data) setSet(prev => prev ? { ...prev, title: data.title, description: data.description } as CuratedSetWithEntries : prev)
    setSaving(false)
    setEditing(false)
  }

  async function handleStatusChange(status: CuratedSetStatus) {
    if (!set) return
    setSet(prev => prev ? { ...prev, status } : prev)
    await updateCuratedSet(set.id, { status })
  }

  async function handleRemoveEntry(entryId: string) {
    if (!set) return
    setRemovingId(entryId)
    await removeEntryFromCuratedSet(set.id, entryId)
    setSet(prev => prev
      ? { ...prev, curated_set_entries: prev.curated_set_entries.filter(cse => cse.entry.id !== entryId) } as CuratedSetWithEntries
      : prev
    )
    setRemovingId(null)
  }

  async function handleDelete() {
    if (!set) return
    setDeleting(true)
    await deleteCuratedSet(set.id)
    navigate(`/events/${eventId}/curate`, { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    )
  }

  if (!set) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface">
        <span className="material-symbols-outlined text-on-surface-variant text-5xl">search_off</span>
        <p className="font-headline font-bold text-on-surface">Set not found</p>
        <GlowButton variant="secondary" onClick={() => navigate(-1)}>Go back</GlowButton>
      </div>
    )
  }

  const entryCount = set.curated_set_entries.length

  return (
    <div className="min-h-screen bg-surface px-6 py-10 space-y-6 pb-10">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/events/${eventId}/curate`)}
          className="text-on-surface-variant active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setEditing(true)}
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

      {/* ── Title / Edit form ────────────────────────────── */}
      {editing ? (
        <div className="space-y-3 rounded-xl bg-surface-container p-4">
          <input
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Set title"
            className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40"
          />
          <textarea
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40"
          />
          <div className="flex gap-3">
            <GlowButton variant="primary" onClick={handleSaveEdit} disabled={!editTitle.trim() || saving} className="flex-1">
              {saving ? 'Saving…' : 'Save'}
            </GlowButton>
            <button onClick={() => setEditing(false)} className="px-4 text-on-surface-variant text-sm font-bold">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="font-headline font-bold text-2xl text-on-surface leading-tight">{set.title}</h1>
          {set.description && (
            <p className="text-sm text-on-surface-variant">{set.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span>{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</span>
            <span>·</span>
            <span>{formatDate(set.created_at)}</span>
          </div>
        </div>
      )}

      {/* ── Status picker ────────────────────────────────── */}
      <section className="space-y-2">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Status</p>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                set.status === opt.value
                  ? opt.style + ' ring-1 ring-current'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Entries in this set ──────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Entries · {entryCount}
          </p>
          <button
            onClick={() => navigate(`/events/${eventId}/curate`)}
            className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add More
          </button>
        </div>

        {entryCount === 0 ? (
          <div className="rounded-xl bg-surface-container p-8 flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl">photo_library</span>
            <p className="text-sm text-on-surface-variant">No entries in this set yet</p>
            <GlowButton variant="secondary" onClick={() => navigate(`/events/${eventId}/curate`)} icon="add">
              Add Entries
            </GlowButton>
          </div>
        ) : (
          <div className="space-y-3">
            {set.curated_set_entries
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(({ entry }) => {
                const thumb = entry.entry_images?.[0]
                const label = entry.title || entry.booth_name || entry.artist_name || formatDate(entry.created_at)
                const isRemoving = removingId === entry.id
                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl bg-surface-container overflow-hidden transition-opacity ${isRemoving ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center gap-4 p-3">
                      {/* Thumbnail */}
                      {thumb ? (
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                          <SignedImage storagePath={thumb.storage_path} className="w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant text-xl">text_snippet</span>
                        </div>
                      )}

                      {/* Text */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <button
                          onClick={() => navigate(`/entry/${entry.id}`)}
                          className="font-headline font-bold text-sm text-on-surface truncate hover:text-primary transition-colors text-left block w-full"
                        >
                          {label}
                        </button>
                        {entry.visual_inspiration && (
                          <p className="text-xs text-on-surface-variant line-clamp-1">{entry.visual_inspiration}</p>
                        )}
                        {entry.entry_tags && entry.entry_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {entry.entry_tags.slice(0, 3).map(({ tag }: { tag: Tag }) => (
                              <span key={tag.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveEntry(entry.id)}
                        disabled={!!removingId}
                        className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-on-surface-variant/40 hover:text-tertiary hover:bg-tertiary/10 transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined text-lg">remove_circle</span>
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </section>

      {/* ── Analysis ─────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Analysis</p>
        <GlowButton
          variant="primary"
          onClick={() => setShowAnalysis(true)}
          icon="psychology"
          className="w-full py-4"
        >
          Run Analysis
        </GlowButton>
        <button
          onClick={() => navigate('/question-sets')}
          className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface-variant hover:text-primary flex items-center justify-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-sm">quiz</span>
          Manage Question Sets
        </button>
      </section>

      {/* ── Analysis Run History ──────────────────────────── */}
      {set && <AnalysisRunHistory curatedSetId={set.id} />}

      {/* ── Delete confirmation ──────────────────────────── */}
      {confirmDelete && (
        <div className="rounded-2xl bg-surface-container ring-1 ring-tertiary/30 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-tertiary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-tertiary text-lg">delete_forever</span>
            </div>
            <div>
              <p className="font-headline font-bold text-sm text-on-surface">Delete "{set.title}"?</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                The set is removed. Original entries are kept.
              </p>
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
              {deleting ? 'Deleting…' : 'Delete Set'}
            </button>
          </div>
        </div>
      )}

      {/* ── Analysis Setup Modal ─────────────────────────── */}
      {showAnalysis && set && (
        <AnalysisSetupModal
          eventId={set.event_id}
          curatedSetId={set.id}
          curatedSetTitle={set.title}
          entryCount={set.curated_set_entries.length}
          onClose={() => setShowAnalysis(false)}
        />
      )}
    </div>
  )
}
