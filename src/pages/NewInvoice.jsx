import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FilePlus2,
  Calendar,
  Calculator,
  AlertCircle,
  CheckCircle,
  Plus,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { generateInvoicePDF } from '../lib/pdf'
import InvoicePreview from '../components/InvoicePreview'
import {
  COUNTRIES,
  getCountry,
  getCurrency,
  formatMoney,
  generateInvoiceNumber,
  addDays,
  todayISO,
} from '../data/vatRates'

const STEPS = [
  { id: 1, label: 'Client' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'VAT' },
  { id: 4, label: 'Preview' },
]

const standardRateFor = (code) => getCountry(code).rates[0].value

function createInitialForm() {
  const today = todayISO()
  return {
    clientName: '',
    clientAddress: '',
    clientVat: '',
    clientCountry: 'DE',
    serviceDescription: '',
    quantity: 1,
    unitPrice: 0,
    issueDate: today,
    dueDate: addDays(today, 30),
    vatRate: standardRateFor('DE'),
    invoiceNumber: generateInvoiceNumber(),
  }
}

export default function NewInvoice() {
  const { profile, user } = useAuth()
  const [form, setForm] = useState(createInitialForm)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [saveWarning, setSaveWarning] = useState(null)
  const [stepErrors, setStepErrors] = useState({})
  const previewRef = useRef(null)

  // Stamp the data-invoice-number attribute on the preview element so the PDF
  // filename is correct. The ref points at the InvoicePreview root DOM node.
  useEffect(() => {
    if (previewRef.current && form.invoiceNumber) {
      previewRef.current.setAttribute('data-invoice-number', form.invoiceNumber)
    }
  }, [form.invoiceNumber, step, success, saveWarning])

  const country = useMemo(() => getCountry(form.clientCountry), [form.clientCountry])
  const currency = useMemo(() => getCurrency(form.clientCountry), [form.clientCountry])

  const subtotal = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0)
  const vatAmount = (subtotal * (Number(form.vatRate) || 0)) / 100
  const total = subtotal + vatAmount

  const builtInvoice = {
    invoice_number: form.invoiceNumber,
    client_name: form.clientName,
    client_address: form.clientAddress,
    client_vat: form.clientVat,
    country_code: form.clientCountry,
    issue_date: form.issueDate,
    due_date: form.dueDate,
    service_description: form.serviceDescription,
    quantity: form.quantity,
    unit_price: form.unitPrice,
    vat_rate: form.vatRate,
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setStepErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validateStep = (s) => {
    const errors = {}
    if (s === 1) {
      if (!form.clientName.trim()) errors.clientName = 'Client name is required.'
    } else if (s === 2) {
      if (!form.serviceDescription.trim())
        errors.serviceDescription = 'Service description is required.'
      if (form.unitPrice === '' || Number(form.unitPrice) < 0)
        errors.unitPrice = 'Unit price must be 0 or greater.'
      if (Number(form.quantity) < 1) errors.quantity = 'Quantity must be at least 1.'
    }
    return errors
  }

  const handleNext = () => {
    const errors = validateStep(step)
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors)
      return
    }
    setStepErrors({})
    setStep((s) => Math.min(s + 1, 4))
  }

  const handleBack = () => {
    setStepErrors({})
    setStep((s) => Math.max(s - 1, 1))
  }

  const goToStep = (s) => {
    if (s < step) {
      setStepErrors({})
      setStep(s)
    }
  }

  const handleCountryChange = (code) => {
    setForm((prev) => ({
      ...prev,
      clientCountry: code,
      vatRate: standardRateFor(code),
    }))
  }

  const addDueDays = (days) => {
    setForm((prev) => ({ ...prev, dueDate: addDays(prev.issueDate, days) }))
  }

  const resetForm = () => {
    setForm(createInitialForm())
    setStep(1)
    setError(null)
    setSuccess(false)
    setSaveWarning(null)
    setStepErrors({})
  }

  const handleGeneratePDF = async () => {
    setError(null)
    setSaveWarning(null)

    // Validate all prior steps before generating.
    const allErrors = { ...validateStep(1), ...validateStep(2) }
    if (Object.keys(allErrors).length > 0) {
      setStepErrors(allErrors)
      setStep(1)
      return
    }

    setSaving(true)
    let insertError = null

    // 1. Try to save the invoice to Supabase.
    try {
      if (!user?.id) throw new Error('You must be signed in to save an invoice.')

      const { error: dbError } = await supabase.from('invoices').insert({
        user_id: user.id,
        client_name: form.clientName,
        client_address: form.clientAddress,
        client_vat: form.clientVat,
        client_country: form.clientCountry,
        invoice_number: form.invoiceNumber,
        issue_date: form.issueDate,
        due_date: form.dueDate,
        service_description: form.serviceDescription,
        quantity: Number(form.quantity),
        unit_price: Number(form.unitPrice),
        vat_rate: Number(form.vatRate),
        vat_amount: vatAmount,
        total_amount: total,
        currency: country.currency,
        status: 'draft',
        country_code: form.clientCountry,
      })

      if (dbError) throw dbError
    } catch (e) {
      insertError = e.message || 'Failed to save the invoice to the database.'
    }

    // 2. Generate the PDF regardless of whether the insert succeeded.
    //    State updates are deferred until after the PDF is generated so the
    //    preview DOM node stays mounted for html2canvas to capture.
    let pdfError = null
    try {
      await generateInvoicePDF(previewRef.current)
    } catch (e) {
      pdfError = e.message || 'Failed to generate the PDF.'
    }

    // 3. Reflect the outcome in the UI.
    if (pdfError) {
      setError(pdfError)
    } else if (insertError) {
      setSaveWarning(insertError)
    } else {
      setSuccess(true)
    }

    setSaving(false)
  }

  const isStepClickable = (s) => s < step
  const footerHidden = step === 4 && (success || saveWarning)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-brand">
          <FilePlus2 className="h-6 w-6" />
          Create New Invoice
        </h1>
      </div>

      {/* Progress bar */}
      <div className="card p-6">
        <div className="flex items-start">
          {STEPS.map((s, i) => (
            <Fragment key={s.id}>
              <button
                type="button"
                onClick={() => isStepClickable(s.id) && goToStep(s.id)}
                disabled={!isStepClickable(s.id)}
                className={`flex shrink-0 flex-col items-center gap-2 ${
                  isStepClickable(s.id) ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                    s.id < step
                      ? 'border-accent bg-accent text-white'
                      : s.id === step
                        ? 'border-brand bg-brand text-white'
                        : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {s.id < step ? <Check className="h-5 w-5" /> : s.id}
                </span>
                <span
                  className={`text-xs font-medium ${
                    s.id <= step ? 'text-brand' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 mt-[19px] h-0.5 flex-1 rounded-full transition ${
                    s.id < step ? 'bg-accent' : 'bg-slate-200'
                  }`}
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Step content card */}
      <div className="card p-6 sm:p-8">
        {/* STEP 1 — Client info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-brand">Client information</h2>

            <div>
              <label className="label" htmlFor="clientName">
                Client name
              </label>
              <input
                id="clientName"
                className="input"
                value={form.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder="Acme GmbH"
              />
              {stepErrors.clientName && (
                <p className="mt-1 text-sm text-red-600">{stepErrors.clientName}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="clientAddress">
                Client address
              </label>
              <textarea
                id="clientAddress"
                className="input min-h-[80px] resize-y"
                value={form.clientAddress}
                onChange={(e) => updateField('clientAddress', e.target.value)}
                placeholder="Street, city, postcode"
              />
            </div>

            <div>
              <label className="label" htmlFor="clientVat">
                Client VAT number <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="clientVat"
                className="input"
                value={form.clientVat}
                onChange={(e) => updateField('clientVat', e.target.value)}
                placeholder="DE123456789"
              />
            </div>

            <div>
              <label className="label" htmlFor="clientCountry">
                Client country
              </label>
              <select
                id="clientCountry"
                className="input"
                value={form.clientCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 2 — Service details */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-brand">Service details</h2>

            <div>
              <label className="label" htmlFor="serviceDescription">
                Service description
              </label>
              <textarea
                id="serviceDescription"
                className="input min-h-[80px] resize-y"
                value={form.serviceDescription}
                onChange={(e) => updateField('serviceDescription', e.target.value)}
                placeholder="Consulting services for August 2026"
              />
              {stepErrors.serviceDescription && (
                <p className="mt-1 text-sm text-red-600">{stepErrors.serviceDescription}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="quantity">
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  className="input"
                  value={form.quantity}
                  onChange={(e) => updateField('quantity', e.target.value)}
                />
                {stepErrors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{stepErrors.quantity}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="unitPrice">
                  Unit price
                </label>
                <input
                  id="unitPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  className="input"
                  value={form.unitPrice}
                  onChange={(e) => updateField('unitPrice', e.target.value)}
                  placeholder="0.00"
                />
                {stepErrors.unitPrice && (
                  <p className="mt-1 text-sm text-red-600">{stepErrors.unitPrice}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="issueDate">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Issue date
                  </span>
                </label>
                <input
                  id="issueDate"
                  type="date"
                  className="input"
                  value={form.issueDate}
                  onChange={(e) => updateField('issueDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="dueDate">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Due date
                  </span>
                </label>
                <input
                  id="dueDate"
                  type="date"
                  className="input"
                  value={form.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-1 text-xs"
                    onClick={() => addDueDays(7)}
                  >
                    <Plus className="h-3 w-3" /> 7 days
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-1 text-xs"
                    onClick={() => addDueDays(14)}
                  >
                    <Plus className="h-3 w-3" /> 14 days
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-1 text-xs"
                    onClick={() => addDueDays(30)}
                  >
                    <Plus className="h-3 w-3" /> 30 days
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — VAT */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-brand">VAT &amp; totals</h2>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calculator className="h-4 w-4 text-slate-400" />
              <span>
                {country.name} · {currency.code} {currency.symbol}
              </span>
            </div>

            <div>
              <label className="label" htmlFor="vatRate">
                VAT rate
              </label>
              <select
                id="vatRate"
                className="input"
                value={form.vatRate}
                onChange={(e) => updateField('vatRate', Number(e.target.value))}
              >
                {country.rates.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Live calculation card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-600">Live calculation</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="font-medium text-slate-800">
                    {formatMoney(subtotal, currency.code)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">VAT ({Number(form.vatRate) || 0}%)</dt>
                  <dd className="font-medium text-slate-800">
                    {formatMoney(vatAmount, currency.code)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-brand">
                  <dt>Total</dt>
                  <dd>{formatMoney(total, currency.code)}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* STEP 4 — Preview */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-brand">Preview &amp; generate</h2>

            {success ? (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-accent" />
                <h3 className="mt-3 text-lg font-bold text-brand">Invoice generated!</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Your PDF has been downloaded and the invoice was saved as a draft.
                </p>
                <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link to="/invoices" className="btn-primary px-5 py-2.5">
                    View invoice history
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={resetForm} className="btn-outline px-5 py-2.5">
                    <RotateCcw className="h-4 w-4" />
                    Create another
                  </button>
                </div>
              </div>
            ) : saveWarning ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
                <h3 className="mt-3 text-lg font-bold text-brand">PDF downloaded, but saving failed</h3>
                <p className="mt-1 text-sm text-slate-600">{saveWarning}</p>
                <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link to="/invoices" className="btn-outline px-5 py-2.5">
                    View invoice history
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={resetForm} className="btn-primary px-5 py-2.5">
                    <RotateCcw className="h-4 w-4" />
                    Create another
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="max-h-[600px] overflow-y-auto p-4 sm:p-6">
                  <InvoicePreview ref={previewRef} invoice={builtInvoice} profile={profile} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!footerHidden && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="btn-outline px-5 py-2.5">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <button type="button" onClick={handleNext} className="btn-primary px-5 py-2.5">
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGeneratePDF}
                disabled={saving}
                className="btn-accent px-5 py-2.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generate PDF
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
