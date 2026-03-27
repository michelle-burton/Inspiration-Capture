import type { TagColor } from '../../types'

interface ChipProps {
  label: string
  color?: TagColor
  selected?: boolean
  onClick?: () => void
  onRemove?: () => void
}

// Color map for the "ignited" selected state.
// Unselected chips are always neutral surface-container-highest.
const activeStyle: Record<TagColor, string> = {
  cyan:   'bg-primary/20 text-primary shadow-[0_0_10px_rgba(129,236,255,0.25)]',
  purple: 'bg-secondary text-on-secondary shadow-neon-purple',
  pink:   'bg-tertiary/20 text-tertiary shadow-[0_0_10px_rgba(255,108,149,0.25)]',
}

// Colored dot shown on unselected chips so the color is still visible at a glance.
const dotStyle: Record<TagColor, string> = {
  cyan:   'bg-primary',
  purple: 'bg-secondary',
  pink:   'bg-tertiary',
}

export function Chip({ label, color = 'purple', selected = false, onClick, onRemove }: ChipProps) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide
        transition-all duration-200 cursor-pointer select-none
        ${selected
          ? activeStyle[color]
          : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
        }
      `}
    >
      {/* Color dot — only show when unselected so the accent is still communicated */}
      {!selected && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyle[color]}`} />
      )}
      #{label}
      {onRemove && (
        <span
          role="button"
          aria-label={`Remove ${label}`}
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="material-symbols-outlined text-[0.75rem] leading-none ml-0.5 hover:text-tertiary"
        >
          close
        </span>
      )}
    </span>
  )
}
