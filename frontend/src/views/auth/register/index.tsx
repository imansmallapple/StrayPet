import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'

export default function Register() {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState('')
  const [countdown, setCountdown] = useState(0) // 获取验证码倒计时
  const nav = useNavigate()

  const canSend = useMemo(() => !sending && countdown === 0 && /\S+@\S+\.\S+/.test(email), [sending, countdown, email])

  async function onSendCode(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!canSend) return
    try {
      setSending(true)
      await authApi.sendEmailCode(email)
      alert('验证码已发送到邮箱，请查收')
      // 60s 倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((s) => {
          if (s <= 1) { clearInterval(timer); return 0 }
          return s - 1
        })
      }, 1000)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.email?.[0] || '发送失败，请稍后重试'
      alert(msg)
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
    if (!username || !email || !password || !password1 || !code) return alert('请完善表单')
    if (password !== password1) return alert('两次密码不一致')

    setLoading(true)
    try {
      const { data } = await authApi.register({ username, email, password, password1, code })
      // 你的后端会返回 tokens（get_tokens）；如果带了，直接登录
      if (data?.tokens?.access) {
        localStorage.setItem('accessToken', data.tokens.access)
        if (data.tokens.refresh) localStorage.setItem('refreshToken', data.tokens.refresh)
        alert('注册成功，已为你登录')
        nav('/home')
      } else {
        alert('注册成功，请登录')
        nav('/auth/login')
      }
    } catch (err: any) {
      // 按你的后端返回信息整理常见报错
      const d = err?.response?.data || {}
      const msg =
        d?.email?.[0] ||
        d?.username?.[0] ||
        d?.password?.[0] ||
        d?.non_field_errors?.[0] ||
        d?.detail ||
        (typeof d === 'string' ? d : '') ||
        '注册失败，请检查信息或稍后再试'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth:520, margin:'40px auto', padding:16}}>
      <h2>注册</h2>
      <form onSubmit={onSubmit}>
        <input name="username" placeholder="用户名"
               style={{display:'block',width:'100%',margin:'8px 0',padding:'8px'}} />
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input name="email" type="email" placeholder="邮箱" value={email}
                 onChange={(e)=>setEmail(e.target.value)}
                 style={{flex:1,margin:'8px 0',padding:'8px'}} />
          <button
            type="button"                 // ✅ 加上这个
            onClick={onSendCode}
            disabled={!canSend}
            style={{ whiteSpace: 'nowrap' }}
          >
            {countdown>0 ? `重新发送(${countdown}s)` : (sending ? '发送中…' : '获取验证码')}
          </button>
        </div>
        <input name="code" placeholder="邮箱验证码"
               style={{display:'block',width:'100%',margin:'8px 0',padding:'8px'}} />
        <input name="password" type="password" placeholder="密码（≥8位）"
               style={{display:'block',width:'100%',margin:'8px 0',padding:'8px'}} />
        <input name="password1" type="password" placeholder="确认密码"
               style={{display:'block',width:'100%',margin:'8px 0',padding:'8px'}} />
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
