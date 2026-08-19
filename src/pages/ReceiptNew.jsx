import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  Camera,
  ImagePlus,
  X,
  FileText,
  FileImage,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CalendarDays,
  Tag,
  Hash,
  Receipt as ReceiptIcon,
  AlignLeft,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import {
  useReceipts,
  validateReceiptFile,
  prepareReceiptFile,
  IMAGE_COMPRESS_MAX_MB,
  IMAGE_COMPRESS_MAX_PX,
  PDF_MAX_MB,
} from '../lib/useReceipts'
import { RECEIPT_CATEGORIES, DEFAULT_CATEGORY_ID } from '../data/receiptCategories'
import { RECEIPT_ALLOWED_TYPES } from '../lib/supabase'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function ProgressBar({ phase, percent }) {
  const label = phase === 'compress' ? 'Compressing' : phase === 'upload' ? 'Uploading' : 'Saving'
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          {phase === 'compress' && <Sparkles className="h-3.5 w-3.5 text-accent" />}
          {phase === 'upload' && <Upload className="h-3.5 w-3.5 text-brand" />}
          {(phase !== 'compress' && phase !== 'upload') && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
          )}
          {label}…
        </span>
        <span className="tabular-nums text-slate-700">{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-150 ${
            phase === 'compress' ? 'bg-accent' : 'bg-brand'
          }`}
          style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  )
}

export default function ReceiptNew() {
  const { user, loading: authLoading } = useAuth()
  const { createReceipt, loading } = useReceipts()
  const navigate = useNavigate()

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const [originalFile, setOriginalFile] = useState(null)
  const [processedFile, setProcessedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [originalSize, setOriginalSize] = useState(0)

  const [form, setForm] = useState({
    title: '',
    date: todayISO(),
    category: DEFAULT_CATEGORY_ID,
    amount: '',
    note: '',
  })

  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(null) // { phase: 'compress' | 'upload' | 'db', percent: 0-100 }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const setFileInternal = async (nextFile) => {
    // Pre-flight MIME + absolute size check (images may be large; we'll compress below).
    if (!RECEIPT_ALLOWED_TYPES.includes(nextFile.type)) {
      setError(
        `Unsupported file type (${nextFile.type || 'unknown'}). Allowed: JPG, PNG, HEIC, WebP, PDF.`
      )
      return
    }
    if (nextFile.type === 'application/pdf' && nextFile.size > PDF_MAX_MB * 1024 * 1024) {
      setError(
        `PDF is too large (${(nextFile.size / 1024 / 1024).toFixed(1)}MB). Max ${PDF_MAX_MB}MB — please compress or split it.`
      )
      return
    }
    setError('')

    setOriginalFile(nextFile)
    setOriginalSize(nextFile.size)

    // Revoke previous preview
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    // Compress images (progress shown inline)
    setProgress(null)
    try {
      const compressed = await prepareReceiptFile(nextFile, (phase, percent) =>
        setProgress({ phase, percent })
      )
      setProcessedFile(compressed)
      setProgress(null)
    } catch (e) {
      setError(e.message || 'Failed to prepare the file')
      setProcessedFile(nextFile)
      setProgress(null)
    }

    // Preview shows the (compressed) image file; PDFs fall back to icon.
    const previewSrc = processedFileCompressedSafe(nextFile)
    if (nextFile.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(previewSrc))
    } else {
      setPreviewUrl(null)
    }

    // Auto-fill title from filename when user hasn't typed anything.
    if (!form.title.trim()) {
      const rawName = nextFile.name.replace(/\.[^/.]+$/, '')
      setForm((p) => ({ ...p, title: rawName }))
    }
  }

  // Helper: keep a stable preview File reference. We prefer the compressed
  // file when available; otherwise fall back to original.
  function processedFileCompressedSafe() {
    return processedFile || originalFile
  }

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setOriginalFile(null)
    setProcessedFile(null)
    setPreviewUrl(null)
    setOriginalSize(0)
    setProgress(null)
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) setFileInternal(f)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFileInternal(f)
  }

  const activeFile = processedFile || originalFile
  const compressionSaved =
    originalFile && processedFile && originalFile.size > processedFile.size
      ? originalFile.size - processedFile.size
      : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!activeFile) {
      setError('Please upload a receipt file first.')
      return
    }
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    if (!form.date) {
      setError('Date is required.')
      return
    }
    // Final post-compression validation
    const check = validateReceiptFile(activeFile)
    if (!check.ok) {
      setError(check.error)
      return
    }
    try {
      setProgress({ phase: 'upload', percent: 0 })
      const saved = await createReceipt(
        {
          ...form,
          file: activeFile,
        },
        {
          onProgress: (phase, percent) => setProgress({ phase, percent }),
        }
      )
      setProgress({ phase: 'db', percent: 100 })
      showToast('Receipt saved')
      navigate(`/receipts/${saved.id}`, { replace: true })
    } catch (e2) {
      setError(e2.message || 'Failed to save receipt')
    } finally {
      setProgress(null)
    }
  }

  const acceptAttr = useMemo(() => RECEIPT_ALLOWED_TYPES.join(','), [])

  if (authLoading && !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const file = activeFile
  const isPDF = file && file.type === 'application/pdf'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Upload Receipt</h1>
          <p className="mt-1 text-sm text-slate-500">
            Take a photo or choose a file. Images auto-compress to ≤{IMAGE_COMPRESS_MAX_MB}MB, max
            {IMAGE_COMPRESS_MAX_PX}px. PDF max {PDF_MAX_MB}MB.
          </p>
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

      {progress && (
        <div className="card p-4">
          <ProgressBar phase={progress.phase} percent={progress.percent} />
        </div>
      )}

      {/* Upload zone */}
      {!file ? (
        <div
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
            dragging
              ? 'border-accent bg-accent/5'
              : 'border-slate-300 hover:border-accent/60 hover:bg-slate-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-slate-700">Drag &amp; drop, or click to upload</p>
          <p className="mt-1 text-sm text-slate-500">
            JPG / PNG / HEIC / WebP / PDF — images compress automatically
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="btn-outline px-4 py-2 text-sm"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              <ImagePlus className="h-4 w-4" />
              Choose file
            </button>
            <button
              type="button"
              className="btn-accent px-4 py-2 text-sm"
              onClick={(e) => {
                e.stopPropagation()
                cameraInputRef.current?.click()
              }}
            >
              <Camera className="h-4 w-4" />
              Take photo
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Preview header */}
          <div className="grid gap-0 sm:grid-cols-[240px_1fr]">
            <div className="relative flex aspect-square items-center justify-center bg-slate-50 sm:aspect-auto sm:h-full">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="h-full w-full object-contain p-4"
                />
              ) : isPDF ? (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <FileText className="h-14 w-14 text-brand" />
                  <p className="text-xs">PDF preview</p>
                </div>
              ) : (
                <FileImage className="h-14 w-14 text-slate-300" />
              )}
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-500 shadow-sm hover:text-red-600"
                onClick={clearFile}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 p-5">
              <div className="flex items-start gap-2">
                {isPDF ? (
                  <FileText className="mt-0.5 h-5 w-5 text-brand" />
                ) : (
                  <FileImage className="mt-0.5 h-5 w-5 text-brand" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {file.type || 'unknown type'} · {formatSize(file.size)}
                    {compressionSaved > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        <Sparkles className="h-3 w-3" />
                        compressed: saved {formatSize(compressionSaved)}
                      </span>
                    )}
                    {originalSize > 0 &&
                      processedFile &&
                      originalSize > processedFile.size &&
                      !compressionSaved && (
                        <span className="ml-2 text-[10px] text-slate-400">
                          (original {formatSize(originalSize)})
                        </span>
                      )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-outline px-3 py-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Replace
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptAttr}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label" htmlFor="title">
              <ReceiptIcon className="mr-1 inline h-4 w-4" />
              Title *
            </label>
            <input
              id="title"
              type="text"
              className="input"
              placeholder="e.g. Client lunch at Marrakesh"
              value={form.title}
              onChange={handleChange('title')}
              maxLength={120}
            />
          </div>

          <div>
            <label className="label" htmlFor="date">
              <CalendarDays className="mr-1 inline h-4 w-4" />
              Date *
            </label>
            <input
              id="date"
              type="date"
              className="input"
              value={form.date}
              onChange={handleChange('date')}
              max={todayISO()}
            />
          </div>

          <div>
            <label className="label" htmlFor="category">
              <Tag className="mr-1 inline h-4 w-4" />
              Category
            </label>
            <select
              id="category"
              className="input"
              value={form.category}
              onChange={handleChange('category')}
            >
              {RECEIPT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="amount">
              <Hash className="mr-1 inline h-4 w-4" />
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                €
              </span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                className="input pl-7"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange('amount')}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="note">
            <AlignLeft className="mr-1 inline h-4 w-4" />
            Note
          </label>
          <textarea
            id="note"
            className="input min-h-[96px] resize-y"
            placeholder="Optional details, attendees, purpose…"
            value={form.note}
            onChange={handleChange('note')}
            maxLength={500}
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            className="btn-ghost px-3 py-2 text-sm"
            onClick={() => navigate('/receipts')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary px-5 py-2.5 text-sm"
            disabled={loading || !!progress}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save receipt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
