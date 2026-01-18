// src/views/adoption/adopt/index.tsx
import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { adoptApi, type Pet, type Paginated } from '@/services/modules/adopt'
import PageHeroTitle from '@/components/page-hero-title'
import './index.scss'

export default function Adopt() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || 1)
  const pageSize = Number(sp.get('page_size') || 12)
  const species = sp.get('species') || ''
  const [showAddForm, setShowAddForm] = useState(false)

  // 获取当前用户信息
  const user = useMemo(() => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }, [])

  const isAdmin = user?.is_staff === true

  const params = useMemo(
    () => ({ page, page_size: pageSize, ...(species ? { species } : {}) }),
    [page, pageSize, species],
  )

  const { data, loading, refresh } = useRequest(
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
          <div className="header-top">
            <h2>Find your new friend</h2>
            {isAdmin && (
              <button 
                type="button"
                className="add-pet-btn"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                + Add Pet
              </button>
            )}
          </div>
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
              <option value="">All Species</option>
              <option value="dog">🐕 Dog</option>
              <option value="cat">🐱 Cat</option>
            </select>
          </div>
        </div>

        {/* Add Pet Form */}
        {showAddForm && isAdmin && (
          <AddPetForm onSuccess={() => {
            setShowAddForm(false)
            refresh()
          }} />
        )}

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
                      {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}{' '}
                      {pet.species || 'Pet'} • {pet.sex === 'M' ? '♂️' : pet.sex === 'F' ? '♀️' : '❓'} {pet.sex || 'Unknown'}
                      {pet.age_years ? ` • ${pet.age_years}y` : pet.age_months ? ` • ${pet.age_months}m` : ''}
                      {pet.city ? ` • 📍 ${pet.city}` : ''}
                    </p>
                    <p className="desc">{pet.description || 'No description available'}</p>
                    <div className="actions">
                      <Link to={`/adopt/${pet.id}`}>View Details →</Link>
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

// Add Pet Form Component
function AddPetForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    sex: 'M',
    age_years: '',
    age_months: '',
    description: '',
    city: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await adoptApi.create({
        ...formData,
        age_years: formData.age_years ? parseInt(formData.age_years) : undefined,
        age_months: formData.age_months ? parseInt(formData.age_months) : undefined,
      } as any)
      alert('Pet added successfully!')
      onSuccess()
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || 'Failed to add pet'
      setError(errMsg)
      console.error('Add pet error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-pet-form-container">
      <div className="form-card">
        <h3>Add New Pet</h3>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Pet Name *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Buddy, Fluffy"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Species *</label>
              <select 
                name="species" 
                value={formData.species}
                onChange={handleChange}
                required
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select 
                name="sex" 
                value={formData.sex}
                onChange={handleChange}
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="U">Unknown</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age (Years)</label>
              <input 
                type="number" 
                name="age_years" 
                value={formData.age_years}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 2"
              />
            </div>

            <div className="form-group">
              <label>Age (Months)</label>
              <input 
                type="number" 
                name="age_months" 
                value={formData.age_months}
                onChange={handleChange}
                min="0"
                max="11"
                placeholder="e.g., 6"
              />
            </div>
          </div>

          <div className="form-group">
            <label>City</label>
            <input 
              type="text" 
              name="city" 
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g., San Francisco"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about this pet..."
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Adding...' : 'Add Pet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
