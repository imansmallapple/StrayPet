import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRequest } from 'ahooks'
import axios from 'axios'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import PageHeroTitle from '@/components/page-hero-title'
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
    <div className="adoption-apply-page">
      <PageHeroTitle
        title="Adoption Application"
        subtitle="Complete your application to adopt this pet"
      />

      <div className="apply-container">
        {/* Main Content */}
        <main className="apply-main">
          {/* Pet Summary Card */}
          <section className="pet-summary-card">
            <div className="pet-summary-thumb">
              {loading ? <div className="skeleton" /> : (
                <img 
                  src={petImg} 
                  alt={pet?.name || 'pet'} 
                  onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='/images/pet-placeholder.jpg' }} 
                />
              )}
            </div>
            <div className="pet-summary-info">
              <h2>{pet?.name ?? '—'}</h2>
              <p className="pet-meta">
                {(pet?.species ?? 'Pet')}
                {pet?.breed ? ` • ${pet.breed}` : ''}
                {pet?.sex ? ` • ${pet.sex}` : ''}
              </p>
              <Link to={`/adopt/${id}`} className="view-details-link">View Full Details →</Link>
            </div>
          </section>

          {/* Application Form */}
          <form className="application-form card" onSubmit={onSubmit}>
            <h3>Your Information</h3>
            
            <div className="form-grid">
              <label className="form-group">
                <span className="label-text">Full Name *</span>
                <input 
                  value={fullName} 
                  onChange={e=>setFullName(e.target.value)} 
                  placeholder="Your full name"
                  required
                />
              </label>

              <label className="form-group">
                <span className="label-text">Phone Number *</span>
                <input 
                  value={phone} 
                  onChange={e=>setPhone(e.target.value)} 
                  placeholder="e.g. +1 234 567 890"
                  required
                />
              </label>

              <label className="form-group">
                <span className="label-text">Do you have children at home? *</span>
                <select 
                  value={hasKids} 
                  onChange={e=>setHasKids(e.target.value as any)}
                  required
                >
                  <option value="">— Select —</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="form-group">
                <span className="label-text">Do you have other pets? *</span>
                <select 
                  value={hasPets} 
                  onChange={e=>setHasPets(e.target.value as any)}
                  required
                >
                  <option value="">— Select —</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="form-group">
                <span className="label-text">Home Type *</span>
                <select 
                  value={homeType} 
                  onChange={e=>setHomeType(e.target.value as any)}
                  required
                >
                  <option value="">— Select —</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                </select>
              </label>
            </div>

            <label className="form-group form-group-full">
              <span className="label-text">Application Message *</span>
              <textarea
                required
                rows={6}
                value={message}
                onChange={e=>setMessage(e.target.value)}
                placeholder="Tell us about your pet care experience, daily schedule, living environment, and why you're a good match for this pet..."
              />
            </label>

            <label className="form-checkbox">
              <input 
                type="checkbox" 
                checked={agree} 
                onChange={e=>setAgree(e.target.checked)} 
                required
              />
              <span>I confirm that the above information is accurate and truthful, and I agree to the platform's adoption guidelines.</span>
            </label>

            <div className="form-actions">
              <Link to={`/adopt/${id}`} className="btn btn-secondary">← Back</Link>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </form>
        </main>

        {/* Sidebar */}
        <aside className="apply-sidebar">
          <div className="tips-card card">
            <h3>💡 Important Tips</h3>
            <ul>
              <li>Make sure all family members agree to adoption.</li>
              <li>The pet owner will contact you via message or phone after review.</li>
              <li>If the pet status changes to <strong>pending</strong>, another application is being reviewed.</li>
              <li>Be honest and detailed in your application for better matching.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
