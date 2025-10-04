// src/components/sign-in-widget/index.tsx
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import './index.scss'

export default function SignInWidget() {
  const { user, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open])

  if (loading) {
    return <button type="button" className="siw-btn siw-skeleton" aria-busy="true" />
  }

  if (!user) {
    return (
      <button type="button" className="siw-btn siw-primary" onClick={() => nav('/auth/login')} aria-label="Sign in">
        <span className="siw-avatar">👤</span>
        <span className="siw-username">SIGN IN</span>
      </button>
    )
  }

  // 显示名（优先 username → name → email 前缀）
  const displayName =
    (user as any).username?.trim() ||
    (user as any).name?.trim() ||
    ((user as any).email ? String((user as any).email).split('@')[0] : '') ||
    'Me'

  return (
    <div className="siw" ref={ref}>
      <button
        type="button"
        className="siw-btn"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={displayName}
      >
        <span className="siw-avatar">👤</span>
        <span className="siw-username">{displayName}</span>
      </button>

      {open && (
        <div className="siw-menu" role="menu">
          <button type="button" className="siw-item" onClick={() => { setOpen(false); nav('/profile') }}>
            Profile
          </button>
          <button type="button" className="siw-item danger" onClick={() => { logout(); setOpen(false) }}>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
