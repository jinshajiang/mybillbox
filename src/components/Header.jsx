import { Menu } from 'lucide-react'
import { useAuth } from '../lib/useAuth'

export default function Header({ onMenuClick }) {
  const { profile } = useAuth()
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs text-slate-400">Welcome back</p>
          <p className="text-sm font-semibold text-brand">
            {profile?.company_name || 'Your company'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {profile?.logo_url ? (
          <img
            src={profile.logo_url}
            alt="Company logo"
            className="h-9 w-9 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            {(profile?.company_name || 'B').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  )
}
