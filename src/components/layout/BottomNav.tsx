import { useLocation, useNavigate } from 'react-router-dom'
import type { NavTab } from '../../types'

const NAV_ITEMS: { tab: NavTab; icon: string; label: string; path: string }[] = [
  { tab: 'home',          icon: 'home',        label: 'Home',     path: '/'              },
  { tab: 'events',        icon: 'event',       label: 'Events',   path: '/events'        },
  { tab: 'question-sets', icon: 'quiz',        label: 'Q-Sets',   path: '/question-sets' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  function getActiveTab(): NavTab {
    if (location.pathname.startsWith('/question-sets')) return 'question-sets'
    if (location.pathname.startsWith('/events')) return 'events'
    return 'home'
  }

  const active = getActiveTab()

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 h-24 flex justify-around items-center px-4 pb-4 bg-surface-container-low/70 backdrop-blur-xl rounded-t-2xl shadow-[0_-10px_30px_rgba(0,229,255,0.05)]">
      {NAV_ITEMS.map(({ tab, icon, label, path }) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            onClick={() => navigate(path)}
            className={`
              flex flex-col items-center justify-center px-6 py-2 rounded-full
              transition-all duration-200 active:scale-90
              ${isActive
                ? 'bg-gradient-cta text-on-primary shadow-neon-cyan'
                : 'text-on-surface-variant hover:text-primary'
              }
            `}
          >
            <span className={`material-symbols-outlined ${isActive ? 'material-symbols-filled' : ''}`}>
              {icon}
            </span>
            <span className="font-label font-medium text-[10px] uppercase tracking-widest mt-1">
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
