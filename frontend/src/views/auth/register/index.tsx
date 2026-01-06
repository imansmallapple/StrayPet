import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, setAccessHeader } from '@/services/modules/auth'
import './index.scss'

export default function Register() {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const nav = useNavigate()

  const canSend = useMemo(() => !sending && countdown === 0 && /\S+@\S+\.\S+/.test(email), [sending, countdown, email])

  async function onSendCode(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!canSend) return
    try {
      setErrorMessage('')
      setSending(true)
      await authApi.sendEmailCode(email)
      setSuccessMessage('✓ Verification code sent to your email')
      // 60s 倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((s) => {
          if (s <= 1) { clearInterval(timer); return 0 }
          return s - 1
        })
      }, 1000)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.email?.[0] || 'Failed to send code, please try again later'
      setErrorMessage('✗ ' + msg)
    } finally {
      setSending(false)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const username = String(f.get('username') || '')
    const password = String(f.get('password') || '')
    const password1 = String(f.get('password1') || '')
    const code = String(f.get('code') || '')
    
    setErrorMessage('')
    setSuccessMessage('')

    if (!username || !email || !password || !password1 || !code) {
      setErrorMessage('✗ Please fill in all fields')
      return
    }
    if (password !== password1) {
      setErrorMessage('✗ Passwords do not match')
      return
    }
    if (password.length < 8) {
      setErrorMessage('✗ Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const { data } = await authApi.register({ username, email, password, password1, code })
      if (data?.tokens?.access) {
        localStorage.setItem('accessToken', data.tokens.access)
        if (data.tokens.refresh) localStorage.setItem('refreshToken', data.tokens.refresh)
        setAccessHeader(data.tokens.access)
        const me = await authApi.getMe().then(r => r.data)
        localStorage.setItem('user', JSON.stringify(me))
        window.dispatchEvent(new Event('auth:updated'))
        setSuccessMessage('✓ Registration successful, redirecting...')
        setTimeout(() => nav('/home'), 1000)
      } else {
        setSuccessMessage('✓ Registration successful, please sign in')
        setTimeout(() => nav('/auth/login'), 1500)
      }
    } catch (err: any) {
      const d = err?.response?.data || {}
      const msg =
        d?.email?.[0] ||
        d?.username?.[0] ||
        d?.password?.[0] ||
        d?.non_field_errors?.[0] ||
        d?.detail ||
        (typeof d === 'string' ? d : '') ||
        '注册失败，请检查信息或稍后再试'
      setErrorMessage('✗ ' + msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="logo">🐾</div>
          <h1>Create Account</h1>
          <p>Join us and find your furry companion</p>
        </div>

        {errorMessage && <div className={`error-message ${errorMessage ? 'show' : ''}`}>{errorMessage}</div>}
        {successMessage && <div className={`success-message ${successMessage ? 'show' : ''}`}>{successMessage}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username (3-20 characters)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
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
                name="code"
                type="text"
                placeholder="Enter verification code"
                disabled={loading}
                maxLength={6}
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
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              disabled={loading}
            />
            <div className="password-hint">At least 8 characters, preferably with uppercase, lowercase and numbers</div>
          </div>

          <div className="form-group">
            <label htmlFor="password1">Confirm Password</label>
            <input
              id="password1"
              name="password1"
              type="password"
              placeholder="Re-enter your password"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="primary"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?
            <Link to="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
