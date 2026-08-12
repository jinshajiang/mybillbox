import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe,
  FileText,
  Download,
  Check,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'

// Reusable BillBox logo lockup used in the navbar and footer.
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">
        B
      </div>
      <span className="text-lg font-bold text-brand">BillBox</span>
    </Link>
  )
}

const FEATURES = [
  {
    icon: Globe,
    title: 'Choose your country',
    description:
      'Pick from 6 supported European countries with correct VAT rates.',
  },
  {
    icon: FileText,
    title: 'Fill in the details',
    description:
      'Add your client info, service, and pricing in a guided 4-step form.',
  },
  {
    icon: Download,
    title: 'Download PDF invoice',
    description:
      'Get a print-ready A4 PDF with your branding and VAT breakdown, instantly.',
  },
]

const PRICING = [
  {
    name: 'Free',
    price: '€0',
    period: '/mo',
    description: 'Everything you need to send your first invoices.',
    features: ['5 invoices per month', 'Essential features', 'PDF download'],
    cta: 'Get Started Free',
    ctaTo: '/auth',
    disabled: false,
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '€9',
    period: '/mo',
    description: 'For freelancers sending invoices regularly.',
    features: ['Unlimited invoices', 'All 6 countries', 'Priority support'],
    cta: 'Coming Soon',
    ctaTo: null,
    disabled: true,
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '€19',
    period: '/mo',
    description: 'For teams that need branding and collaboration.',
    features: ['Everything in Starter', 'Logo branding', 'Multi-user'],
    cta: 'Coming Soon',
    ctaTo: null,
    disabled: true,
    highlighted: false,
  },
]

const FAQS = [
  {
    q: 'Which countries does BillBox support?',
    a: 'BillBox currently supports Germany, France, Italy, Spain, the Netherlands, and the United Kingdom, each with its applicable VAT rates.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. BillBox runs entirely in your browser. You can create and download invoices from any modern web browser on desktop or mobile without installing software.',
  },
  {
    q: 'Are the VAT rates guaranteed correct?',
    a: 'The VAT rates shown are for reference only and may change. You must verify all rates and calculations with your local tax authority before issuing an invoice.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel your subscription at any time. Paid plans are also covered by a 30-day money-back guarantee.',
  },
  {
    q: 'Is my data stored in the EU?',
    a: 'Yes. All data is stored on Supabase infrastructure in the Frankfurt (Germany) region, in compliance with EU data protection law including the GDPR.',
  },
]

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-brand">{item.q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <p className="px-5 pb-5 text-slate-600">{item.a}</p>
      )}
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/auth" className="btn-ghost px-4 py-2 text-sm">
              Sign in
            </Link>
            <Link to="/auth" className="btn-accent px-4 py-2 text-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-4 py-1.5 text-sm font-medium text-accent-700">
            <Globe className="h-4 w-4" />
            Supports DE · FR · IT · ES · NL · UK
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight text-brand lg:text-5xl">
            Invoice like a local, anywhere in Europe
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Create VAT-compliant PDF invoices for 6 European countries in 3 clicks.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/auth" className="btn-accent px-7 py-3 text-base">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-brand">How it works</h2>
          <p className="mt-3 text-slate-600">
            From country selection to a finished PDF in three simple steps.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-accent-600">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 text-lg font-bold text-brand">{f.title}</h3>
                <p className="mt-2 text-slate-600">{f.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-brand">Simple pricing</h2>
            <p className="mt-3 text-slate-600">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`card relative flex flex-col p-6 ${
                  plan.highlighted ? 'ring-2 ring-accent' : ''
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-brand">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-brand">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-slate-700">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                {plan.disabled ? (
                  <button
                    type="button"
                    disabled
                    className="btn-outline mt-6 w-full px-4 py-2.5"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    to={plan.ctaTo}
                    className={`mt-6 w-full px-4 py-2.5 text-center ${
                      plan.highlighted ? 'btn-accent' : 'btn-primary'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-brand">Frequently asked questions</h2>
          <p className="mt-3 text-slate-600">
            Everything you need to know about BillBox.
          </p>
        </div>
        <div className="mt-10 space-y-3">
          {FAQS.map((item) => (
            <FaqItem key={item.q} item={item} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Logo />
              <p className="mt-3 max-w-xs text-sm text-slate-500">
                VAT-compliant PDF invoices for European freelancers. Built for the EU.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><Link to="/auth" className="hover:text-brand">Sign in</Link></li>
                <li><Link to="/auth" className="hover:text-brand">Get started</Link></li>
                <li><Link to="/" className="hover:text-brand">Features</Link></li>
                <li><Link to="/" className="hover:text-brand">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><Link to="/privacy" className="hover:text-brand">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-brand">Terms of Service</Link></li>
                <li><Link to="/disclaimer" className="hover:text-brand">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row">
            <p>© 2026 BillBox. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-brand">Privacy</Link>
              <Link to="/terms" className="hover:text-brand">Terms</Link>
              <Link to="/disclaimer" className="hover:text-brand">Disclaimer</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
