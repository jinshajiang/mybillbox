import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Shared layout for legal pages (Privacy, Terms, Disclaimer).
// Renders a sticky top bar with the BillBox logo and a back-to-home button,
// plus a centered max-w-3xl content container with a title.
export default function LegalShell({ title, subtitle, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">
              B
            </div>
            <span className="text-lg font-bold text-brand">BillBox</span>
          </Link>
          <Link
            to="/"
            className="btn-ghost px-3 py-2 text-sm"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 lg:px-8 lg:py-14">
        <h1 className="text-3xl font-bold text-brand lg:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-slate-600">{subtitle}</p>}
        {lastUpdated && (
          <p className="mt-2 text-sm text-slate-400">Last updated: {lastUpdated}</p>
        )}
        <div className="mt-8 space-y-6 leading-relaxed text-slate-700">
          {children}
        </div>
      </main>
    </div>
  )
}
