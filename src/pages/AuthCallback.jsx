import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  MailCheck,
  ArrowLeft,
  Send,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Loader from '../components/Loader'

// Status values for the callback flow.
const STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(STATUS.LOADING)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [countdown, setCountdown] = useState(3)
  const [resending, setResending] = useState(false)
  const [resentInfo, setResentInfo] = useState('')

  // --- Finalize success: ensure profile exists, start countdown redirect ---
  const finalizeSuccess = (user) => {
    const email = user?.email || ''
    setUserEmail(email)
    // Try to create the profile row idempotently; ignore duplicates.
    if (user?.id) {
      supabase
        .from('profiles')
        .insert({ id: user.id })
        .then(({ error: profileError }) => {
          if (profileError && profileError.code !== '23505') {
            // eslint-disable-next-line no-console
            console.warn('[AuthCallback] profile insert (non-fatal):', profileError.message)
          }
        })
    }
    setStatus(STATUS.SUCCESS)
  }

  useEffect(() => {
    let mounted = true
    let timeoutId = 0
    let unsub = null

    const failWith = (msg) => {
      if (!mounted) return
      setError(msg || '邮箱验证失败或链接已失效。')
      setStatus(STATUS.ERROR)
    }

    // Safety timeout: if the SDK can't establish a session within 15s, fail.
    timeoutId = window.setTimeout(() => {
      failWith('验证超时，未检测到有效会话。请尝试重新发送验证邮件或直接登录。')
    }, 15000)

    // --- Primary driver: onAuthStateChange. Supabase SDK with detectSessionInUrl
    // will parse the hash (#access_token=...&type=signup) and fire either:
    //   SIGNED_IN   -> session created successfully after email confirmation
    //   PASSWORD_RECOVERY  or USER_UPDATED (for some flows)
    // If the token is invalid / already consumed, no session event fires and we
    // rely on the safety timeout.
    const listener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      // Accept any event that delivers a valid session with a confirmed user.
      if (session?.user) {
        // Some flows (e.g. magic link) come back with email_confirmed_at null
        // initially but the user is already otherwise valid. Treat the fact
        // that we *have* a session here as proof enough; go ahead.
        window.clearTimeout(timeoutId)
        finalizeSuccess(session.user)
        return
      }

      // Fallback: an explicit error-like event without a session.
      if (event === 'USER_DELETED' || event === 'SIGNED_OUT') {
        window.clearTimeout(timeoutId)
        failWith('此验证链接已无效，请重新发送验证邮件。')
      }
    })
    unsub = listener.data.subscription

    // --- Belt-and-suspenders: also getSession() right now in case the SDK has
    // already processed the URL hash before this effect ran.
    supabase.auth
      .getSession()
      .then(({ data: { session }, error: getErr }) => {
        if (!mounted) return
        if (getErr) {
          window.clearTimeout(timeoutId)
          failWith(getErr.message)
          return
        }
        if (session?.user) {
          window.clearTimeout(timeoutId)
          finalizeSuccess(session.user)
        }
      })
      .catch((e) => {
        if (!mounted) return
        window.clearTimeout(timeoutId)
        failWith(e?.message || '读取会话失败。')
      })

    return () => {
      mounted = false
      window.clearTimeout(timeoutId)
      try {
        unsub?.unsubscribe?.()
      } catch {
        /* ignore */
      }
    }
  }, [])

  // --- Success: 3s countdown auto-redirect to dashboard ---
  useEffect(() => {
    if (status !== STATUS.SUCCESS) return
    if (countdown <= 0) {
      navigate('/dashboard', { replace: true })
      return undefined
    }
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [status, countdown, navigate])

  const handleResend = async () => {
    if (!userEmail) {
      setError('请输入邮箱地址后重试。')
      return
    }
    setResending(true)
    setError('')
    setResentInfo('')
    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email: userEmail,
    })
    setResending(false)
    if (resendErr) {
      setError(resendErr.message)
      return
    }
    setResentInfo(`验证邮件已重新发送到 ${userEmail}，请查收邮件并点击新的验证链接。`)
  }

  // --- Rendering ---
  if (status === STATUS.LOADING) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">正在验证邮箱…</h2>
          <p className="mt-1 text-sm text-slate-500">请稍候，我们正在确认你的验证链接是否有效。</p>
          <div className="mt-6">
            <Loader label="Processing" />
          </div>
        </div>
      </div>
    )
  }

  if (status === STATUS.SUCCESS) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">邮箱验证成功 🎉</h2>
          <p className="mt-2 text-sm text-slate-500">
            你好，<span className="font-medium text-slate-700">{userEmail || '用户'}</span>，
            你的账号已成功激活。
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
            <span>{countdown > 0 ? `${countdown} 秒后自动跳转到 Dashboard…` : '正在跳转…'}</span>
            {countdown > 0 && (
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="btn-primary mt-6 w-full justify-center px-4 py-2.5 text-sm"
          >
            立即进入 Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ERROR state
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-9 w-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">验证失败</h2>
          <p className="mt-2 text-sm text-slate-500">
            无法完成邮箱验证。可能的原因：链接已被使用、已过期，或网络异常。
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resentInfo && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 p-3 text-sm text-accent-700">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{resentInfo}</span>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {userEmail && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="btn-outline w-full justify-center px-4 py-2.5 text-sm"
            >
              <Send className="h-4 w-4" />
              {resending ? '重新发送中…' : `重新发送验证邮件至 ${userEmail}`}
            </button>
          )}

          <Link
            to="/auth"
            className="btn-primary w-full inline-flex justify-center px-4 py-2.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            返回登录 / 注册页
          </Link>
        </div>
      </div>
    </div>
  )
}
