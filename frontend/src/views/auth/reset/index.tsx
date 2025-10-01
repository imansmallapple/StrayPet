import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'

export default function Reset() {
  const [sp] = useSearchParams()
  const nav = useNavigate()

  // ✅ 一次性从 URL 初始化，不再用 useEffect 里 setState
  const [email, setEmail] = useState(() => sp.get('email') || '')
  const [code, setCode] = useState('')
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !code || !pwd1 || !pwd2) return alert('请完整填写')
    setLoading(true)
    try {
      await authApi.confirmReset({ email, code, new_password: pwd1, re_new_password: pwd2 })
      alert('重置成功，请用新密码登录')
      nav('/auth/login')
    } catch (err: any) {
      const msg = err?.response?.data
      alert(typeof msg === 'object' ? (Object.values(msg)[0] as string) : '重置失败，请检查验证码或密码强度')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    if (!email) return alert('请先填写邮箱')
    try {
      await authApi.requestReset({ email })
      alert('验证码已发送（5 分钟内有效）')
    } catch {
      alert('发送失败，请稍后重试')
    }
  }

  return (
    <div className="auth-panel" style={{maxWidth:420,margin:'40px auto',padding:16}}>
      <h2>重置密码</h2>
      <form onSubmit={onSubmit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱"
               style={{display:'block',width:'100%',margin:'8px 0'}} />
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="邮箱验证码（4位）" maxLength={4} style={{flex:1}} />
          <button type="button" onClick={resend}>发送/重发</button>
        </div>
        <input type="password" value={pwd1} onChange={e=>setPwd1(e.target.value)} placeholder="新密码（≥8位）"
               style={{display:'block',width:'100%',margin:'8px 0'}} />
        <input type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} placeholder="确认新密码"
               style={{display:'block',width:'100%',margin:'8px 0'}} />
        <button type="submit" disabled={loading} style={{marginTop:8}}>
          {loading ? '提交中…' : '提交重置'}
        </button>
      </form>

      <div style={{marginTop:12,display:'flex',gap:12}}>
        <Link to="/auth/login">返回登录</Link>
        <Link to="/auth/forgot">忘记密码</Link>
      </div>
    </div>
  )
}
