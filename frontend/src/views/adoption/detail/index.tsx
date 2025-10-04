import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useRequest } from 'ahooks'
import axios from 'axios'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import './index.scss'

// 占位图（放在 public/images 下）
const placeholder = '/images/pet-placeholder.jpg'

// 把相对路径补成绝对（后端返回 /media/... 时生效）
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

const statusMeta = (raw?: string) => {
  const v = String(raw || '').toLowerCase()
  if (v === 'available') return { text: 'Available', cls: 'ok' }
  if (v === 'pending')   return { text: 'Pending',   cls: 'warn' }
  if (v === 'adopted')   return { text: 'Adopted',   cls: 'muted' }
  if (v === 'lost')      return { text: 'Lost',      cls: 'danger' }
  return { text: raw || '—', cls: 'muted' }
}

export default function PetDetail() {
  const { id: idStr } = useParams<{ id: string }>()
  const id = Number(idStr)

  const { data: pet, loading, error } = useRequest<Pet, []>(
    () => adoptApi.detail(id).then(r => r.data),
    { ready: Number.isFinite(id) }
  )

  // 画廊图片（如果只有封面也能正常显示）
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

  const addrCity = (pet as any)?.address_city || (pet as any)?.address?.city?.name
  const years = (pet as any)?.age_years
  const months = (pet as any)?.age_months
  const st = statusMeta(pet?.status)
  const canApply = st.cls === 'ok' // 仅 available 可申请

  // 错误态
  if (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    return (
      <div className="detail-layout">
        <div className="card empty">
          {status === 404 ? '未找到该宠物。' :
           status === 403 ? '该宠物未公开，无法查看。' :
           '加载失败，请稍后再试。'}
          <div className="back"><Link to="/adopt">← 返回列表</Link></div>
        </div>
      </div>
    )
  }

  // 加载骨架
  if (loading || !pet) {
    return (
      <div className="detail-layout">
        <div className="left">
          <div className="card sk" style={{height: 360}} />
          <div className="card sk" style={{height: 120}} />
          <div className="card sk" style={{height: 220}} />
        </div>
        <aside className="right">
          <div className="card sk" style={{height: 240}} />
        </aside>
      </div>
    )
  }

  return (
    <div className="detail-layout">
      {/* 左侧 */}
      <div className="left">
        {/* 画廊 */}
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

        {/* 标题 + 关键信息 */}
        <div className="card head">
          <div className="title-row">
            <h1 className="name">{pet?.name || '—'}</h1>
            <span className={`badge ${st.cls}`}>{st.text}</span>
          </div>
          <div className="sub">
            <span>{pet?.breed || 'Unknown breed'}</span>
            {addrCity && <span> • {addrCity}</span>}
          </div>
          <div className="facts">
            {pet?.species && <span className="pill">{pet.species}</span>}
            {pet?.sex &&     <span className="pill">{pet.sex}</span>}
            <span className="pill">{ageLabel(years, months)}</span>
          </div>
        </div>

        {/* About */}
        <section className="card section">
          <h2>About</h2>
          <dl className="about">
            <div><dt>Breed</dt><dd>{pet?.breed || '—'}</dd></div>
            <div><dt>Sex</dt><dd>{pet?.sex || '—'}</dd></div>
            <div><dt>Age</dt><dd>{ageLabel(years, months)}</dd></div>
            <div><dt>City</dt><dd>{addrCity || '—'}</dd></div>
          </dl>
        </section>

        {/* 描述 */}
        <section className="card section">
          <h2>Meet {pet?.name}</h2>
          <p className="desc">{pet?.description || '暂无更多介绍。'}</p>
        </section>

        <div className="back-link"><Link to="/adopt">← 返回列表</Link></div>
      </div>

      {/* 右侧侧栏 */}
      <aside className="right">
        <div className="card cta">
          <h3>Considering {pet?.name} for adoption?</h3>
          <Link
            to={canApply ? `/adopt/${id}/apply` : '#'}
            className={`btn primary ${canApply ? '' : 'disabled'}`}
            aria-disabled={!canApply}
            onClick={(e) => { if (!canApply) e.preventDefault() }}
          >
            START YOUR INQUIRY
          </Link>
          <button type="button" className="btn ghost" onClick={() => alert('FAQs 敬请期待')}>
            READ FAQs
          </button>
          <div className="split">
            <button type="button" className="btn outline" onClick={() => alert('Sponsor 敬请期待')}>SPONSOR</button>
            <button type="button" className="btn outline" onClick={() => alert('收藏成功（本地示例）')}>FAVORITE</button>
          </div>
          {!canApply && <p className="hint">仅 “Available” 的宠物可以提交申请。</p>}
        </div>

        <div className="card ad">Shelters are full! [Ad]</div>

        <div className="card org">
          <h3>Contact</h3>
          <ul>
            <li><strong>Organization:</strong> {(pet as any)?.created_by?.username ?? 'Owner / Shelter'}</li>
            <li><strong>Location:</strong> {addrCity || '—'}</li>
            <li><strong>Email:</strong> —</li>
            <li><strong>Phone:</strong> —</li>
          </ul>
          <button type="button" className="btn outline">MORE ABOUT US</button>
        </div>
      </aside>
    </div>
  )
}
