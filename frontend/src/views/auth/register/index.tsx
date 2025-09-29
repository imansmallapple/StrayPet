import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'

function Register() {
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const username = String(f.get('username') || '')
    const email = String(f.get('email') || '')
    const password = String(f.get('password') || '')
    const confirm  = String(f.get('confirm')  || '')
    if (!username || !email || !password) return alert('请完善表单')
    if (password !== confirm) return alert('两次密码不一致')

    setLoading(true)
    try {
      await authApi.register({ username, email, password })
      alert('注册成功，如需邮件激活请前往邮箱')
      nav('/auth/login')
    } catch {
      alert('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-panel" style={{maxWidth:520,margin:'40px auto',padding:16}}>
      <h2>注册</h2>
      <form onSubmit={onSubmit}>
        <input name="username" placeholder="用户名" style={{display:'block',width:'100%',margin:'8px 0'}}/>
        <input name="email" type="email" placeholder="邮箱" style={{display:'block',width:'100%',margin:'8px 0'}}/>
        <input name="password" type="password" placeholder="密码（≥8位）" style={{display:'block',width:'100%',margin:'8px 0'}}/>
        <input name="confirm"  type="password" placeholder="确认密码" style={{display:'block',width:'100%',margin:'8px 0'}}/>
        <button type="submit" disabled={loading} style={{marginTop:8}}>
          {loading ? '提交中…' : '创建账号'}
        </button>
      </form>
      <div style={{marginTop:12}}>
        <Link to="/auth/login">已有账号？去登录</Link>
      </div>
    </div>
  )
}

export default Register