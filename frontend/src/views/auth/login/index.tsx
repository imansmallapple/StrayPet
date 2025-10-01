import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'

function Login() {
  const [loading, setLoading] = useState(false)
  const [img, setImg] = useState<string>('')   // 验证码图片 dataURL
  const [uid, setUid] = useState<string>('')   // 本轮验证码 uid
  const [captcha, setCaptcha] = useState<string>('') // 用户输入的4位码

  const nav = useNavigate()
  const [sp] = useSearchParams()

  async function loadCaptcha() {
    try {
      const { data } = await authApi.getCaptcha()
      setImg(data.image)
      setUid(data.uid)
      setCaptcha('')
    } catch {
      alert('获取验证码失败，请稍后重试')
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

    if (!username || !password) return alert('请输入用户名和密码')
    if (!captcha || captcha.length !== 4) return alert('请输入4位验证码')

    setLoading(true)
    try {
      const { data } = await authApi.login({ username, password, captcha, uid })
      localStorage.setItem('accessToken', data.access)
      if (data.refresh) localStorage.setItem('refreshToken', data.refresh)
      nav(sp.get('next') || '/')
    } catch (err: any) {
      // 尝试从后端错误中给出更友好的提示
      const msg = err?.response?.data
      if (typeof msg === 'object') {
        // 可能是 {non_field_errors: [...]} 或 {"Verification code expired!": ...}
        const first = Object.values(msg)[0]
        alert(Array.isArray(first) ? first[0] : String(first))
      } else {
        alert('登录失败，请检查用户名、密码或验证码')
      }
      // 失败后通常需要刷新验证码，避免复用已删除的缓存
      loadCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-panel" style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h2>登录</h2>
      <form onSubmit={onSubmit}>
        <input name="username" placeholder="用户名或邮箱" autoFocus
               style={{ display: 'block', width: '100%', margin: '8px 0' }} />
        <input name="password" type="password" placeholder="密码"
               style={{ display: 'block', width: '100%', margin: '8px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <input
            value={captcha}
            onChange={e => setCaptcha(e.target.value)}
            placeholder="验证码（4位）"
            maxLength={4}
            style={{ flex: 1 }}
          />
          <img
            src={img}
            alt="captcha"
            style={{ height: 40, cursor: 'pointer', border: '1px solid #ddd' }}
            onClick={loadCaptcha}
            title="点击刷新验证码"
          />
          <button type="button" onClick={loadCaptcha}>刷新</button>
        </div>

        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? '登录中…' : '登录'}
        </button>
      </form>

      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <Link to="/auth/register">去注册</Link>
        <Link to="/auth/forgot">忘记密码</Link>
      </div>
    </div>
  )
}

export default Login
