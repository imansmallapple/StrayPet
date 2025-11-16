// src/views/adoption/adopt/index.tsx
import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { adoptApi, type Pet, type Paginated } from '@/services/modules/adopt'
import PageHeroTitle from '@/components/page-hero-title'   // ★ 新增
import './index.scss'

export default function Adopt() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || 1)
  const pageSize = Number(sp.get('page_size') || 12)
  const species = sp.get('species') || ''

  const params = useMemo(
    () => ({ page, page_size: pageSize, ...(species ? { species } : {}) }),
    [page, pageSize, species],
  )

  const { data, loading } = useRequest(
    () => adoptApi.list(params).then(res => res.data as Paginated<Pet>),
    { refreshDeps: [params] }
  )

  function goPage(n: number) {
    sp.set('page', String(n))
    setSp(sp, { replace: true })
  }

  const list = data?.results ?? []

  return (
    <div>
      <PageHeroTitle
        title="Pet Detail"
        subtitle="Adopt right now!"
      />

      <div className="adopt-page">
        {/* 下面就是你原来的内容，可以把 h2 去掉避免重复 */}
        <div className="adopt-header">
          <h2>Find your new friend</h2>
          <div className="filters">
            <select
              value={species}
              onChange={(e) => {
                const v = e.target.value
                v ? sp.set('species', v) : sp.delete('species')
                sp.set('page', '1')
                setSp(sp)
              }}
            >
              <option value="">All species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
            </select>
          </div>
        </div>

        {loading && <div className="hint">Loading…</div>}

        {!loading && (
          <>
            <div className="grid">
              {list.map(pet => (
                <article key={pet.id} className="card">
                  <div className="thumb">
                    <img src={pet.photo || '/images/pet-placeholder.jpg'} alt={pet.name} />
                  </div>
                  <div className="meta">
                    <h3>{pet.name}</h3>
                    <p className="muted">
                      {pet.species || 'Pet'} • {pet.sex || 'Unknown'}{' '}
                      {pet.age_years ? `• ${pet.age_months}y` : ''}
                      {pet.city ? ` • ${pet.city}` : ''}
                    </p>
                    <p className="desc">{pet.description || '—'}</p>
                    <div className="actions">
                      <Link to={`/adopt/${pet.id}`}>Details</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {data && data.count > pageSize && (
              <div className="pager">
                <button type="button" disabled={page <= 1} onClick={() => goPage(page - 1)}>Prev</button>
                <span>{page}</span>
                <button
                  type="button"
                  disabled={list.length < pageSize}
                  onClick={() => goPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
