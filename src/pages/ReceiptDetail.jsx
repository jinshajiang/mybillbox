import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Pencil,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CalendarDays,
  Tag,
  Hash,
  FileText,
  FileImage,
  Upload,
  AlignLeft,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useReceipts, validateReceiptFile } from '../lib/useReceipts'
import { RECEIPT_CATEGORIES, DEFAULT_CATEGORY_ID, getCategory } from '../data/receiptCategories'
import { RECEIPT_ALLOWED_TYPES, RECEIPT_BUCKET } from '../lib/supabase'
import Loader from '../components/Loader'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' })
}

function formatMoney(n) {
  const v = Number(n) || 0
  return v.toLocaleString(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export default function ReceiptDetail() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const {
    getReceipt,
    updateReceipt,
    deleteReceipt,
    getSignedUrl,
    downloadFile,
    loading,
  } = useReceipts()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [receipt, setReceipt] = useState(null)
  const [signedUrl, setSignedUrl] = useState(null)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [replaceFile, setReplaceFile] = useState(null)
  const [replacePreview, setReplacePreview] = useState(null)

  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    let active = true
    if (!id || !user) return
    setError('')
    getReceipt(id)
      .then(async (r) => {
        if (!active) return
        setReceipt(r)
        setForm({
          title: r.title,
          date: r.date,
          category: r.category || DEFAULT_CATEGORY_ID,
          amount: Number(r.amount) || 0,
          note: r.note || '',
        })
        if (r.file_path) {
          try {
            const url = await getSignedUrl(r.file_path, 30 * 60)
            if (active) setSignedUrl(url)
          } catch {
            /* ignore; user can still download via button */
          }
        }
      })
      .catch((e) => setError(e.message || 'Receipt not found'))
    return () => { active = false }
  }, [id, user, getReceipt, getSignedUrl])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleReplaceFile = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const check = validateReceiptFile(f)
    if (!check.ok) {
      setError(check.error)
      return
    }
    setError('')
    setReplaceFile(f)
    if (replacePreview) URL.revokeObjectURL(replacePreview)
    setReplacePreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }

  const clearReplaceFile = () => {
    if (replacePreview) URL.revokeObjectURL(replacePreview)
    setReplaceFile(null)
    setReplacePreview(null)
  }

  useEffect(() => () => {
    if (replacePreview) URL.revokeObjectURL(replacePreview)
  }, [replacePreview])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!id || !receipt) return
    setError('')
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    try {
      const updated = await updateReceipt(
        id,
        {
          title: form.title,
          date: form.date,
          category: form.category,
          amount: form.amount,
          note: form.note,
          _current_file_path: receipt.file_path,
        },
        { replaceFile: replaceFile || undefined }
      )
      setReceipt(updated)
      setReplaceFile(null)
      if (replacePreview) URL.revokeObjectURL(replacePreview)
      setReplacePreview(null)
      setEditing(false)

      // refresh signed URL if file changed
      if (replaceFile) {
        const url = await getSignedUrl(updated.file_path, 30 * 60)
        setSignedUrl(url || null)
      }
      showToast('Changes saved')
    } catch (e2) {
      setError(e2.message || 'Failed to save')
    }
  }

  const handleDownload = async () => {
    if (!receipt?.file_path) return
    setDownloading(true)
    try {
      const blob = await downloadFile(receipt.file_path)
      const a = document.createElement('a')
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = receipt.file_name || `receipt-${receipt.id}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast('Download started')
    } catch (e) {
      setError(e.message || 'Failed to download')
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !receipt) return
    try {
      await deleteReceipt(id, receipt.file_path)
      navigate('/receipts', { replace: true })
    } catch (e) {
      setConfirmDelete(false)
      setError(e.message || 'Failed to delete')
    }
  }

  if (authLoading && !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!loading && !receipt) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to="/receipts" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Receipt Box
        </Link>
        {error ? (
          <div className="card p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        ) : (
          <Loader label="Loading receipt…" />
        )}
      </div>
    )
  }

  const isImage = receipt?.file_type?.startsWith('image/')
  const isPDF = receipt?.file_type === 'application/pdf'
  const cat = receipt ? getCategory(receipt.category) : null
  const CatIcon = cat?.icon

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/receipts"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Receipt Box
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {!editing ? (
            <>
              <button className="btn-outline px-3.5 py-2 text-sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download
                  </>
                )}
              </button>
              {signedUrl && (
                <a
                  className="btn-outline px-3.5 py-2 text-sm"
                  href={signedUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              )}
              <button className="btn-primary px-3.5 py-2 text-sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                className="btn-danger px-3.5 py-2 text-sm"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-ghost px-3.5 py-2 text-sm"
                onClick={() => {
                  setEditing(false)
                  clearReplaceFile()
                  if (receipt) {
                    setForm({
                      title: receipt.title,
                      date: receipt.date,
                      category: receipt.category || DEFAULT_CATEGORY_ID,
                      amount: Number(receipt.amount) || 0,
                      note: receipt.note || '',
                    })
                  }
                }}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                className="btn-primary px-3.5 py-2 text-sm"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
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

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Preview column */}
        <div className="card overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-700">File preview</h3>
            <span className="truncate text-xs text-slate-500">
              {receipt?.file_name} · {formatSize(receipt?.file_size)}
            </span>
          </div>
          <div className="min-h-[380px] bg-slate-50 p-4">
            {editing && (replaceFile || replacePreview) ? (
              <div className="relative mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                {replacePreview ? (
                  <img src={replacePreview} alt="Replacement preview" className="mx-auto max-h-[560px] object-contain" />
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center text-slate-500">
                    <FileText className="h-12 w-12 text-brand" />
                    <p className="mt-2 text-sm font-medium">{replaceFile?.name}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearReplaceFile}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-500 shadow hover:text-red-600"
                  aria-label="Remove replacement file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : isImage && signedUrl ? (
              <img src={signedUrl} alt={receipt?.title} className="mx-auto max-h-[640px] w-auto max-w-full rounded-xl shadow-sm bg-white" />
            ) : isPDF && signedUrl ? (
              <iframe
                title="Receipt PDF"
                src={signedUrl}
                className="h-[640px] w-full rounded-xl border border-slate-200 bg-white shadow-sm"
              />
            ) : (
              <div className="flex h-72 flex-col items-center justify-center text-slate-500">
                {isPDF ? <FileText className="h-16 w-16 text-brand" /> : <FileImage className="h-16 w-16 text-slate-300" />}
                <p className="mt-3 text-sm font-medium">{receipt?.file_name || 'No preview'}</p>
                {!signedUrl && <p className="mt-1 text-xs text-slate-400">Preview loading… click Download to open the file.</p>}
              </div>
            )}
          </div>

          {editing && (
            <div className="border-t border-slate-100 px-5 py-4">
              <label className="label">Replace file (optional)</label>
              <button
                type="button"
                className="btn-outline w-full justify-center py-2 text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload a different file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={RECEIPT_ALLOWED_TYPES.join(',')}
                className="hidden"
                onChange={handleReplaceFile}
              />
            </div>
          )}
        </div>

        {/* Metadata column */}
        <div className="card space-y-5 p-6 lg:col-span-2">
          <div>
            {cat && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cat.color}`}>
                {CatIcon && <CatIcon className="h-3.5 w-3.5" />}
                {cat.label}
              </span>
            )}
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{receipt?.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Created {formatDate(receipt?.created_at)} · Updated {formatDate(receipt?.updated_at)}
                </p>
              </div>
              <dl className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex items-center gap-3">
                  <dt className="w-24 flex-shrink-0 text-slate-500">
                    <CalendarDays className="mr-1 inline h-4 w-4" /> Date
                  </dt>
                  <dd className="font-medium text-slate-800">{formatDate(receipt?.date)}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt className="w-24 flex-shrink-0 text-slate-500">
                    <Hash className="mr-1 inline h-4 w-4" /> Amount
                  </dt>
                  <dd className="text-lg font-bold text-brand">{formatMoney(receipt?.amount)}</dd>
                </div>
              </dl>
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Note</p>
                <p className="whitespace-pre-line text-sm text-slate-700">{receipt?.note || '—'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label" htmlFor="r-title">Title *</label>
                <input
                  id="r-title"
                  className="input"
                  value={form.title || ''}
                  onChange={handleChange('title')}
                  maxLength={120}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="r-date">
                    <CalendarDays className="mr-1 inline h-4 w-4" /> Date
                  </label>
                  <input
                    id="r-date"
                    type="date"
                    className="input"
                    value={form.date || ''}
                    onChange={handleChange('date')}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="r-category">
                    <Tag className="mr-1 inline h-4 w-4" /> Category
                  </label>
                  <select
                    id="r-category"
                    className="input"
                    value={form.category || DEFAULT_CATEGORY_ID}
                    onChange={handleChange('category')}
                  >
                    {RECEIPT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="r-amount">
                  <Hash className="mr-1 inline h-4 w-4" /> Amount
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">€</span>
                  <input
                    id="r-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input pl-7"
                    value={form.amount ?? ''}
                    onChange={handleChange('amount')}
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="r-note">
                  <AlignLeft className="mr-1 inline h-4 w-4" /> Note
                </label>
                <textarea
                  id="r-note"
                  className="input min-h-[120px] resize-y"
                  value={form.note || ''}
                  onChange={handleChange('note')}
                  maxLength={500}
                />
              </div>
              {/* hidden submit for Enter key */}
              <button type="submit" className="hidden" aria-hidden="true" />
            </form>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6">
            <div className="mb-3 flex items-center gap-2 text-red-600">
              <div className="rounded-full bg-red-50 p-1.5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Delete this receipt?</h3>
            </div>
            <p className="text-sm text-slate-600">
              The record and its attached file in the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{RECEIPT_BUCKET}</code>{' '}
              bucket will be permanently deleted. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-outline px-3.5 py-2 text-sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="btn-danger px-3.5 py-2 text-sm" onClick={handleDelete} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete forever
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
