import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: string
}

// Primary: cyan gradient fill — the main CTA
// Secondary: surface-container-high with ghost border
// Ghost: text-only with secondary color
export function GlowButton({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...props
}: GlowButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-label font-bold text-sm tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none select-none'

  const variants: Record<Variant, string> = {
    primary:
      'bg-gradient-cta text-on-primary px-6 py-3 shadow-neon-cyan hover:shadow-[0_0_30px_rgba(129,236,255,0.5)]',
    secondary:
      'bg-surface-container-high text-on-surface px-6 py-3 outline outline-1 outline-primary/20 hover:outline-primary/50',
    ghost:
      'text-secondary px-4 py-2 hover:text-primary',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {icon && (
        <span className="material-symbols-outlined text-[1.1rem] leading-none">{icon}</span>
      )}
      {children}
    </button>
  )
}
