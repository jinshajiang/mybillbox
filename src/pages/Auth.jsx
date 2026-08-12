import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import Loader from '../components/Loader'

// Three modes handled by a single card on a light background.
const MODES = {
  SIGNIN: 'signin',
  REGISTER: 'register',
  FORGOT: 'forgot',
}

export default function Auth() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/dashboard'

  const [mode, setMode] = useState(MODES.SIGNIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Redirect authenticated users away from the auth page.
  if (loading) {
    return <Loader label="Loading…" className="min-h-screen" />
  }
  if (session) {
    return <Navigate to={from} replace />
  }

  const reset = () => {
    setError('')
    setInfo('')
  }

  async function handleSignIn(e) {
    e.preventDefault()
    reset()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate(from, { replace: true })
  }

  async function handleRegister(e) {
    e.preventDefault()
    reset()
    if (!email || !password) {
      setError('Please enter your email and a password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setSubmitting(false)
      setError(error.message)
      return
    }

    // If a session is returned (email confirmation disabled), create a profile
    // row and go straight to the dashboard.
    if (data.session && data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id })
      setSubmitting(false)
      if (profileError) {
        // The auth account exists, but the profile could not be created.
        // Show the error but still let the user proceed; the profile can be
        // completed later in Settings.
        console.error('[Auth] profile insert error:', profileError.message)
      }
      navigate(from, { replace: true })
      return
    }

    // No session returned: email confirmation is enabled.
    setSubmitting(false)
    setInfo('Check your email to confirm your account.')
    setMode(MODES.SIGNIN)
  }

  async function handleForgot(e) {
    e.preventDefault()
    reset()
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth',
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setInfo('If an account exists for that email, a reset link is on its way.')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">
            B
          </div>
          <span className="text-lg font-bold text-brand">BillBox</span>
        </Link>
        <Link to="/" className="btn-ghost px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="card w-full max-w-md p-6 sm:p-8">
          {/* Tabs (forgot mode hides tabs) */}
          {mode !== MODES.FORGOT && (
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode(MODES.SIGNIN)
                  reset()
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === MODES.SIGNIN
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-slate-500 hover:text-brand'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(MODES.REGISTER)
                  reset()
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === MODES.REGISTER
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-slate-500 hover:text-brand'
                }`}
              >
                Create account
              </button>
            </div>
          )}

          <h1 className="text-2xl font-bold text-brand">
            {mode === MODES.SIGNIN && 'Welcome back'}
            {mode === MODES.REGISTER && 'Create your account'}
            {mode === MODES.FORGOT && 'Reset your password'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === MODES.SIGNIN && 'Sign in to continue to your dashboard.'}
            {mode === MODES.REGISTER && 'Start creating VAT-compliant invoices in minutes.'}
            {mode === MODES.FORGOT && "We'll email you a link to reset your password."}
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 p-3 text-sm text-accent-700">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {/* Sign in */}
          {mode === MODES.SIGNIN && (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <div>
                <label htmlFor="signin-email" className="label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signin-password" className="label">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input px-9"
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMode(MODES.FORGOT)
                    reset()
                  }}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full px-4 py-2.5">
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {/* Register */}
          {mode === MODES.REGISTER && (
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div>
                <label htmlFor="register-email" className="label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="register-password" className="label">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input px-9"
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="register-confirm" className="label">Confirm password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input pl-9"
                    placeholder="Re-enter your password"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-accent w-full px-4 py-2.5">
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          {/* Forgot password */}
          {mode === MODES.FORGOT && (
            <form onSubmit={handleForgot} className="mt-6 space-y-4">
              <div>
                <label htmlFor="forgot-email" className="label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full px-4 py-2.5">
                {submitting ? 'Sending link…' : 'Send reset link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(MODES.SIGNIN)
                  reset()
                }}
                className="w-full text-center text-sm font-medium text-brand hover:underline"
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
