import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FilePlus2, Receipt, Settings, LogOut, X } from 'lucide-react'
import { useAuth } from '../lib/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoice/new', label: 'New Invoice', icon: FilePlus2 },
  { to: '/invoices', label: 'Invoice History', icon: Receipt },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-brand-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <NavLink to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <span className="text-sm font-bold">B</span>
            </div>
            <span className="text-lg font-bold text-brand">BillBox</span>
          </NavLink>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-brand'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2">
            <p className="truncate text-sm font-semibold text-brand">
              {profile?.company_name || 'Your company'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {profile?.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) + ' plan' : 'Free plan'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
