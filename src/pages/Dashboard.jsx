import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus2, AlertCircle, Inbox } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { formatMoney } from '../data/vatRates'
import StatCard from '../components/StatCard'
import { SkeletonCard, SkeletonRow } from '../components/Loader'

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [monthCount, setMonthCount] = useState(0)
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [clientCount, setClientCount] = useState(0)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    if (!user?.id) return
    let active = true

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10)

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [monthRes, clientsRes, recentRes] = await Promise.all([
          supabase
            .from('invoices')
            .select('total_amount, currency')
            .eq('user_id', user.id)
            .gte('issue_date', startOfMonth)
            .lte('issue_date', endOfMonth),
          supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('invoices')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (!active) return

        const combinedError = monthRes.error || clientsRes.error || recentRes.error
        if (combinedError) {
          setError(combinedError.message)
          return
        }

        const monthInvoices = monthRes.data || []
        setMonthCount(monthInvoices.length)
        const revenue = monthInvoices.reduce(
          (sum, inv) => sum + (Number(inv.total_amount) || 0),
          0
        )
        setMonthRevenue(revenue)
        setClientCount(clientsRes.count || 0)
        setRecent(recentRes.data || [])
      } catch (e) {
        if (active) setError(e.message || 'Failed to load dashboard data')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user?.id])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your billing activity this month.
          </p>
        </div>
        <Link to="/invoice/new" className="btn-accent px-4 py-2.5">
          <FilePlus2 className="h-4 w-4" />
          Create New Invoice
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard label="Invoices This Month" value={monthCount} icon="file" />
            <StatCard
              label="Revenue This Month"
              value={formatMoney(monthRevenue, 'EUR')}
              icon="money"
              accent
            />
            <StatCard label="Total Clients" value={clientCount} icon="users" />
          </>
        )}
      </div>

      {/* Recent invoices */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand">Recent Invoices</h2>
          <Link
            to="/invoices"
            className="text-sm font-medium text-accent hover:underline"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400">
              <Inbox className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">No invoices yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Get started by creating your first invoice.
            </p>
            <Link to="/invoice/new" className="btn-accent mt-4 px-4 py-2">
              <FilePlus2 className="h-4 w-4" />
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2">Invoice #</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-brand">
                      {inv.invoice_number}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{inv.client_name || '—'}</td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {formatMoney(inv.total_amount, inv.currency || 'EUR')}
                    </td>
                    <td className="px-3 py-3 text-slate-500">{inv.issue_date}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          STATUS_STYLES[inv.status] || STATUS_STYLES.draft
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
