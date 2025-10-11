// ✅ 用服务层里导出的类型，而不是自己再定义一个
import  { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { useEffect, useState } from 'react'

export default function Profile() {
  const [me, setMe] = useState<ApiUserMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data } = await authApi.getProfile()   // data: ApiUserMe
        if (!alive) return
        setMe(data)                              // ✅ 不再报错
      } catch (e: any) {
        setError(e?.response?.data?.detail || '加载用户信息失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  if (loading) return <div style={{ padding: 24 }}>加载中…</div>
  if (error)   return <div style={{ padding: 24, color: '#b00020' }}>{error}</div>
  if (!me)     return null

  return (
    <div style={{ maxWidth: 640, margin: '24px auto', padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>我的资料</h2>
      <Row label="用户名" value={me.username} />
      <Row label="姓 (Last name)"  value={me.last_name ?? '—'} />
      <Row label="名 (First name)" value={me.first_name ?? '—'} />
      <Row label="邮箱" value={me.email ?? '—'} />
      <Row label="电话" value={me.phone ?? '—'} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:'flex', padding:'10px 0', borderTop:'1px solid #f1f5f9' }}>
      <label style={{ width:150, color:'#64748b' }}>{label}</label>
      <span style={{ flex:1 }}>{value}</span>
    </div>
  )
}
