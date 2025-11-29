// src/hooks/useAuth.tsx  —— React 19 风格：use(Context) + <Context> Provider
import React, { createContext, use, useEffect, useMemo, useState, useCallback } from 'react'
import { authApi, setAccessHeader } from '@/services/modules/auth'

type User = {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
}

type Ctx = {
  user: User | null
  loading: boolean
  logout: () => void
  reloadMe: () => Promise<void>
}

/**
 * React 19 推荐：Context 命名以 Context 结尾
 * 初始值用 undefined，并在消费时做兜底检查
 */
const AuthContext = createContext<Ctx | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // lazy 初始化，避免在 useEffect 里直接 setState
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch (err) {
      console.warn('[useAuth] parse user failed:', err)
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  const reloadMe = useCallback(async () => {
    const { data } = await authApi.getMe()
    setUser(data)
    localStorage.setItem('user', JSON.stringify(data))
  }, [])

  // 启动：挂 Authorization；若有 token 且本地无 user，则拉 /user/me/
  useEffect(() => {
    const access = localStorage.getItem('accessToken') || undefined
    setAccessHeader(access)

    const needFetch = !!access && !user
    ;(async () => {
      try {
        if (needFetch) await reloadMe()
      } catch (err) {
        console.warn('[useAuth] fetch /user/me failed:', err)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        setAccessHeader(undefined)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
    // 不把 user 放依赖，避免重复请求；reloadMe 已 useCallback 固定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadMe])

  // 登录/退出后，监听全局事件刷新 user
  useEffect(() => {
    const onAuthUpdated = () => {
      const raw = localStorage.getItem('user')
      try {
        setUser(raw ? (JSON.parse(raw) as User) : null)
      } catch (err) {
        console.warn('[useAuth] parse user on event failed:', err)
        setUser(null)
      }
    }
    window.addEventListener('auth:updated', onAuthUpdated)
    return () => window.removeEventListener('auth:updated', onAuthUpdated)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setAccessHeader(undefined)
    setUser(null)
    window.dispatchEvent(new Event('auth:updated'))
  }, [])

  const value = useMemo<Ctx>(() => ({ user, loading, logout, reloadMe }), [user, loading, logout, reloadMe])

  // 使用 Provider 语法以兼容不同 React 版本的类型与运行时实现
  return <AuthContext value={value}>{children}</AuthContext>
}

/**
 * React 19 推荐：用 use(Context) 代替 useContext(Context)
 * 这样也消除了 `@eslint-react/no-use-context` 报警
 */
export const useAuth = (): Ctx => {
  // TS 类型库若未更新到 React 19，可用 any 暂时规避：
  // const ctx = (React as any).use(AuthContext) as Ctx | undefined
  const ctx = use(AuthContext) as Ctx | undefined
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return ctx
}
