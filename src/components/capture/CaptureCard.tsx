import { useNavigate } from 'react-router-dom'
import type { CaptureEntry } from '../../types'
import { formatTime } from '../../utils/format'

interface CaptureCardProps {
  entry: CaptureEntry
}

export function CaptureCard({ entry }: CaptureCardProps) {
  const navigate = useNavigate()
  const hasPhoto = entry.photos.length > 0
  const isVoice  = entry.source === 'voice'
  const firstTag = entry.tags[0]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/entry/${entry.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/entry/${entry.id}`)}
      className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      {/* ── Photo variant ──────────────────────────────── */}
      {hasPhoto ? (
        <>
          <img
            src={entry.photos[0]}
            alt={entry.title}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
          {/* Gradient scrim so text is always legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-surface-container-lowest/20 to-transparent" />
        </>
      ) : isVoice ? (
        /* ── Voice variant ──────────────────────────────── */
        <div className="w-full h-full flex flex-col items-center justify-center p-4 group-hover:bg-surface-container-highest transition-colors">
          <div className="flex gap-1 mb-3">
            {[4, 8, 5, 7, 3].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-secondary animate-pulse"
                style={{ height: `${h * 4}px`, animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
          <span className="material-symbols-outlined text-secondary text-lg mb-1">mic</span>
        </div>
      ) : (
        /* ── Text variant ───────────────────────────────── */
        <div className="w-full h-full flex flex-col items-start justify-start p-3 group-hover:bg-surface-container-highest transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant text-lg mb-2">
            text_snippet
          </span>
          <p className="text-xs font-body text-on-surface line-clamp-4 leading-relaxed">
            {entry.observations || entry.transcript || entry.title}
          </p>
        </div>
      )}

      {/* ── Bottom overlay: title + timestamp (always present) ── */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
        <p className="text-[11px] font-bold text-white leading-tight line-clamp-1 drop-shadow-sm">
          {entry.title}
        </p>
        <p className="text-[9px] font-medium text-white/60 uppercase tracking-tighter mt-0.5">
          {formatTime(entry.createdAt)}
        </p>
      </div>

      {/* ── Tag pill (first tag only) ─────────────────────── */}
      {firstTag && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 bg-surface-container-highest/80 backdrop-blur-sm rounded-full text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
            #{firstTag.value}
          </span>
        </div>
      )}
    </div>
  )
}
