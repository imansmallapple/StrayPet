// src/views/lost/detail/index.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { lostApi, type LostPet } from '@/services/modules/lost'

export default function LostDetail() {
  const { id } = useParams()
  const [item, setItem] = useState<LostPet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await lostApi.retrieve(Number(id))
        if (!alive) return
        setItem(data)
      } catch (e: any) {
        setError(e?.response?.data?.detail || '加载走失详情失败')
      } finally {
        setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [id])

  if (loading) return <div style={{ padding:24 }}>加载中…</div>
  if (error)   return <div style={{ padding:24, color:'#b00020' }}>{error}</div>
  if (!item)   return null

  const fullAddress =
    typeof item.address === 'string'
      ? item.address
      : (item.address as any)?.full || '—'

  return (
    <div style={{ maxWidth: 960, margin:'24px auto', padding: 16 }}>
      <Link to="/lost">← 返回列表</Link>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginTop:16 }}>
        <div style={{ aspectRatio:'4/3', background:'#f6f7fb', borderRadius:12, overflow:'hidden' }}>
          {item.cover ? (
            <img src={item.cover} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          ) : (
            <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', color:'#999' }}>No Image</div>
          )}
        </div>

        <div>
          <h2 style={{ marginBottom:8 }}>{item.name}</h2>
          <div style={{ color:'#64748b' }}>{item.species || '-'} · {item.breed || '-'}</div>

          <div style={{ marginTop:12 }}>
            <Row label="颜色" value={item.color || '—'} />
            <Row label="性别" value={item.sex === 'M' ? '公' : item.sex === 'F' ? '母' : '未知'} />
            <Row label="月龄" value={item.age_months != null ? String(item.age_months) : '—'} />
            <Row label="位置" value={fullAddress} />
            <Row label="发布时间" value={item.pub_date ? new Date(item.pub_date).toLocaleString() : '—'} />
          </div>

          <div style={{ marginTop:12, whiteSpace:'pre-wrap', lineHeight:1.6 }}>
            {item.description || '无详细描述'}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:'flex', padding:'6px 0', borderTop:'1px solid #f1f5f9' }}>
      <label style={{ width:120, color:'#64748b' }}>{label}</label>
      <span>{value}</span>
    </div>
  )
}
