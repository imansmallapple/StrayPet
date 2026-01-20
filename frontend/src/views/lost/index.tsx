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
  lastSeen: string
}

export default function LostPetsPage() {
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || 1)
  const pageSize = 12

  // Temporary filter state (for input fields)
  const [tempFilters, setTempFilters] = useState<FilterState>({
    city: sp.get('city') || '',
    species: sp.get('species') || '',
    petName: sp.get('pet_name') || '',
    lastSeen: sp.get('last_seen') || '',
  })

  // Applied filter state (from URL, used for API request)
  const appliedFilters = useMemo(() => ({
    city: sp.get('city') || '',
    species: sp.get('species') || '',
    petName: sp.get('pet_name') || '',
    lastSeen: sp.get('last_seen') || '',
  }), [sp])

  // Build params from applied filters
  const params = useMemo(() => {
    const p: Record<string, any> = { page, page_size: pageSize, status: 'open' }
    if (appliedFilters.city) p.city = appliedFilters.city
    if (appliedFilters.species) p.species = appliedFilters.species
    if (appliedFilters.petName) p.pet_name = appliedFilters.petName
    
    // Convert lastSeen filter to lost_from/lost_to dates
    if (appliedFilters.lastSeen) {
      const now = new Date()
      let fromDate: Date | null = null
      
      switch (appliedFilters.lastSeen) {
        case 'today':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'within_3_days':
          fromDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
          break
        case 'within_1_week':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'within_2_weeks':
          fromDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
          break
        case 'within_1_month':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'within_1_year':
          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
      }
      
      if (fromDate) {
        p.lost_from = fromDate.toISOString()
      }
    }
    
    return p
  }, [page, pageSize, appliedFilters])

  const { data, loading } = useRequest(
    () => lostApi.list(params).then(res => res.data as PageResp<LostPet>),
    { refreshDeps: [params] }
  )

  function goPage(n: number) {
    sp.set('page', String(n))
    setSp(sp, { replace: true })
  }

  // Handle filter input changes (update temp state only)
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setTempFilters({ ...tempFilters, [key]: value })
  }

  // Handle search button click (apply filters)
  const handleSearch = () => {
    const newSp = new URLSearchParams()
    if (tempFilters.city) newSp.set('city', tempFilters.city)
    if (tempFilters.species) newSp.set('species', tempFilters.species)
    if (tempFilters.petName) newSp.set('pet_name', tempFilters.petName)
    if (tempFilters.lastSeen) newSp.set('last_seen', tempFilters.lastSeen)
    newSp.set('page', '1')
    setSp(newSp)
  }

  // Reset filters
  const handleResetFilters = () => {
    setTempFilters({
      city: '',
      species: '',
      petName: '',
      lastSeen: '',
    })
    setSp(new URLSearchParams())
  }

  const handleReportClick = () => {
    navigate('/lost/post')
  }

  const list = data?.results ?? []

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
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
                value={tempFilters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            <div className="filter-section">
              <label className="filter-label">Pet Name</label>
              <input 
                type="text"
                className="filter-input"
                placeholder="Pet's name"
                value={tempFilters.petName}
                onChange={(e) => handleFilterChange('petName', e.target.value)}
              />
            </div>

            <div className="filter-section">
              <label className="filter-label">Pet Type</label>
              <select 
                className="filter-select"
                value={tempFilters.species}
                onChange={(e) => handleFilterChange('species', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="dog">🐕 Dogs</option>
                <option value="cat">🐱 Cats</option>
                <option value="other">🐾 Other</option>
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">Lost Time</label>
              <select 
                className="filter-select"
                value={tempFilters.lastSeen}
                onChange={(e) => handleFilterChange('lastSeen', e.target.value)}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="within_3_days">Within 3 days</option>
                <option value="within_1_week">Within 1 week</option>
                <option value="within_2_weeks">Within 2 weeks</option>
                <option value="within_1_month">Within 1 month</option>
                <option value="within_1_year">Within 1 year</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="filter-section">
              <button 
                className="search-btn"
                onClick={handleSearch}
                type="button"
              >
                🔍 Search
              </button>
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
