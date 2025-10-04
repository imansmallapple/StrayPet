import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRequest } from 'ahooks'
import axios from 'axios'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import './index.scss'

const API_ORIGIN = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'
const toAbs = (url?: string | null) => {
  if (!url) return '/images/pet-placeholder.jpg'
  if (/^https?:\/\//i.test(url)) return url
  try { return new URL(url, API_ORIGIN).toString() } catch { return '/images/pet-placeholder.jpg' }
}

export default function AdoptApply() {
  const { id: idStr } = useParams<{ id: string }>()
  const id = Number(idStr)
  const nav = useNavigate()

  // 拉取宠物摘要
  const { data: pet, loading } = useRequest<Pet, []>(
    () => adoptApi.detail(id).then(r => r.data),
    { ready: Number.isFinite(id) }
  )

  // 表单状态
  const [fullName, setFullName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [hasKids, setHasKids]     = useState<'yes'|'no'|''>('')
  const [hasPets, setHasPets]     = useState<'yes'|'no'|''>('')
  const [homeType, setHomeType]   = useState<'house'|'apartment'|''>('')
  const [message, setMessage]     = useState('')
  const [agree, setAgree]         = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 未登录 → 跳登录（带回跳）
  useEffect(() => {
    const t = localStorage.getItem('accessToken')
    if (!t) nav(`/auth/login?next=/adopt/${id}/apply`, { replace: true })
  }, [id, nav])

  const petImg = useMemo(() => toAbs((pet as any)?.photo || (pet as any)?.cover), [pet])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!agree) return alert('请先勾选同意声明')
    setSubmitting(true)
    try {
      // 你的后端只收 message，这里把其它答案拼进 message 里一并提交，方便后端查看
      const composed =
        `Name: ${fullName || '-'}\n` +
        `Phone: ${phone || '-'}\n` +
        `Has kids: ${hasKids || '-'}\n` +
        `Has other pets: ${hasPets || '-'}\n` +
        `Home type: ${homeType || '-'}\n` +
        `Message: ${message || '-'}`

      await adoptApi.apply(id, composed)
      alert('申请已提交，我们会尽快联系你。')
      nav(`/adopt/${id}`, { replace: true })
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? ((err.response?.data as any)?.detail ?? '提交失败，请稍后再试')
        : (err as Error).message
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="apply-layout">
      <main className="apply-main">
        <h1>Adoption Application</h1>

        {/* 宠物摘要 */}
        <section className="pet-summary card">
          <div className="thumb">
            {loading ? <div className="sk" /> : (
              <img src={petImg} alt={pet?.name || 'pet'} onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='/images/pet-placeholder.jpg' }} />
            )}
          </div>
          <div className="info">
            <h2>{pet?.name ?? '—'}</h2>
            <p className="muted">
              {(pet?.species ?? 'Pet')}
              {pet?.breed ? ` • ${pet.breed}` : ''}
              {pet?.sex ? ` • ${pet.sex}` : ''}
            </p>
            <Link to={`/adopt/${id}`}>查看详情 →</Link>
          </div>
        </section>

        {/* 申请表单 */}
        <form className="card form" onSubmit={onSubmit}>
          <div className="grid">
            <label>
              全名
              <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name" />
            </label>
            <label>
              联系电话
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. +1 234 567 890" />
            </label>

            <label>
              家中有孩子吗？
              <select value={hasKids} onChange={e=>setHasKids(e.target.value as any)}>
                <option value="">请选择</option>
                <option value="yes">有</option>
                <option value="no">无</option>
              </select>
            </label>

            <label>
              现在有其它宠物吗？
              <select value={hasPets} onChange={e=>setHasPets(e.target.value as any)}>
                <option value="">请选择</option>
                <option value="yes">有</option>
                <option value="no">无</option>
              </select>
            </label>

            <label>
              住所类型
              <select value={homeType} onChange={e=>setHomeType(e.target.value as any)}>
                <option value="">请选择</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
              </select>
            </label>

            <label className="full">
              申请说明（必填）
              <textarea
                required
                rows={5}
                value={message}
                onChange={e=>setMessage(e.target.value)}
                placeholder="请简要说明你的养宠经验、作息、居住环境、为什么适合这只宠物等…"
              />
            </label>
          </div>

          <label className="agree">
            <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
            我确认上述信息真实准确，并同意平台的领养须知。
          </label>

          <div className="actions">
            <Link to={`/adopt/${id}`} className="btn">返回</Link>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? '提交中…' : '提交申请'}
            </button>
          </div>
        </form>
      </main>

      <aside className="apply-side">
        <div className="card tips">
          <h3>温馨提示</h3>
          <ul>
            <li>请确保家庭成员都同意领养。</li>
            <li>提交后，发布者会通过站内信或电话联系你。</li>
            <li>若该宠物状态变为 <b>pending</b>，说明已有申请在处理。</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
