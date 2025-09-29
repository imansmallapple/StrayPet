import { useState } from 'react'
import { authApi } from '@/services/modules/auth'

function Forget() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email) return alert('请输入邮箱')
    setLoading(true)
    try {
      await authApi.requestReset({ email })
      alert('如果该邮箱已注册，我们会发送重置邮件。请查收邮箱。')
    } catch {
      alert('发送失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth:460, margin:'40px auto', padding:16}}>
      <h2>忘记密码</h2>
      <p style={{opacity:.8, marginBottom:12}}>输入你的注册邮箱，我们将发送重置密码的链接。</p>
      <form onSubmit={onSubmit}>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{display:'block', width:'100%', margin:'8px 0', padding:'8px'}}
        />
        <button type="submit" disabled={loading} style={{marginTop:8}}>
          {loading ? '发送中…' : '发送重置邮件'}
        </button>
      </form>
    </div>
  )
}

export default Forget