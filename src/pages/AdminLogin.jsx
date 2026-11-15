import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './AdminLogin.css'

// ─── Error message map ────────────────────────────────────────────────────────
const KNOWN_ERRORS = {
  'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'Email not confirmed': 'البريد الإلكتروني لم يتم تأكيده بعد.',
  'Too many requests': 'محاولات كثيرة. يرجى الانتظار ثم المحاولة مجدداً.',
}

function arabicError(message) {
  for (const [key, value] of Object.entries(KNOWN_ERRORS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مجدداً.'
}

// ─── Eye icons (inline SVG, no extra dependency) ─────────────────────────────
function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
function AdminLogin() {
  const { status, isAdmin, accessDenied, clearAccessDenied } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const emailRef = useRef(null)

  // ── Redirect to dashboard when the admin session is confirmed ──────────────
  // This effect only triggers navigation — it never calls setState.
  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      navigate('/admin', { replace: true })
    }
  }, [status, isAdmin, navigate])

  // ── Derive the displayed error ─────────────────────────────────────────────
  // "accessDenied" is set in AuthContext when a user authenticated successfully
  // but was not found in admin_users (and was then signed out automatically).
  // We read it directly from context — no setState inside an effect.
  const displayedError = accessDenied
    ? 'ليس لديك صلاحية الوصول إلى لوحة التحكم.'
    : formError

  // ── Clear stale error state when the user edits the form ──────────────────
  function handleEmailChange(e) {
    setEmail(e.target.value)
    if (accessDenied) clearAccessDenied()
    if (formError) setFormError('')
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value)
    if (accessDenied) clearAccessDenied()
    if (formError) setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!email.trim()) {
      setFormError('يرجى إدخال البريد الإلكتروني.')
      emailRef.current?.focus()
      return
    }
    if (!password) {
      setFormError('يرجى إدخال كلمة المرور.')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (authError) {
      setFormError(arabicError(authError.message))
      return
    }

    // AuthContext.onAuthStateChange fires next:
    // ✓ User in admin_users  → SET_ADMIN dispatched → useEffect above redirects.
    // ✗ User not in admin_users → AuthContext signs them out and dispatches
    //   SET_ACCESS_DENIED → accessDenied becomes true → displayedError renders
    //   the Arabic unauthorised message on the next render automatically.
    // No setState call here — the error surfaces purely from context state.
  }

  if (status === 'initializing') {
    return (
      <section className="page">
        <div className="container">
          <p style={{ color: 'var(--color-text-muted)' }}>جاري التحميل…</p>
        </div>
      </section>
    )
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        {/* Header */}
        <header className="admin-login-card__header">
          <h1 className="admin-login-card__title">لوحة التحكم</h1>
          <p className="admin-login-card__subtitle">تسجيل دخول الشيف</p>
        </header>

        {/* Error banner */}
        {displayedError && (
          <div className="admin-login-card__error" role="alert">
            {displayedError}
          </div>
        )}

        {/* Form */}
        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Email */}
          <div className="admin-login-form__field">
            <label
              htmlFor="login-email"
              className="admin-login-form__label"
            >
              البريد الإلكتروني
            </label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              className="admin-login-form__input"
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              inputMode="email"
              dir="ltr"
              disabled={loading}
              placeholder="admin@example.com"
            />
          </div>

          {/* Password */}
          <div className="admin-login-form__field">
            <label
              htmlFor="login-password"
              className="admin-login-form__label"
            >
              كلمة المرور
            </label>
            <div className="admin-login-form__password-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="admin-login-form__input admin-login-form__input--password"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                dir="ltr"
                disabled={loading}
              />
              <button
                type="button"
                className="admin-login-form__eye"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={0}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="admin-login-form__submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'جاري تسجيل الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default AdminLogin
