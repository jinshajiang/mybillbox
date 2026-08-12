import { Loader2 } from 'lucide-react'

export default function Loader({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-slate-500 ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

// Skeleton block for card placeholders
export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-4 h-8 w-32 rounded bg-slate-200" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 animate-pulse">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="h-4 flex-1 rounded bg-slate-200" />
      <div className="h-4 w-20 rounded bg-slate-200" />
      <div className="h-4 w-24 rounded bg-slate-200" />
    </div>
  )
}
