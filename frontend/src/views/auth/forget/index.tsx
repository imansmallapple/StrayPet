// src/views/auth/forgot/index.tsx
import { useMemo, useState } from 'react'
import { authApi } from '@/services/modules/auth'

export default function Forgot() {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [countdown, setCountdown] = useState(0) // ← 与注册页一致

  const canSend = useMemo(
    () => !sending && countdown === 0 && /\S+@\S+\.\S+/.test(email),
    [sending, countdown, email]
  )

  function startCountdown(seconds: number) {
    setCountdown(seconds)
    const timer = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          clearInterval(timer)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  async function onSendCode(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!canSend) return
    try {
      setSending(true)
      await authApi.requestReset({ email })
      alert('验证码已发送到邮箱（5分钟内有效）')
      startCountdown(60) // ← 60s 冷却，与注册页一致
    } catch (err: any) {
      // 若后端做了限流，返回 429 和 retry_after 秒数
      const retry = err?.response?.data?.retry_after
      if (typeof retry === 'number' && retry > 0) startCountdown(retry)
      const msg = err?.response?.data?.msg || '发送失败'
      alert(msg)
    } finally {
      setSending(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !code || !pwd1 || !pwd2) return alert('请完整填写')
    setLoading(true)
    try {
      await authApi.confirmReset({
        email,
        code,
        new_password: pwd1,
        re_new_password: pwd2
      })
      alert('重置成功，请用新密码登录')
    } catch (e: any) {
      const d = e?.response?.data
      const msg =
        d?.email?.[0] ||
        d?.code?.[0] ||
        d?.new_password?.[0] ||
        d?.re_new_password?.[0] ||
        d?.detail ||
        (typeof d === 'string' ? d : '') ||
        '重置失败'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-panel" style={{maxWidth:420,margin:'40px auto',padding:16}}>
      <h2>忘记密码</h2>
      <form onSubmit={onSubmit}>
        <input
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="邮箱"
          style={{display:'block',width:'100%',margin:'8px 0',padding:'8px'}}
        />
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input
            value={code}
            onChange={(e)=>setCode(e.target.value)}
            placeholder="邮箱验证码（4位）"
            maxLength={4}
            style={{flex:1,margin:'8px 0',padding:'8px'}}
          />
          <button
            type="button"                   // ✅ 跟注册页一致
            onClick={onSendCode}
            disabled={!canSend}
            style={{ whiteSpace:'nowrap' }}
          >
            {countdown>0 ? `重新发送(${countdown}s)` : (sending ? '发送中…' : '发送验证码')}
          </button>
        </div>

        <input
          type="password"
          value={pwd1}
          onChange={(e)=>setPwd1(e.target.value)}
          placeholder="新密码（≥8位）"
          style={{display:'block',width:'100%',margin:'8px 0',padding:'8px'}}
        />
        <input
          type="password"
          value={pwd2}
          onChange={(e)=>setPwd2(e.target.value)}
          placeholder="确认新密码"
          style={{display:'block',width:'100%',margin:'8px 0',padding:'8px'}}
        />

        <button type="submit" disabled={loading} style={{marginTop:8}}>
          {loading ? '提交中…' : '提交重置'}
        </button>
      </form>
    </div>
  )
}
