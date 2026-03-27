import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean   // uses surface-container-highest
}

// Reusable rounded card following the tonal layering principle.
// No explicit borders — depth via background color shifts.
export function Card({ elevated = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        ${elevated ? 'bg-surface-container-highest' : 'bg-surface-container-high'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
