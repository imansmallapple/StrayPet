import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'

function Reset() {
  const [sp] = useSearchParams()
  const nav = useNavigate()

  // 直接从 URL 读，不进 state
  const uid   = sp.get('uid')   ?? ''
  const token = sp.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!uid || !token) return alert('链接参数缺失或已过期')
    if (!password || password.length < 8) return alert('新密码至少 8 位')
    if (password !== confirm) return alert('两次输入不一致')

    setLoading(true)
    try {
      await authApi.confirmReset({ uid, token, new_password: password, re_new_password: confirm })
      alert('密码已重置，请用新密码登录')
      nav('/auth/login')
    } catch {
      alert('重置失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth:520, margin:'40px auto', padding:16}}>
      <h2>重置密码</h2>
      <form onSubmit={onSubmit}>
        <input type="password" placeholder="新密码（≥8位）"
               value={password} onChange={(e) => setPassword(e.target.value)}
               style={{display:'block', width:'100%', margin:'8px 0', padding:'8px'}} />
        <input type="password" placeholder="确认新密码"
               value={confirm} onChange={(e) => setConfirm(e.target.value)}
               style={{display:'block', width:'100%', margin:'8px 0', padding:'8px'}} />
        <button type="submit" disabled={loading} style={{marginTop:8}}>
          {loading ? '提交中…' : '确认重置'}
        </button>
      </form>
      <div style={{marginTop:12}}>
        <Link to="/auth/login">返回登录</Link>
      </div>
    </div>
  )
}

export default Reset