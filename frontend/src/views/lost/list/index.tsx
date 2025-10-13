// src/views/lost/list/index.tsx
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { lostApi, type LostPet, type PageResp } from '@/services/modules/lost'

export default function LostList() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || 1)
  const pageSize = Number(sp.get('page_size') || 12)
  const ordering = sp.get('ordering') || '-created_at'

  const [data, setData] = useState<PageResp<LostPet> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await lostApi.list({ page, page_size: pageSize, ordering })
        if (!alive) return
        setData(data)
      } catch (e: any) {
        setError(e?.response?.data?.detail || '加载走失列表失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [page, pageSize, ordering])

  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1
  const goto = (p: number) => setSp({ page: String(p), page_size: String(pageSize), ordering })

  if (loading) return <div style={{ padding: 24 }}>加载中…</div>
  if (error)   return <div style={{ padding: 24, color: '#b00020' }}>{error}</div>
  if (!data)   return null

  return (
    <div style={{ maxWidth: 1080, margin: '24px auto', padding: 16 }}>
      <h2>走失列表</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 12 }}>
        {data.results.map(item => {
          const imgSrc = item.photo_url ?? item.photo ?? undefined
          const title = item.pet_name || `${item.species}${item.breed ? ' · ' + item.breed : ''}`
          const created = item.created_at ? new Date(item.created_at).toLocaleString() : ''
          return (
            <Link key={item.id} to={`/lost/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '4/3', background: '#f6f7fb' }}>
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#999' }}>
                      No Image
                    </div>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600 }}>{title || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {item.species || '-'}{item.breed ? ` · ${item.breed}` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    {created}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {data && (
        <footer style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
          <button type="button" disabled={page <= 1} onClick={() => goto(page - 1)}>上一页</button>
          <span style={{ color: '#64748b' }}>{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => goto(page + 1)}>下一页</button>
        </footer>
      )}
    </div>
  )
}
