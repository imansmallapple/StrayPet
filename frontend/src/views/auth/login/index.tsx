import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi, setAccessHeader } from '@/services/modules/auth'
import './index.scss'

function Login() {
  const [loading, setLoading] = useState(false)
  const [img, setImg] = useState<string>('')
  const [uid, setUid] = useState<string>('')
  const [captcha, setCaptcha] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)

  const nav = useNavigate()
  const [sp] = useSearchParams()

  async function loadCaptcha() {
    try {
      setLoadingCaptcha(true)
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

  // 监控错误消息变化（调试用）
  useEffect(() => {
    if (errorMessage) {
      console.warn('[ErrorMessage Changed]', errorMessage)
    }
  }, [errorMessage])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const username = String(f.get('username') || '')
    const password = String(f.get('password') || '')

    // 清除之前的错误信息
    setErrorMessage('')

    // 验证必填字段
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
      // 提取错误消息
      const msg = err?.response?.data
      const status = err?.response?.status
      
      console.warn('[Login Error]', { status, data: msg })
      
      let errorMsg = '✗ Login failed'
      
      // 处理不同的错误格式
      if (msg && typeof msg === 'object') {
        const firstKey = Object.keys(msg)[0]
        if (firstKey) {
          const error = msg[firstKey]
          if (Array.isArray(error) && error.length > 0) {
            errorMsg = '✗ ' + error[0]
          } else if (typeof error === 'string') {
            errorMsg = '✗ ' + error
          }
        }
      } else if (msg && typeof msg === 'string') {
        errorMsg = '✗ ' + msg
      }
      
      // 根据状态码调整错误消息
      if (errorMsg === '✗ Login failed') {
        if (status === 400) {
          errorMsg = '✗ Invalid username, password or verification code'
        } else if (status === 401) {
          errorMsg = '✗ Username, password or verification code is incorrect'
        }
      }
      
      // 显示错误信息
      setErrorMessage(errorMsg)
      
      // 刷新验证码
      setCaptcha('')
      // 延迟加载验证码，给用户时间看错误消息
      setTimeout(() => {
        loadCaptcha()
      }, 1500)
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

        {errorMessage && <div className="error-message">{errorMessage}</div>}

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
