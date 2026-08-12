// Hardcoded VAT reference data for supported European countries.
// Rates are for reference only — users must verify with their local tax authority.
export const COUNTRIES = [
  {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    rates: [
      { label: 'Standard 19%', value: 19 },
      { label: 'Reduced 7%', value: 7 },
      { label: 'Zero 0%', value: 0 },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    rates: [
      { label: 'Standard 20%', value: 20 },
      { label: 'Zero 0%', value: 0 },
    ],
  },
  {
    code: 'IT',
    name: 'Italy',
    currency: 'EUR',
    currencySymbol: '€',
    rates: [
      { label: 'Standard 22%', value: 22 },
      { label: 'Zero 0%', value: 0 },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    currency: 'EUR',
    currencySymbol: '€',
    rates: [
      { label: 'Standard 21%', value: 21 },
      { label: 'Zero 0%', value: 0 },
    ],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    currency: 'EUR',
    currencySymbol: '€',
    rates: [
      { label: 'Standard 21%', value: 21 },
      { label: 'Reduced 9%', value: 9 },
      { label: 'Zero 0%', value: 0 },
    ],
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    rates: [
      { label: 'Standard 20%', value: 20 },
      { label: 'Zero 0%', value: 0 },
    ],
  },
]

// Quick lookup helpers
export const getCountry = (code) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0]

export const getCurrency = (code) => {
  const country = getCountry(code)
  return { code: country.currency, symbol: country.currencySymbol }
}

// Format an amount using the country's currency.
export const formatMoney = (amount, currencyCode = 'EUR') => {
  const locale = currencyCode === 'GBP' ? 'en-GB' : 'de-DE'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(Number(amount) || 0)
  } catch {
    return `${(Number(amount) || 0).toFixed(2)} ${currencyCode}`
  }
}

// Generate an invoice number: INV-YYYYMMDD-XXX
export const generateInvoiceNumber = (date = new Date()) => {
  const ymd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 900) + 100) // 100–999
  return `INV-${ymd}-${rand}`
}

// Add N days to a date and return YYYY-MM-DD string
export const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const todayISO = () => new Date().toISOString().slice(0, 10)
