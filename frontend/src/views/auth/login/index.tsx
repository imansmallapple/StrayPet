import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'

function Login() {
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const [sp] = useSearchParams()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const username = String(f.get('username') || '')
    const password = String(f.get('password') || '')
    if (!username || !password) return alert('请输入用户名和密码')

    setLoading(true)
    try {
      const { data } = await authApi.login({ username, password })
      localStorage.setItem('accessToken', data.access)
      if (data.refresh) localStorage.setItem('refreshToken', data.refresh)
      nav(sp.get('next') || '/')
    } catch {
      alert('登录失败，请检查用户名或密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-panel" style={{maxWidth:420,margin:'40px auto',padding:16}}>
      <h2>登录</h2>
      <form onSubmit={onSubmit}>
        <input name="username" placeholder="用户名或邮箱" autoFocus style={{display:'block',width:'100%',margin:'8px 0'}}/>
        <input name="password" type="password" placeholder="密码" style={{display:'block',width:'100%',margin:'8px 0'}}/>
        <button type="submit" disabled={loading} style={{marginTop:8}}>
          {loading ? '登录中…' : '登录'}
        </button>
      </form>
      <div style={{marginTop:12,display:'flex',gap:12}}>
        <Link to="/auth/register">去注册</Link>
        <Link to="/auth/forgot">忘记密码</Link>
      </div>
    </div>
  )
}

export default Login