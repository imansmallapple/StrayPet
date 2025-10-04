import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useRequest } from 'ahooks'
import axios from 'axios'
import { adoptApi, type Pet, type Paginated } from '@/services/modules/adopt'
import placeholder from '/images/pet-placeholder.jpg'
import './index.scss'

const API_ORIGIN = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'
const toAbs = (url?: string | null) => {
  if (!url) return placeholder
  if (/^https?:\/\//i.test(url)) return url
  try { return new URL(url, API_ORIGIN).toString() } catch { return placeholder }
}
const clean = <T extends Record<string, any>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')) as Partial<T>

function mapAgeBucket(bucket: string) {
  // 可按你后端的 PetFilter 调整
  switch (bucket) {
    case 'baby':   return { age_min: 0,  age_max: 6 }
    case 'young':  return { age_min: 6,  age_max: 12 }
    case 'adult':  return { age_min: 12, age_max: 84 }
    case 'senior': return { age_min: 84 }
    default:       return {}
  }
}

export default function AdoptionIndex() {
  const [sp, setSp] = useSearchParams()

  // URL 状态
  const page = Number(sp.get('page') || 1)
  const pageSize = Number(sp.get('page_size') || 12)
  const species = sp.get('species') || ''
  const breed   = sp.get('breed') || ''
  const age     = sp.get('age') || ''           // baby/young/adult/senior
  const size    = sp.get('size') || ''          // small/medium/large…
  const gender  = sp.get('gender') || ''        // male/female
  const city    = sp.get('city') || ''

  // 组装查询参数（exactOptionalPropertyTypes 下不要传 undefined）
const params = useMemo(() => clean({
  page,
  page_size: pageSize,
  species,
  breed,
  city,
  sex: gender || undefined,   // ✅ 关键：传 sex=male/female（有值才传）
  ...mapAgeBucket(age),
  ordering: '-pub_date',
}), [page, pageSize, species, breed, gender, age, city])

    const { data, loading, error } = useRequest<Paginated<Pet>, []>(
    () => adoptApi.list(params).then(r => r.data),
    { refreshDeps: [params] }
    )

  // 收藏（本地）示例
  const [fav, setFav] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('fav_pets') || '{}') } catch { return {} }
  })
  const toggleFav = (id: number) => {
    const next = { ...fav, [id]: !fav[id] }
    setFav(next)
    localStorage.setItem('fav_pets', JSON.stringify(next))
  }

  const results = data?.results ?? []
  const count   = data?.count ?? 0

  const set = (key: string, val: string) => {
    if (val) sp.set(key, val); else sp.delete(key)
    sp.set('page', '1')
    setSp(sp)
  }
  const goPage = (n: number) => { sp.set('page', String(n)); setSp(sp, { replace: true }) }
  const resetFilters = () => {
    ['species','breed','age','size','gender','city','page'].forEach(k => sp.delete(k))
    setSp(sp, { replace: true })
  }

  const skeletonKeys = useMemo(
  () =>
    Array.from({ length: 8 }, () =>
      (crypto as any).randomUUID?.() ?? Math.random().toString(36).slice(2)
    ),
  []
  )

  if (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    return <div className="adopt-layout"><p className="hint">加载失败（{status ?? 'unknown'}），稍后再试。</p></div>
  }

  return (
    <div className="adopt-layout">
      {/* 侧栏筛选 */}
      <aside className="filters">
        <div className="card">
          <h3>Match</h3>
          <p>It only takes 60 seconds!</p>
          <button type="button" className="primary" onClick={() => alert('TODO: match 流程')}>GET STARTED</button>
        </div>

        <div className="group">
          <label>BREED</label>
          <select value={breed} onChange={(e) => set('breed', e.target.value)}>
            <option value="">Any</option>
            <option value="shorthair">Shorthair</option>
            <option value="persian">Persian</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className="group">
          <label>AGE</label>
          <select value={age} onChange={(e) => set('age', e.target.value)}>
            <option value="">Any</option>
            <option value="baby">Baby (0–6m)</option>
            <option value="young">Young (6–12m)</option>
            <option value="adult">Adult (1–7y)</option>
            <option value="senior">Senior (7y+)</option>
          </select>
        </div>

        <div className="group">
          <label>SIZE</label>
          <select value={size} onChange={(e) => set('size', e.target.value)}>
            <option value="">Any</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div className="group">
          <label>GENDER</label>
          <select value={gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="group">
          <label>CITY</label>
          <input value={city} onChange={(e) => set('city', e.target.value)} placeholder="City / Region" />
        </div>

        <button type="button" className="link" onClick={resetFilters}>Reset filters</button>
      </aside>

      {/* 右侧内容 */}
      <main className="content">
        {/* 顶部保存搜索 Banner（示例） */}
        <div className="save-banner">
          <div className="text">Save a search for “{species || 'Pets'} near {city || 'your area'}”</div>
          <button type="button" className="primary" onClick={() => alert('已保存（示例）')}>SAVE SEARCH</button>
        </div>

        <h1 className="title">{(species || 'Pets')} Available for Adoption</h1>

        {loading ? (
                <div className="skeleton-grid">
                {skeletonKeys.map(k => <div key={k} className="sk-card" />)}
                </div>
        ) : results.length === 0 ? (
          <div className="empty">没有找到符合条件的宠物</div>
        ) : (
          <>
            <div className="grid">
              {results.map(p => (
                <article key={p.id} className="pet-card">
                  <div className="thumb">
                    <img
                      src={toAbs(p.photo)}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder }}
                    />
                    <button
                      type="button"
                      className={`fav ${fav[p.id] ? 'on' : ''}`}
                      aria-label="favorite"
                      onClick={() => toggleFav(p.id)}
                    >
                      {/* 心形 SVG */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={fav[p.id] ? '#7c3aed' : 'none'} stroke="#7c3aed" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
                    </button>
                  </div>
                  <div className="body">
                    <h3 title={p.name}>{p.name}</h3>
                    <p className="muted">
                      {(p.species || 'Pet')}{p.breed ? ` • ${p.breed}` : ''}{p.sex ? ` • ${p.sex}` : ''}{p.city ? ` • ${p.city}` : ''}
                    </p>
                    <div className="actions">
                      <Link to={`/adopt/${p.id}`} className="btn">Details</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* 简单分页 */}
            {count > pageSize && (
              <div className="pager">
                <button type="button" disabled={page <= 1} onClick={() => goPage(page - 1)}>Prev</button>
                <span>{page}</span>
                <button
                  type="button"
                  disabled={results.length < pageSize}
                  onClick={() => goPage(page + 1)}
                >Next</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
