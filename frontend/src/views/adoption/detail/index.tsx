import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRequest } from 'ahooks'
import axios from 'axios'
import { adoptApi, type Pet } from '@/services/modules/adopt'
// 如果你把占位图放在 public/images 下，改成：const placeholder = '/images/pet-placeholder.jpg'
import placeholder from '/images/pet-placeholder.jpg'
import './index.scss'

const API_ORIGIN = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'
const toAbs = (url?: string | null) => {
  if (!url) return placeholder
  if (/^https?:\/\//i.test(url)) return url
  try { return new URL(url, API_ORIGIN).toString() } catch { return placeholder }
}
const ageLabel = (y?: number, m?: number) => {
  const Y = y ?? 0, M = m ?? 0
  if (!Y && !M) return '—'
  return `${Y ? `${Y}y` : ''}${Y && M ? ' ' : ''}${M ? `${M}m` : ''}`
}

export default function PetDetail() {
  const { id: idStr } = useParams<{ id: string }>()
  const id = Number(idStr)
  const nav = useNavigate()

  // ✅ 保留 loading，用于骨架屏，同时避免未加载即取字段
  const { data: pet, loading, error, refresh } = useRequest<Pet, []>(
    () => adoptApi.detail(id).then(r => r.data),
    { ready: Number.isFinite(id) }
  )

  // ✅ 所有地方读取 pet 字段时都用 ?. 可选链
  const photos = useMemo<string[]>(() => {
    if (!pet) return [null as any]
    const any = pet as any
    const list: string[] =
      any?.photos ?? any?.gallery ??
      (any?.photo ? [any.photo] : (any?.cover ? [any.cover] : []))
    return list.length ? list : [null as any]
  }, [pet])

  const [idx, setIdx] = useState(0)
  const go = (d: number) => setIdx(i => (i + d + photos.length) % photos.length)

  const canApply = (pet?.status === 'available' || pet?.status === 'AVAILABLE')
  const [submitting, setSubmitting] = useState(false)

  async function onApply() {
    if (!pet) return
    if (!localStorage.getItem('accessToken')) {
      nav(`/auth/login?next=/adopt/${pet.id}`)
      return
    }
    setSubmitting(true)
    try {
      await adoptApi.apply(pet.id, '')
      alert('申请已提交！')
      await refresh()
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? ((e.response?.data as any)?.detail ?? '提交失败，请稍后再试')
        : (e as Error).message
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ✅ 错误兜底：不抛异常、不跳首页
  if (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    return (
      <div className="detail-layout">
        {status === 404 ? <p className="hint">未找到该宠物。</p> :
         status === 403 ? <p className="hint">该宠物未公开，无法查看。</p> :
         <p className="hint">加载失败，请稍后再试。</p>}
        <div style={{ marginTop: 8 }}><Link to="/adopt">← 返回列表</Link></div>
      </div>
    )
  }

  // ✅ 加载态与 pet 为空时的骨架屏，避免读取 undefined
  if (loading || !pet) {
    return (
      <div className="detail-layout">
        <div className="left">
          <div className="card" style={{ height: 360, background: '#f6f7f8' }} />
          <div className="card" style={{ height: 140, background: '#f6f7f8', marginTop: 12 }} />
          <div className="card" style={{ height: 220, background: '#f6f7f8', marginTop: 12 }} />
        </div>
        <aside className="right">
          <div className="card" style={{ height: 220, background: '#f6f7f8' }} />
        </aside>
      </div>
    )
  }

  // 这里开始可以安全使用 pet 的字段（上面已保证不为 undefined）
  const addrCity = (pet as any)?.address_city || (pet as any)?.address?.city?.name
  const years = (pet as any)?.age_years
  const months = (pet as any)?.age_months

  return (
    <div className="detail-layout">
      <div className="left">
        <div className="gallery card">
          <div className="stage">
            <img
              src={toAbs(photos[idx])}
              alt={pet?.name || 'pet'}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder }}
            />
            {photos.length > 1 && (
              <>
                <button type="button" className="nav prev" onClick={() => go(-1)} aria-label="prev">‹</button>
                <button type="button" className="nav next" onClick={() => go(+1)} aria-label="next">›</button>
                <div className="dots">
                  {photos.map((p, i) => (
                    <span
                      key={(typeof p === 'string' && p) ? p : `dot-${i}`}
                      className={i === idx ? 'on' : ''}
                      onClick={() => setIdx(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card header-card">
          <h1 className="pet-name">{pet?.name || '—'}</h1>
          <div className="meta-line">
            <span>{pet?.breed || 'Unknown breed'}</span>
            {addrCity && <span> • {addrCity}</span>}
          </div>
          <div className="chips">
            {pet?.species && <span className="chip">{pet.species}</span>}
            {pet?.sex && <span className="chip">{pet.sex}</span>}
            <span className="chip">{ageLabel(years, months)}</span>
            {pet?.status && <span className="chip outline">{String(pet.status)}</span>}
          </div>
        </div>

        <section className="card section">
          <h2>About</h2>
          <dl className="about-grid">
            <div><dt>Breed</dt><dd>{pet?.breed || '—'}</dd></div>
            <div><dt>Sex</dt><dd>{pet?.sex || '—'}</dd></div>
            <div><dt>Age</dt><dd>{ageLabel(years, months)}</dd></div>
            <div><dt>City</dt><dd>{addrCity || '—'}</dd></div>
            <div><dt>Status</dt><dd>{pet?.status || '—'}</dd></div>
          </dl>
        </section>

        <section className="card section">
          <h2>Meet {pet?.name}</h2>
          <p className="desc">{pet?.description || '暂无更多介绍。'}</p>
        </section>

        <div className="back-link"><Link to="/adopt">← 返回列表</Link></div>
      </div>

      <aside className="right">
        <div className="card cta">
          <h3>Considering {pet?.name} for adoption?</h3>
          <button
            type="button"
            className="primary"
            disabled={!canApply || submitting}
            onClick={onApply}
            title={canApply ? '' : '当前不可申请'}
          >
            {submitting ? '提交中…' : 'START YOUR INQUIRY'}
          </button>
          <button type="button" className="ghost" onClick={() => alert('FAQs 敬请期待')}>READ FAQs</button>
          <div className="split">
            <button type="button" className="outline" onClick={() => alert('Sponsor 敬请期待')}>SPONSOR</button>
            <button type="button" className="outline" onClick={() => alert('收藏成功（本地示例）')}>FAVORITE</button>
          </div>
          {!canApply && <p className="hint">仅 “available” 的宠物可以申请。</p>}
        </div>

        <div className="card ad">Shelters are full! [Ad]</div>

        <div className="card shelter">
          <h3>Contact</h3>
          <ul>
            <li><strong>Organization:</strong> {(pet as any)?.created_by?.username ?? 'Owner / Shelter'}</li>
            <li><strong>Location:</strong> {addrCity || '—'}</li>
            <li><strong>Email:</strong> —</li>
            <li><strong>Phone:</strong> —</li>
          </ul>
          <button type="button" className="outline">MORE ABOUT US</button>
        </div>
      </aside>
    </div>
  )
}
