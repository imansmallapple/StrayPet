import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi, setAccessHeader } from '@/services/modules/auth'
import './index.scss'

function Login() {
  const [loading, setLoading] = useState(false)
  const [img, setImg] = useState<string>('')
  const [uid, setUid] = useState<string>('')
  const [captcha, setCaptcha] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)

  const nav = useNavigate()
  const [sp] = useSearchParams()

  async function loadCaptcha() {
    try {
      setLoadingCaptcha(true)
      setErrorMessage('')
      const response = await authApi.getCaptcha()
      const { data } = response
      setImg(data.image)
      setUid(data.uid)
      setCaptcha('')
    } catch (err: any) {
      setErrorMessage('✗ Failed to load verification code, please try again later')
      console.error('Failed to load captcha:', err)
    } finally {
      setLoadingCaptcha(false)
    }
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const username = String(f.get('username') || '')
    const password = String(f.get('password') || '')

    setErrorMessage('')

    if (!username || !password) {
      setErrorMessage('✗ Please enter username/email and password')
      return
    }
    if (!captcha || captcha.length !== 4) {
      setErrorMessage('✗ Please enter a valid 4-digit verification code')
      return
    }

    setLoading(true)
    try {
      const { data } = await authApi.login({ username, password, captcha, uid })
      localStorage.setItem('accessToken', data.access)
      if (data.refresh) localStorage.setItem('refreshToken', data.refresh)
      setAccessHeader(data.access)
      const me = await authApi.getMe().then(r => r.data)
      localStorage.setItem('user', JSON.stringify(me))
      window.dispatchEvent(new Event('auth:updated'))
      nav(sp.get('next') || '/')
    } catch (err: any) {
      const msg = err?.response?.data
      let errorMsg = '✗ Login failed'
      if (typeof msg === 'object') {
        const first = Object.values(msg)[0]
        errorMsg = '✗ ' + (Array.isArray(first) ? first[0] : String(first))
      } else {
        errorMsg = '✗ Username, password or verification code is incorrect, please try again'
      }
      setErrorMessage(errorMsg)
      loadCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">🐾</div>
          <h1>Sign In</h1>
          <p>Welcome back, start your companion journey</p>
        </div>

        {errorMessage && <div className={`error-message ${errorMessage ? 'show' : ''}`}>{errorMessage}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username or email"
              autoFocus
              disabled={loading}
            />
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
          </div>

          <div className="captcha-group">
            <div className="captcha-input">
              <label htmlFor="captcha">Verification Code</label>
              <input
                id="captcha"
                value={captcha}
                onChange={e => setCaptcha(e.target.value.slice(0, 4))}
                placeholder=""
                maxLength={4}
                disabled={loading || loadingCaptcha}
              />
            </div>
            <div className="captcha-image" onClick={loadCaptcha} title="Click to refresh verification code">
              {img ? (
                <img src={img} alt="verification code" />
              ) : (
                <div style={{ color: '#999', fontSize: '12px' }}>Loading...</div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || loadingCaptcha}
              className="primary"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="login-footer">
          <Link to="/auth/register">Create new account</Link>
          <span style={{ color: '#ddd' }}>•</span>
          <Link to="/auth/forget">Forgot password?</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
