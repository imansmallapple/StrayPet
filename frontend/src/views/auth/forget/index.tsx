// src/views/auth/forgot/index.tsx
import { useState } from 'react'
import { authApi } from '@/services/modules/auth'

export default function Forget() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [sent, setSent] = useState(false)

  async function sendCode() {
    if (!email) return alert('请输入邮箱')
    setLoading(true)
    try {
      await authApi.requestReset({ email })
      setSent(true)
      alert('验证码已发送到邮箱（有效5分钟）')
    } catch (e:any) {
      alert(e?.response?.data?.msg || '发送失败')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !code || !pwd1 || !pwd2) return alert('请完整填写')
    setLoading(true)
    try {
      await authApi.confirmReset({ email, code, new_password: pwd1, re_new_password: pwd2 })
      alert('重置成功，请用新密码登录')
    } catch (e:any) {
      const msg = e?.response?.data
      alert(typeof msg === 'object' ? Object.values(msg)[0] as string : '重置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-panel" style={{maxWidth:420,margin:'40px auto',padding:16}}>
      <h2>忘记密码</h2>
      <form onSubmit={onSubmit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱"
               style={{display:'block',width:'100%',margin:'8px 0'}} />
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="邮箱验证码（4位）" maxLength={4}
                 style={{flex:1}} />
          <button type="button" onClick={sendCode} disabled={loading}>
            {sent ? '重新发送' : '发送验证码'}
          </button>
        </div>
        <input type="password" value={pwd1} onChange={e=>setPwd1(e.target.value)} placeholder="新密码（≥8位）"
               style={{display:'block',width:'100%',margin:'8px 0'}} />
        <input type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} placeholder="确认新密码"
               style={{display:'block',width:'100%',margin:'8px 0'}} />
        <button type="submit" disabled={loading} style={{marginTop:8}}>
          {loading ? '提交中…' : '提交重置'}
        </button>
      </form>
    </div>
  )
}
