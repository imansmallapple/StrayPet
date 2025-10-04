// src/hooks/useAuth.tsx
/* eslint-disable @eslint-react/no-use-context */
/* eslint-disable @eslint-react/no-context-provider */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, type LoginBody, type LoginResp } from '@/services/modules/auth'
import { userApi, type Me } from '@/services/modules/user'

type AuthCtx = {
  user: Me | null
  loading: boolean
  login: (form: LoginBody) => Promise<void>
  logout: () => void
}
const AuthContext = createContext<AuthCtx | null>(null)

const LS_ACCESS = 'accessToken'
const LS_REFRESH = 'refreshToken'
const setTokens = (t: { access: string; refresh?: string }) => {
  localStorage.setItem(LS_ACCESS, t.access)
  if (t.refresh) localStorage.setItem(LS_REFRESH, t.refresh)
}
const clearTokens = () => {
  localStorage.removeItem(LS_ACCESS)
  localStorage.removeItem(LS_REFRESH)
}

// 仅在开发环境输出 warn（项目规则允许 warn/error）
const devWarn = (...args: any[]) => {
  if (import.meta.env.DEV) console.warn('[auth]', ...args)
}

// 解析 JWT（SimpleJWT 通常含 user_id）
function parseJwt(token?: string): any | null {
  if (!token) return null
  try {
    const b64 = token.split('.')[1]
    const json = atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

// 把各种返回结构统一成 { id, username, email }
function normalizeUser(raw: any): Me | null {
  if (!raw) return null

  // 直接是对象
  if (raw.username || raw.email || raw.name) {
    return {
      id: raw.id ?? raw.pk ?? 0,
      username: String(
        raw.username ?? raw.name ?? (raw.email ? String(raw.email).split('@')[0] : '')
      ),
      email: raw.email,
      name: raw.name,
    }
  }
  // 包裹层
  if (raw.user) return normalizeUser(raw.user)
  if (raw.data && !Array.isArray(raw.data)) return normalizeUser(raw.data)
  // 列表/分页
  if (Array.isArray(raw.results) && raw.results.length) return normalizeUser(raw.results[0])
  if (Array.isArray(raw) && raw.length) return normalizeUser(raw[0])

  return null
}

/** 只有本地有 access 才请求；依次尝试 /user/me/ → /user/<id>/ → /user（列表） */
async function fetchMe(): Promise<Me | null> {
  const access = localStorage.getItem(LS_ACCESS)
  if (!access) return null
  const claims = parseJwt(access)
  const uid = claims?.user_id

  // 1) /user/me/
  try {
    const r = await userApi.me()
    const u = normalizeUser(r.data)
    if (u) return u
  } catch (err) {
    devWarn('userApi.me() not available', err)
  }

  // 2) /user/<id>/
  if (uid != null) {
    try {
      const r = await userApi.byId(uid)
      const u = normalizeUser(r.data)
      if (u) return u
    } catch (err) {
      devWarn(`userApi.byId(${uid}) not available`, err)
    }
  }

  // 3) /user（列表）
  try {
    const r = await userApi.list()
    const data = r.data
    const arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : null
    if (arr && arr.length) {
      let picked: any = null
      if (uid != null) {
        const uidStr = String(uid)
        picked = arr.find((x: any) => String(x?.id ?? x?.pk) === uidStr) ?? null
      }
      picked ||= arr.find((x: any) => !!x?.username) ?? arr[0]
      const u = normalizeUser(picked)
      if (u) return u
    }
  } catch (err) {
    devWarn('userApi.list() failed', err)
  }

  return null
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ok = true
    ;(async () => {
      setLoading(true)
      try {
        const me = await fetchMe()
        if (ok) setUser(me)
      } finally {
        if (ok) setLoading(false)
      }
    })()
    return () => { ok = false }
  }, [])

  const login = async (form: LoginBody) => {
    const { data } = await authApi.login(form) // { access, refresh? }
    setTokens(data as LoginResp)
    setUser(await fetchMe())
  }

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
