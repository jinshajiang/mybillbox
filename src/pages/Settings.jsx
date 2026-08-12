import { useEffect, useRef, useState } from 'react'
import {
  Save,
  Upload,
  Building2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { supabase, LOGO_BUCKET } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { COUNTRIES } from '../data/vatRates'
import Loader from '../components/Loader'

export default function Settings() {
  const { user, profile, refreshProfile, loading } = useAuth()
  const [form, setForm] = useState({
    company_name: '',
    address: '',
    vat_number: '',
    country: 'DE',
  })
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Initialise local form state from the profile once it arrives.
  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name || '',
        address: profile.address || '',
        vat_number: profile.vat_number || '',
        country: profile.country || 'DE',
      })
      setLogoUrl(profile.logo_url || '')
    }
  }, [profile])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const uploadLogo = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: true })
      if (upErr) {
        setError(upErr.message)
        return
      }
      const { data: urlData } = supabase.storage
        .from(LOGO_BUCKET)
        .getPublicUrl(path)
      setLogoUrl(urlData.publicUrl)
    } catch (e) {
      setError(e.message || 'Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) uploadLogo(file)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadLogo(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.company_name.trim()) {
      setError('Company name is required.')
      return
    }
    setSaving(true)
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({
          company_name: form.company_name.trim(),
          address: form.address,
          vat_number: form.vat_number,
          country: form.country,
          logo_url: logoUrl,
        })
        .eq('id', user.id)
      if (err) {
        setError(err.message)
      } else {
        await refreshProfile()
        showToast('Settings saved')
      }
    } catch (e2) {
      setError(e2.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !profile) {
    return <Loader label="Loading settings…" />
  }

  const initial = (form.company_name || user?.email || '?')
    .charAt(0)
    .toUpperCase()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your company profile and branding.
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

      {/* Logo preview */}
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Company logo"
            className="h-20 w-20 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
            {initial}
          </div>
        )}
        <div>
          <p className="font-semibold text-brand">
            {form.company_name || 'Your Company'}
          </p>
          <p className="text-sm text-slate-500">Logo &amp; company identity</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card space-y-5 p-6">
        {/* Logo upload zone */}
        <div>
          <label className="label">
            <ImageIcon className="mr-1 inline h-4 w-4" />
            Company logo
          </label>
          <div
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
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
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
                <p className="text-sm">Uploading…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <div className="rounded-full bg-brand-50 p-2 text-brand">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Click to upload or drag an image
                </p>
                <p className="text-xs text-slate-400">PNG, JPG up to 2MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {logoUrl && (
            <button
              type="button"
              className="mt-2 text-xs font-medium text-slate-500 hover:text-red-600"
              onClick={() => setLogoUrl('')}
            >
              Remove logo
            </button>
          )}
        </div>

        <div>
          <label className="label" htmlFor="company_name">
            <Building2 className="mr-1 inline h-4 w-4" />
            Company name
          </label>
          <input
            id="company_name"
            type="text"
            className="input"
            value={form.company_name}
            onChange={handleChange('company_name')}
            placeholder="Acme GmbH"
          />
        </div>

        <div>
          <label className="label" htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            className="input min-h-[96px] resize-y"
            value={form.address}
            onChange={handleChange('address')}
            placeholder="Street, number, postal code, city"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="vat_number">
              VAT number
            </label>
            <input
              id="vat_number"
              type="text"
              className="input"
              value={form.vat_number}
              onChange={handleChange('vat_number')}
              placeholder="DE123456789"
            />
          </div>
          <div>
            <label className="label" htmlFor="country">
              Country
            </label>
            <select
              id="country"
              className="input"
              value={form.country}
              onChange={handleChange('country')}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="btn-primary px-5 py-2.5" disabled={saving}>
            {saving ? (
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
        </div>
      </form>
    </div>
  )
}
