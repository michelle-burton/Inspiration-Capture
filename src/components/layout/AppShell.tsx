import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

// AppShell wraps every page with the top header and bottom navigation.
// <Outlet> renders the current page route inside the padded main area.
export function AppShell() {
  return (
    <div className="min-h-screen bg-surface bg-neon-curtain">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 h-16 flex items-center justify-between px-6 bg-surface/90 backdrop-blur-sm shadow-ambient">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">bolt</span>
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary">
            Inspiration Capture
          </h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">
            account_circle
          </span>
        </div>
      </header>

      {/* Page content — padded to clear top bar and bottom nav */}
      <main className="pt-20 pb-28 px-4 max-w-lg mx-auto">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
