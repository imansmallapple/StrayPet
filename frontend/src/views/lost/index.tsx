// src/views/lost/index.tsx
import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { lostApi, type LostPet, type PageResp } from '@/services/modules/lost'
import './index.scss'

interface FilterState {
  city: string
  species: string
  petName: string
  color: string
}

export default function LostPetsPage() {
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || 1)
  const pageSize = 12

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<FilterState>({
    city: sp.get('city') || '',
    species: sp.get('species') || '',
    petName: sp.get('pet_name') || '',
    color: sp.get('color') || '',
  })

  // Build params from filters
  const params = useMemo(() => {
    const p: Record<string, any> = { page, page_size: pageSize, status: 'open' }
    if (filters.city) p.city = filters.city
    if (filters.species) p.species = filters.species
    if (filters.petName) p.pet_name__icontains = filters.petName
    if (filters.color) p.color__icontains = filters.color
    return p
  }, [page, pageSize, filters])

  const { data, loading } = useRequest(
    () => lostApi.list(params).then(res => res.data as PageResp<LostPet>),
    { refreshDeps: [params] }
  )

  function goPage(n: number) {
    sp.set('page', String(n))
    setSp(sp, { replace: true })
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Update URL params
    const newSp = new URLSearchParams()
    if (newFilters.city) newSp.set('city', newFilters.city)
    if (newFilters.species) newSp.set('species', newFilters.species)
    if (newFilters.petName) newSp.set('pet_name', newFilters.petName)
    if (newFilters.color) newSp.set('color', newFilters.color)
    newSp.set('page', '1')
    setSp(newSp)
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      city: '',
      species: '',
      petName: '',
      color: '',
    })
    setSp(new URLSearchParams())
  }

  const handleReportClick = () => {
    navigate('/lost/post')
  }

  const list = data?.results ?? []

  return (
    <div>
      <div className="page-header">
        <h1>Lost Pets</h1>
        <p className="subtitle">Help reunite lost pets with their families</p>
        <div className="page-header-underline"></div>
      </div>

      <div className="lost-page">
        <div className="lost-container">
          {/* Left Sidebar - Filters */}
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h3>Filter Pets</h3>
              <button 
                className="reset-btn"
                onClick={handleResetFilters}
                type="button"
                title="Clear all filters"
              >
                ✕ Reset
              </button>
            </div>

            <div className="filter-section">
              <label className="filter-label">City</label>
              <input 
                type="text"
                className="filter-input"
                placeholder="All locations"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            <div className="filter-section">
              <label className="filter-label">Pet Name</label>
              <input 
                type="text"
                className="filter-input"
                placeholder="Pet's name"
                value={filters.petName}
                onChange={(e) => handleFilterChange('petName', e.target.value)}
              />
            </div>

            <div className="filter-section">
              <label className="filter-label">Pet Type</label>
              <select 
                className="filter-select"
                value={filters.species}
                onChange={(e) => handleFilterChange('species', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="dog">🐕 Dogs</option>
                <option value="cat">🐱 Cats</option>
                <option value="other">🐾 Other</option>
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">Color</label>
              <input 
                type="text"
                className="filter-input"
                placeholder="e.g., Brown, Black"
                value={filters.color}
                onChange={(e) => handleFilterChange('color', e.target.value)}
              />
            </div>
          </aside>

          {/* Right Content - Pet List */}
          <main className="lost-main">
            {loading && <div className="hint">Loading…</div>}

            {!loading && (
              <>
                <div className="results-header">
                  <div>
                    <h2>Lost Pets Needing Help</h2>
                    <p className="result-count">{data?.count || 0} lost pets</p>
                  </div>
                  <button 
                    type="button"
                    className="report-pet-btn"
                    onClick={handleReportClick}
                  >
                    📢 Report Lost Pet
                  </button>
                </div>

                <div className="grid">
                  {list.map(pet => {
                    const imgSrc = pet.photo_url || pet.photo
                    const title = pet.pet_name || `${pet.species}${pet.breed ? ' · ' + pet.breed : ''}`
                    const lostDate = pet.lost_time
                      ? new Date(pet.lost_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Unknown'

                    return (
                      <a key={pet.id} href={`/lost/${pet.id}`} className="card-link">
                        <article className="card">
                          <div className="thumb">
                            {imgSrc ? (
                              <img src={imgSrc} alt={title} />
                            ) : (
                              <div className="no-image-placeholder">
                                <span>📷</span>
                                <p>No Photo</p>
                              </div>
                            )}
                            {pet.city && (
                              <div className="city-badge">📍 {pet.city}</div>
                            )}
                          </div>
                          <div className="meta">
                            <h3>{title}</h3>
                            <p className="muted">
                              {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}{' '}
                              {pet.species || 'Pet'}
                              {pet.color ? ` • ${pet.color}` : ''}
                            </p>
                            <p className="desc">Lost: {lostDate}</p>
                          </div>
                        </article>
                      </a>
                    )
                  })}
                </div>

                {list.length === 0 && (
                  <div className="no-results">
                    <p>No lost pets found matching your filters</p>
                    <button 
                      className="reset-btn-secondary"
                      onClick={handleResetFilters}
                      type="button"
                    >
                      Clear filters
                    </button>
                  </div>
                )}

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
          </main>
        </div>
      </div>
    </div>
  )
}
