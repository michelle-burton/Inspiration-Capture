import { useNavigate } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { CaptureCard } from '../components/capture/CaptureCard'
import { GlowButton } from '../components/ui/GlowButton'


// Home / Capture Dashboard
// Shows the hero capture CTA + recent captures bento grid.
export default function Home() {
  const navigate = useNavigate()
  const { entries } = useEntries()
  const recent = entries.slice(0, 4)

  return (
    <div className="space-y-10">
      {/* ── Hero capture area ─────────────────────────────── */}
      <section
        role="button"
        onClick={() => navigate('/capture')}
        className="
          relative aspect-video rounded-xl overflow-hidden
          bg-surface-container-low flex flex-col items-center justify-center
          cursor-pointer group transition-all
          ring-1 ring-primary/10 hover:ring-primary/40
        "
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center p-8">
          <div className="w-20 h-20 mb-5 rounded-full flex items-center justify-center bg-gradient-cta shadow-neon-cyan group-active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-on-primary text-4xl material-symbols-filled">
              add_a_photo
            </span>
          </div>
          <h2 className="font-headline font-bold text-3xl tracking-tight text-on-surface mb-1">
            Tap to Capture
          </h2>
          <p className="text-on-surface-variant text-xs font-bold tracking-widest uppercase">
            Photo · Voice · Notes
          </p>
        </div>

        {/* Live badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-surface-container-highest/60 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
            Ready
          </span>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow-sm" />
        </div>
      </section>

      {/* ── Recent captures ───────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-headline font-bold text-xl text-on-surface">Recent Captures</h3>
            <p className="text-on-surface-variant text-xs mt-0.5">
              {entries.length === 0
                ? 'Nothing captured yet'
                : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} saved`}
            </p>
          </div>
          {entries.length > 0 && (
            <GlowButton variant="ghost" onClick={() => navigate('/gallery')}>
              View All
            </GlowButton>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl bg-surface-container p-8 flex flex-col items-center text-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl">
              photo_library
            </span>
            <p className="text-on-surface-variant text-sm">
              Your captures will appear here. Tap the button above to start.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recent.map((entry) => (
              <CaptureCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {/* ── Stats strip ───────────────────────────────────── */}
      {entries.length > 0 && (
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: entries.length, icon: 'layers' },
            {
              label: 'Photos',
              value: entries.filter((e) => e.photos.length > 0).length,
              icon: 'image',
            },
            {
              label: 'Voice',
              value: entries.filter((e) => e.source === 'voice' || e.audioUrl).length,
              icon: 'mic',
            },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-surface-container rounded-xl p-4 flex flex-col gap-1">
              <span className="material-symbols-outlined text-on-surface-variant text-base">
                {icon}
              </span>
              <span className="font-headline font-bold text-xl text-on-surface">{value}</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                {label}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
