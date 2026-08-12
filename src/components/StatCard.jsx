import { TrendingUp, Users, FileText } from 'lucide-react'

// Small stat card for the dashboard.
export default function StatCard({ label, value, icon = 'file', hint, accent = false }) {
  const icons = {
    file: FileText,
    money: TrendingUp,
    users: Users,
  }
  const Icon = icons[icon] || FileText

  return (
    <div className={`card p-5 ${accent ? 'ring-2 ring-accent/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-brand">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${accent ? 'bg-accent/10 text-accent' : 'bg-brand-50 text-brand'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
