import { useCallback, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase, RECEIPT_BUCKET, RECEIPT_ALLOWED_TYPES, RECEIPT_MAX_SIZE } from '../lib/supabase'
import { useAuth } from './useAuth'

// Compression thresholds (applied before upload + validation).
export const IMAGE_COMPRESS_MAX_MB = 1
export const IMAGE_COMPRESS_MAX_PX = 1920
export const PDF_MAX_MB = 5

// Validate a file object against allowed mime types and per-type size limits.
// Applied AFTER image compression so images are expected to be within IMAGE_COMPRESS_MAX_MB.
// Returns { ok: true } or { ok: false, error: string }.
export function validateReceiptFile(file) {
  if (!file) return { ok: false, error: 'No file selected.' }

  if (!RECEIPT_ALLOWED_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: `Unsupported file type (${file.type || 'unknown'}). Allowed: JPG, PNG, HEIC, WebP, PDF.`,
    }
  }

  if (file.type === 'application/pdf') {
    const pdfMax = PDF_MAX_MB * 1024 * 1024
    if (file.size > pdfMax) {
      return {
        ok: false,
        error: `PDF is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${PDF_MAX_MB}MB — please compress or split it.`,
      }
    }
    return { ok: true }
  }

  // Images: soft warning threshold is IMAGE_COMPRESS_MAX_MB (compression is expected).
  // If an image comes in larger than RECEIPT_MAX_SIZE after compression, still reject.
  if (file.type.startsWith('image/')) {
    if (file.size > RECEIPT_MAX_SIZE) {
      return {
        ok: false,
        error: `Image is too large after compression (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 20MB.`,
      }
    }
    return { ok: true }
  }

  if (file.size > RECEIPT_MAX_SIZE) {
    return {
      ok: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 20MB.`,
    }
  }
  return { ok: true }
}

// Compress an image file to IMAGE_COMPRESS_MAX_MB / IMAGE_COMPRESS_MAX_PX.
// Non-image files are returned as-is (caller then runs validateReceiptFile to reject oversized PDFs).
// Progress cb: onProgress(phase, percent) — phase = 'compress' | 'upload'.
export async function prepareReceiptFile(file, onProgress) {
  if (!file) throw new Error('No file selected.')
  if (file.type.startsWith('image/')) {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: IMAGE_COMPRESS_MAX_MB,
        maxWidthOrHeight: IMAGE_COMPRESS_MAX_PX,
        useWebWorker: true,
        onProgress: (p) => {
          // image-compression reports 0-100
          if (typeof onProgress === 'function') onProgress('compress', Math.round(p || 0))
        },
      })
      if (typeof onProgress === 'function') onProgress('compress', 100)
      return compressed
    } catch (e) {
      // Fall through to original file if compression fails (e.g. Safari HEIC).
      // eslint-disable-next-line no-console
      console.warn('[prepareReceiptFile] image compression failed, uploading original:', e?.message)
      return file
    }
  }
  return file
}

// Build a storage path that complies with the RLS policy: <user_id>/<receipt_id>/<filename>
// The <receipt_id> can be a temporary uuid when uploading a new receipt (we call gen_random_uuid() via DB default).
// Because the bucket is private, users MUST only list objects under their own prefix.
export function buildReceiptStoragePath(userId, receiptId, originalName) {
  // Strip path separators from the original name to avoid escaping the target folder.
  const safeName = originalName.replace(/[\\/]/g, '_')
  return `${userId}/${receiptId}/${safeName}`
}

// CRUD + Storage upload/download hooks for the `receipts` table.
export function useReceipts() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // Upload a file to the receipts bucket, returns { file_path, file_name, file_type, file_size }
  // If receiptId is not yet known (new record), pass a freshly generated uuid;
  // after DB insert succeeds the client can keep the same path because the path is keyed by userId already.
  // onProgress: (phase, percent) => void — phase = 'compress' | 'upload'
  const uploadReceiptFile = useCallback(async ({ file, receiptId, onProgress }) => {
    if (!user) throw new Error('Not authenticated')
    if (!receiptId) throw new Error('Missing receiptId for storage path')

    const check = validateReceiptFile(file)
    if (!check.ok) throw new Error(check.error)

    const path = buildReceiptStoragePath(user.id, receiptId, file.name)
    const { error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        onProgress: (ev) => {
          if (typeof onProgress !== 'function') return
          const percent = ev.totalBytes ? Math.round((ev.bytesSent / ev.totalBytes) * 100) : 0
          onProgress('upload', percent)
        },
      })
    if (error) throw error
    if (typeof onProgress === 'function') onProgress('upload', 100)

    return {
      file_path: path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    }
  }, [user])

  // Delete a file from the receipts bucket (used when receipt is deleted or replaced).
  const deleteReceiptFile = useCallback(async (filePath) => {
    if (!filePath) return
    const { error } = await supabase.storage.from(RECEIPT_BUCKET).remove([filePath])
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[useReceipts] failed to remove storage file:', error.message)
    }
  }, [])

  // Create a receipt record and (optionally) upload its file.
  // payload fields: title, date, category, amount, note, [file]
  const createReceipt = useCallback(async (payload, { onProgress } = {}) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    try {
      const receiptId = crypto.randomUUID()
      const fileMeta = payload.file
        ? await uploadReceiptFile({ file: payload.file, receiptId, onProgress })
        : null

      const row = {
        id: receiptId,
        user_id: user.id,
        title: payload.title.trim(),
        date: payload.date,
        category: payload.category,
        amount: Number(payload.amount) || 0,
        note: payload.note?.trim() || null,
        ...(fileMeta ?? { file_path: '', file_name: '', file_type: '', file_size: 0 }),
      }

      const { data, error } = await supabase
        .from('receipts')
        .insert(row)
        .select()
        .single()
      if (error) {
        // Rollback the uploaded file if DB insert fails.
        if (fileMeta) await deleteReceiptFile(fileMeta.file_path)
        throw error
      }
      return data
    } finally {
      setLoading(false)
    }
  }, [user, uploadReceiptFile, deleteReceiptFile])

  // Update receipt metadata; optionally pass a new File in payload.replaceFile to swap.
  const updateReceipt = useCallback(async (receiptId, payload, { replaceFile = null, onProgress } = {}) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    try {
      let fileMeta = null
      let oldPathToDelete = null

      if (replaceFile) {
        fileMeta = await uploadReceiptFile({ file: replaceFile, receiptId, onProgress })
        oldPathToDelete = payload._current_file_path || null
      }

      const update = {
        ...(payload.title  !== undefined ? { title:  payload.title.trim() } : {}),
        ...(payload.date   !== undefined ? { date:   payload.date } : {}),
        ...(payload.category !== undefined ? { category: payload.category } : {}),
        ...(payload.amount !== undefined ? { amount: Number(payload.amount) || 0 } : {}),
        ...(payload.note   !== undefined ? { note: payload.note?.trim() || null } : {}),
        ...(fileMeta ?? {}),
      }

      const { data, error } = await supabase
        .from('receipts')
        .update(update)
        .eq('id', receiptId)
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) {
        if (fileMeta) await deleteReceiptFile(fileMeta.file_path)
        throw error
      }

      if (oldPathToDelete && fileMeta && oldPathToDelete !== fileMeta.file_path) {
        await deleteReceiptFile(oldPathToDelete)
      }
      return data
    } finally {
      setLoading(false)
    }
  }, [user, uploadReceiptFile, deleteReceiptFile])

  // Fetch a single receipt by id (RLS will filter user_id for us).
  const getReceipt = useCallback(async (receiptId) => {
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .single()
    if (error) throw error
    return data
  }, [user])

  // List receipts; supports category filter + text search (on title/note) + optional date range.
  const listReceipts = useCallback(async (opts = {}) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    try {
      let q = supabase
        .from('receipts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      if (opts.category && opts.category !== 'all') {
        q = q.eq('category', opts.category)
      }
      if (opts.search && opts.search.trim()) {
        const s = `%${opts.search.trim().toLowerCase()}%`
        q = q.or(`title.ilike.${s},note.ilike.${s},file_name.ilike.${s}`)
      }
      if (opts.dateFrom) q = q.gte('date', opts.dateFrom)
      if (opts.dateTo)   q = q.lte('date', opts.dateTo)

      q = q.order('date', { ascending: false }).order('created_at', { ascending: false })

      const { data, error, count } = await q
      if (error) throw error

      // Compute total amount across the filtered set (for summary bar).
      const totalAmount = data.reduce((sum, r) => sum + Number(r.amount || 0), 0)
      return { items: data, count, totalAmount }
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteReceipt = useCallback(async (receiptId, filePath) => {
    if (!user) throw new Error('Not authenticated')
    setLoading(true)
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receiptId)
        .eq('user_id', user.id)
      if (error) throw error
      await deleteReceiptFile(filePath)
    } finally {
      setLoading(false)
    }
  }, [user, deleteReceiptFile])

  // Get a signed URL for previewing a private bucket object.
  // Pass opts.transform = { width, height, ... } to request a resized variant via Supabase image transformation.
  // Note: image transforms only work on image files; callers should only pass transform on known images.
  const getSignedUrl = useCallback(async (filePath, expiresIn = 60 * 60, opts = {}) => {
    if (!filePath) return null
    const { data, error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .createSignedUrl(filePath, expiresIn, opts.transform ? { transform: opts.transform } : undefined)
    if (error) throw error
    return data?.signedUrl ?? null
  }, [])

  // Download the original file using the Storage client (so RLS/anon key is properly appended for private buckets).
  const downloadFile = useCallback(async (filePath) => {
    if (!filePath) throw new Error('Missing filePath')
    const { data, error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .download(filePath)
    if (error) throw error
    return data
  }, [])

  return {
    loading,
    createReceipt,
    updateReceipt,
    getReceipt,
    listReceipts,
    deleteReceipt,
    getSignedUrl,
    downloadFile,
    uploadReceiptFile,
    deleteReceiptFile,
  }
}
