import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Download,
  Trash2,
  Filter,
  AlertCircle,
  Inbox,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { generateInvoicePDF } from '../lib/pdf'
import { COUNTRIES, formatMoney, getCountry } from '../data/vatRates'
import InvoicePreview from '../components/InvoicePreview'
import { SkeletonRow } from '../components/Loader'

const PAGE_SIZE = 20

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

export default function InvoiceHistory() {
  const { user, profile } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [downloadInvoice, setDownloadInvoice] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const previewRef = useRef(null)

  const buildQuery = useCallback(
    (start) => {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false })

      if (countryFilter !== 'all') {
        query = query.eq('country_code', countryFilter)
      }
      if (monthFilter) {
        const [year, month] = monthFilter.split('-').map(Number)
        const lastDay = new Date(year, month, 0).getDate()
        const startOfMonth = `${monthFilter}-01`
        const endOfMonth = `${monthFilter}-${String(lastDay).padStart(2, '0')}`
        query = query.gte('issue_date', startOfMonth).lte('issue_date', endOfMonth)
      }
      return query.range(start, start + PAGE_SIZE - 1)
    },
    [user?.id, countryFilter, monthFilter]
  )

  // Refetch from the first page whenever the query (filters / user) changes.
  useEffect(() => {
    if (!user?.id) return
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data, error: err } = await buildQuery(0)
        if (!active) return
        if (err) {
          setError(err.message)
          setInvoices([])
          setHasMore(false)
          return
        }
        setInvoices(data || [])
        setHasMore((data || []).length === PAGE_SIZE)
      } catch (e) {
        if (active) setError(e.message || 'Failed to load invoices')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [buildQuery])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const start = invoices.length
      const { data, error: err } = await buildQuery(start)
      if (err) {
        setError(err.message)
      } else {
        setInvoices((prev) => [...prev, ...(data || [])])
        setHasMore((data || []).length === PAGE_SIZE)
      }
    } catch (e) {
      setError(e.message || 'Failed to load more invoices')
    } finally {
      setLoadingMore(false)
    }
  }

  const clearFilters = () => {
    setCountryFilter('all')
    setMonthFilter('')
  }

  // Generate the PDF once the hidden preview has rendered the selected invoice.
  useEffect(() => {
    if (!downloadInvoice) return
    let active = true

    async function run() {
      try {
        const node = previewRef.current
        if (!node) throw new Error('Preview not ready')
        node.setAttribute(
          'data-invoice-number',
          downloadInvoice.invoice_number || 'invoice'
        )
        await generateInvoicePDF(node)
      } catch (e) {
        if (active) setError(e.message || 'Failed to generate PDF')
      } finally {
        if (active) {
          setDownloadingId(null)
          setDownloadInvoice(null)
        }
      }
    }

    run()
    return () => {
      active = false
    }
  }, [downloadInvoice])

  const handleDownload = (inv) => {
    setError('')
    setDownloadingId(inv.id)
    setDownloadInvoice(inv)
  }

  const handleDelete = async (inv) => {
    if (!window.confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`))
      return
    setDeletingId(inv.id)
    setError('')
    try {
      const { error: err } = await supabase
        .from('invoices')
        .delete()
        .eq('id', inv.id)
        .eq('user_id', user.id)
      if (err) {
        setError(err.message)
      } else {
        setInvoices((prev) => prev.filter((i) => i.id !== inv.id))
        setToast('Invoice deleted')
        setTimeout(() => setToast(''), 2500)
      }
    } catch (e) {
      setError(e.message || 'Failed to delete invoice')
    } finally {
      setDeletingId(null)
    }
  }

  const filtersActive = countryFilter !== 'all' || monthFilter !== ''

  return (
    <div className="space-y-6">
      {/* Hidden off-screen invoice preview used as the PDF source */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: '800px',
          pointerEvents: 'none',
        }}
      >
        <InvoicePreview
          ref={previewRef}
          invoice={downloadInvoice || {}}
          profile={profile}
        />
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-brand">Invoice History</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse, download, and manage all your invoices.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <p>{toast}</p>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="label" htmlFor="country-filter">
              <Filter className="mr-1 inline h-4 w-4" />
              Country
            </label>
            <select
              id="country-filter"
              className="input"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              <option value="all">All countries</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="month-filter">
              <Filter className="mr-1 inline h-4 w-4" />
              Month
            </label>
            <input
              id="month-filter"
              type="month"
              className="input"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
          </div>
          <div>
            <button
              type="button"
              className="btn-outline px-4 py-2.5"
              onClick={clearFilters}
              disabled={!filtersActive}
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400">
              <Inbox className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">No invoices found</p>
            <p className="mt-1 text-sm text-slate-400">
              {filtersActive
                ? 'Try adjusting your filters.'
                : 'Create your first invoice to get started.'}
            </p>
            <Link to="/invoice/new" className="btn-accent mt-4 px-4 py-2">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">VAT</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => {
                    const country = getCountry(inv.country_code)
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-brand">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {inv.client_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {formatMoney(inv.total_amount, inv.currency || 'EUR')}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {Number(inv.vat_rate) || 0}%
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {country.code} · {country.name}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{inv.issue_date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                              STATUS_STYLES[inv.status] || STATUS_STYLES.draft
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand disabled:opacity-50"
                              onClick={() => handleDownload(inv)}
                              disabled={downloadingId === inv.id}
                              title="Download PDF"
                            >
                              {downloadingId === inv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              onClick={() => handleDelete(inv)}
                              disabled={deletingId === inv.id}
                              title="Delete invoice"
                            >
                              {deletingId === inv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="flex justify-center border-t border-slate-100 p-4">
                <button
                  type="button"
                  className="btn-outline px-4 py-2.5"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
