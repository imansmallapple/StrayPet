// src/views/auth/forget/index.tsx
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'
import './index.scss'

export default function Forgot() {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const nav = useNavigate()

  const canSend = useMemo(
    () => !sending && countdown === 0 && /\S+@\S+\.\S+/.test(email),
    [sending, countdown, email]
  )

  function startCountdown(seconds: number) {
    setCountdown(seconds)
    const timer = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          clearInterval(timer)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  async function onSendCode(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!canSend) return
    try {
      setSending(true)
      setErrorMessage('')
      await authApi.requestReset({ email })
      setSuccessMessage('✓ Verification code sent to your email (valid for 5 minutes)')
      startCountdown(60)
    } catch (err: any) {
      const retry = err?.response?.data?.retry_after
      if (typeof retry === 'number' && retry > 0) startCountdown(retry)
      const msg = err?.response?.data?.detail || err?.response?.data?.msg || 'Failed to send code'
      setErrorMessage('✗ ' + msg)
    } finally {
      setSending(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email || !code || !pwd1 || !pwd2) {
      setErrorMessage('✗ Please fill in all fields')
      return
    }
    if (pwd1 !== pwd2) {
      setErrorMessage('✗ Passwords do not match')
      return
    }
    if (pwd1.length < 8) {
      setErrorMessage('✗ Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await authApi.confirmReset({
        email,
        code,
        new_password: pwd1,
        re_new_password: pwd2
      })
      setSuccessMessage('✓ Password reset successful, redirecting to login...')
      setTimeout(() => nav('/auth/login'), 1500)
    } catch (e: any) {
      const d = e?.response?.data
      const msg =
        d?.email?.[0] ||
        d?.code?.[0] ||
        d?.new_password?.[0] ||
        d?.re_new_password?.[0] ||
        d?.detail ||
        (typeof d === 'string' ? d : '') ||
        'Password reset failed, please check your information'
      setErrorMessage('✗ ' + msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forget-container">
      <div className="forget-card">
        <div className="forget-header">
          <div className="logo">🐾</div>
          <h1>Reset Password</h1>
          <p>Enter your email and new password to reset your account</p>
        </div>

        {errorMessage && <div className={`error-message ${errorMessage ? 'show' : ''}`}>{errorMessage}</div>}
        {successMessage && <div className={`success-message ${successMessage ? 'show' : ''}`}>{successMessage}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group code-group">
            <div style={{ flex: 1 }}>
              <label htmlFor="code">Verification Code</label>
              <input
                id="code"
                type="text"
                placeholder="Enter verification code (4 digits)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                maxLength={4}
              />
            </div>
            <button
              type="button"
              onClick={onSendCode}
              disabled={!canSend || loading}
              className="code-btn"
            >
              {countdown > 0 ? `${countdown}s` : (sending ? 'Sending...' : 'Get Code')}
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your new password"
              value={pwd1}
              onChange={(e) => setPwd1(e.target.value)}
              disabled={loading}
            />
            <div className="password-hint">At least 8 characters, preferably with uppercase, lowercase and numbers</div>
          </div>

          <div className="form-group">
            <label htmlFor="password-confirm">Confirm Password</label>
            <input
              id="password-confirm"
              type="password"
              placeholder="Re-enter your password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="primary"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>

        <div className="forget-footer">
          <p>
            Remembered your password?
            <Link to="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
