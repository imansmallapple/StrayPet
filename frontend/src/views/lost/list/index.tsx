// src/views/lost/list/index.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { lostApi, type LostPet, type PageResp } from '@/services/modules/lost'

export default function LostList() {
  const [sp, setSp] = useSearchParams()
  const [data, setData] = useState<PageResp<LostPet> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const page = Number(sp.get('page') || 1)
  const pageSize = Number(sp.get('page_size') || 12)
  const ordering = sp.get('ordering') || '-pub_date'
  const search = sp.get('q') || ''

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await lostApi.list({ page, page_size: pageSize, ordering, search })
        if (!alive) return
        setData(data)
      } catch (e: any) {
        setError(e?.response?.data?.detail || '加载走失列表失败')
      } finally {
        setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [page, pageSize, ordering, search])

  const totalPages = useMemo(() => {
    if (!data) return 1
    return Math.max(1, Math.ceil(data.count / pageSize))
  }, [data, pageSize])

  const goto = (nextPage: number) => {
    const params = new URLSearchParams(sp)
    params.set('page', String(nextPage))
    params.set('page_size', String(pageSize))
    params.set('ordering', ordering)
    if (search) params.set('q', search); else params.delete('q')
    setSp(params, { replace: true })
  }

  return (
    <div style={{ maxWidth: 1024, margin: '24px auto', padding: 16 }}>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h2>走失信息</h2>
        <div style={{ display:'flex', gap: 8 }}>
          <input
            placeholder="搜索关键字…"
            defaultValue={search}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim()
                const p = new URLSearchParams(sp)
                if (v) p.set('q', v); else p.delete('q')
                p.set('page', '1')
                setSp(p, { replace: true })
              }
            }}
          />
          <Link to="/lost/report" className="btn">上报走失</Link>
        </div>
      </header>

      {loading && <div>加载中…</div>}
      {!!error && <div style={{ color:'#b00020' }}>{error}</div>}

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16
      }}>
        {data?.results.map(item => (
          <Link to={`/lost/${item.id}`} key={item.id} className="card" style={{ textDecoration:'none', color:'inherit', border:'1px solid #eee', borderRadius:12, overflow:'hidden' }}>
            <div style={{ aspectRatio:'4/3', background:'#f6f7fb' }}>
              {item.cover ? (
                <img src={item.cover} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              ) : (
                <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', color:'#999' }}>No Image</div>
              )}
            </div>
            <div style={{ padding:12 }}>
              <div style={{ fontWeight:600 }}>{item.name}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>
                {item.species || '-'} · {item.breed || '-'}
              </div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>
                {(item.address && typeof item.address === 'string'
                  ? item.address
                  : (item.address as any)?.full) || '—'}
              </div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>
                {item.pub_date ? new Date(item.pub_date).toLocaleString() : ''}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {data && (
        <footer style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center', marginTop:16 }}>
          <button type="button" disabled={page <= 1} onClick={() => goto(page - 1)}>上一页</button>
          <span style={{ color:'#64748b' }}>{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => goto(page + 1)}>下一页</button>
        </footer>
      )}
    </div>
  )
}
