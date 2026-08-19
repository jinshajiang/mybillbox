import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Upload,
  Search,
  Filter,
  CalendarDays,
  FileText,
  FileImage,
  FolderPlus,
  Hash,
  Trash2,
  AlertCircle,
  Loader2,
  Receipt as ReceiptIcon,
  X,
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useReceipts } from '../lib/useReceipts'
import { RECEIPT_CATEGORIES, getCategory, DEFAULT_CATEGORY_ID } from '../data/receiptCategories'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

function formatMoney(n) {
  const v = Number(n) || 0
  return v.toLocaleString(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
}

export default function ReceiptBox() {
  const { user, loading: authLoading } = useAuth()
  const { listReceipts, deleteReceipt, loading } = useReceipts()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const activeCategory = searchParams.get('category') || 'all'
  const activeSearch = searchParams.get('q') || ''

  const setFilter = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams)
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === '' || v === null) next.delete(k)
        else next.set(k, String(v))
      })
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const load = useCallback(async () => {
    if (!user) return
    setError('')
    try {
      const res = await listReceipts({
        category: activeCategory,
        search: activeSearch,
      })
      setItems(res.items)
      setCount(res.count)
      setTotalAmount(res.totalAmount)
    } catch (e) {
      setError(e.message || 'Failed to load receipts')
    }
  }, [user, listReceipts, activeCategory, activeSearch])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const handleDeleteConfirm = async (receipt) => {
    setDeletingId(receipt.id)
    try {
      await deleteReceipt(receipt.id, receipt.file_path)
      setConfirmDelete(null)
      await load()
    } catch (e) {
      setError(e.message || 'Failed to delete receipt')
    } finally {
      setDeletingId(null)
    }
  }

  const chips = useMemo(
    () => [
      { id: 'all', label: `All (${count})` },
      ...RECEIPT_CATEGORIES,
    ],
    [count]
  )

  if (authLoading && !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand">Receipt Box</h1>
          <p className="mt-1 text-sm text-slate-500">
            All your uploaded receipts in one place.
          </p>
        </div>
        <button className="btn-primary px-4 py-2.5 text-sm" onClick={() => navigate('/receipts/new')}>
          <Upload className="h-4 w-4" />
          Upload receipt
        </button>
      </div>

      {/* Summary + filter bar */}
      <div className="card space-y-5 p-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-brand-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand/70">Total items</p>
            <p className="mt-1 text-2xl font-bold text-brand">{count}</p>
          </div>
          <div className="col-span-2 rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Amount in this view
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{formatMoney(totalAmount)}</p>
          </div>
          <div className="col-span-2 hidden rounded-xl border border-slate-100 bg-white p-4 sm:col-span-4 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick actions</p>
            <div className="mt-1">
              <button className="btn-ghost px-0 text-sm text-brand" onClick={() => navigate('/receipts/new')}>
                + Upload new
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 h-4 w-4" />
            <input
              type="search"
              placeholder="Search by title, note, or filename…"
              className="input pl-9"
              value={activeSearch}
              onChange={(e) => setFilter({ q: e.target.value })}
            />
            {activeSearch && (
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                onClick={() => setFilter({ q: undefined })}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 pr-2 text-xs font-medium text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              Category
            </span>
            {chips.map((chip) => {
              const active = (activeCategory || 'all') === chip.id
              const Icon = chip.icon
              return (
                <button
                  key={chip.id}
                  onClick={() => setFilter({ category: active ? undefined : chip.id })}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-brand bg-brand text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand">
            <FolderPlus className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No receipts yet</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {activeSearch || activeCategory !== 'all'
              ? 'Try clearing the filters, or upload a new receipt.'
              : 'Snap a photo of your first invoice or receipt — we will keep it safe and sorted.'}
          </p>
          <button
            className="btn-primary mt-5 px-4 py-2.5 text-sm"
            onClick={() => navigate('/receipts/new')}
          >
            <Upload className="h-4 w-4" />
            Upload your first receipt
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((r) => {
            const cat = getCategory(r.category ?? DEFAULT_CATEGORY_ID)
            const CatIcon = cat.icon
            return (
              <Link
                key={r.id}
                to={`/receipts/${r.id}`}
                className="group card flex flex-col overflow-hidden transition hover:shadow-card-hover hover:-translate-y-0.5"
              >
                <div className="relative aspect-video bg-slate-100">
                  {r.file_type?.startsWith('image/') ? (
                    <ReceiptThumb id={r.id} file_path={r.file_path} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {r.file_type === 'application/pdf' ? (
                        <FileText className="h-12 w-12 text-brand/70" />
                      ) : (
                        <FileImage className="h-12 w-12 text-slate-300" />
                      )}
                    </div>
                  )}
                  <div className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cat.color}`}>
                    <CatIcon className="h-3 w-3" />
                    {cat.label.split(' ').shift()}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800 group-hover:text-brand">
                    {r.title}
                  </h3>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="space-y-0.5">
                      <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(r.date)}
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1 text-brand">
                      <Hash className="h-3 w-3 opacity-70" />
                      <span className="text-base font-bold tabular-nums">
                        {formatMoney(r.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
                  <span className="truncate text-[11px] text-slate-400">
                    {r.file_name}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setConfirmDelete(r)
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6">
            <div className="mb-3 flex items-center gap-2 text-red-600">
              <div className="rounded-full bg-red-50 p-1.5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Delete receipt?</h3>
            </div>
            <p className="text-sm text-slate-600">
              This will permanently delete{' '}
              <span className="font-medium text-slate-800">&ldquo;{confirmDelete.title}&rdquo;</span>{' '}
              and its attached file. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="btn-outline px-3.5 py-2 text-sm"
                onClick={() => setConfirmDelete(null)}
                disabled={deletingId === confirmDelete.id}
              >
                Cancel
              </button>
              <button
                className="btn-danger px-3.5 py-2 text-sm"
                onClick={() => handleDeleteConfirm(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
              >
                {deletingId === confirmDelete.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// A tiny helper component so per-thumb signed URL fetching is scoped and parallel.
function ReceiptThumb({ id, file_path }) {
  const [src, setSrc] = useState('')
  const [error, setError] = useState(false)
  const { getSignedUrl } = useReceipts()

  useEffect(() => {
    let active = true
    if (!file_path) return
    getSignedUrl(file_path, 10 * 60, { transform: { width: 200 } })
      .then((url) => {
        if (active) setSrc(url || '')
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, file_path])

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <ReceiptIcon className="h-10 w-10 text-slate-300" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setError(true)}
    />
  )
}
