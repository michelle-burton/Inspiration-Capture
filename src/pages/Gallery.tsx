import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { CaptureCard } from '../components/capture/CaptureCard'
import { Chip } from '../components/ui/Chip'
import { GlowButton } from '../components/ui/GlowButton'

// Gallery page — filterable bento grid of all captures.
export default function Gallery() {
  const navigate = useNavigate()
  const { entries } = useEntries()
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Collect all unique tag values and their first-seen color across entries
  const tagMap = new Map<string, import('../types').TagColor>()
  entries.forEach((e) => e.tags.forEach((t) => { if (!tagMap.has(t.value)) tagMap.set(t.value, t.color) }))
  const allTags = Array.from(tagMap.entries()) // [value, color][]

  const filtered = activeTag
    ? entries.filter((e) => e.tags.some((t) => t.value === activeTag))
    : entries

  // "All" chip uses neutral purple; individual chips use their stored color

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="space-y-1 pt-1">
        <h2 className="font-headline font-bold text-2xl text-on-surface">Gallery</h2>
        <p className="text-on-surface-variant text-xs">
          {entries.length} capture{entries.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* ── Tag filter ───────────────────────────────────── */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip
            label="All"
            selected={activeTag === null}
            onClick={() => setActiveTag(null)}
          />
          {allTags.map(([value, color]) => (
            <Chip
              key={value}
              label={value}
              color={color}
              selected={activeTag === value}
              onClick={() => setActiveTag(activeTag === value ? null : value)}
            />
          ))}
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────── */}
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
            <GlowButton variant="primary" onClick={() => navigate('/capture')} icon="add_a_photo">
              New Capture
            </GlowButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((entry) => (
            <CaptureCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
