import { useMemo, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { adoptApi, type Pet, type Paginated } from '@/services/modules/adopt'
import PageHeroTitle from '@/components/page-hero-title'
import './index.scss'

interface FilterState {
  city: string
  species: string
  sex: string
  petName: string
  size: string
  traits: {
    sterilized: boolean
    vaccinated: boolean
    child_friendly: boolean
    trained: boolean
    loves_play: boolean
    loves_walks: boolean
    good_with_dogs: boolean
    good_with_cats: boolean
    affectionate: boolean
  }
}

export default function Adopt() {
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const page = Number(sp.get('page') || 1)
  const pageSize = Number(sp.get('page_size') || 12)
  const [showAddForm, setShowAddForm] = useState(false)

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<FilterState>({
    city: sp.get('city') || '',
    species: sp.get('species') || '',
    sex: sp.get('sex') || '',
    petName: sp.get('pet_name') || '',
    size: sp.get('size') || '',
    traits: {
      sterilized: sp.get('sterilized') === 'true',
      vaccinated: sp.get('vaccinated') === 'true',
      child_friendly: sp.get('child_friendly') === 'true',
      trained: sp.get('trained') === 'true',
      loves_play: sp.get('loves_play') === 'true',
      loves_walks: sp.get('loves_walks') === 'true',
      good_with_dogs: sp.get('good_with_dogs') === 'true',
      good_with_cats: sp.get('good_with_cats') === 'true',
      affectionate: sp.get('affectionate') === 'true',
    },
  })

  // 获取当前用户信息
  const user = useMemo(() => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }, [])

  const isAdmin = user?.is_staff === true

  // Build params from URL parameters, not local filters
  const params = useMemo(() => {
    const p: Record<string, any> = { page, page_size: pageSize }
    const city = sp.get('city')
    const species = sp.get('species')
    const sex = sp.get('sex')
    const petName = sp.get('pet_name')
    const size = sp.get('size')
    if (city) p.city = city
    if (species) p.species = species
    if (sex) p.sex = sex
    if (petName) p.name = petName
    if (size) p.size = size
    // Add trait filters
    if (sp.get('sterilized') === 'true') p.sterilized = true
    if (sp.get('vaccinated') === 'true') p.vaccinated = true
    if (sp.get('child_friendly') === 'true') p.child_friendly = true
    if (sp.get('trained') === 'true') p.trained = true
    if (sp.get('loves_play') === 'true') p.loves_play = true
    if (sp.get('loves_walks') === 'true') p.loves_walks = true
    if (sp.get('good_with_dogs') === 'true') p.good_with_dogs = true
    if (sp.get('good_with_cats') === 'true') p.good_with_cats = true
    if (sp.get('affectionate') === 'true') p.affectionate = true
    return p
  }, [page, pageSize, sp])

  const { data, loading } = useRequest(
    () => adoptApi.list(params).then(res => res.data as Paginated<Pet>),
    { refreshDeps: [params] }
  )

  function goPage(n: number) {
    sp.set('page', String(n))
    setSp(sp, { replace: true })
  }

  // Handle filter changes - only update local state, not URL
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  // Handle trait checkbox changes
  const handleTraitChange = (trait: keyof FilterState['traits']) => {
    const newFilters = {
      ...filters,
      traits: {
        ...filters.traits,
        [trait]: !filters.traits[trait]
      }
    }
    setFilters(newFilters)
  }

  // Handle search button click - apply filters
  const handleApplyFilters = () => {
    const newSp = new URLSearchParams()
    if (filters.city) newSp.set('city', filters.city)
    if (filters.species) newSp.set('species', filters.species)
    if (filters.sex) newSp.set('sex', filters.sex)
    if (filters.petName) newSp.set('pet_name', filters.petName)
    if (filters.size) newSp.set('size', filters.size)
    // Add selected traits to URL
    if (filters.traits.sterilized) newSp.set('sterilized', 'true')
    if (filters.traits.vaccinated) newSp.set('vaccinated', 'true')
    if (filters.traits.child_friendly) newSp.set('child_friendly', 'true')
    if (filters.traits.trained) newSp.set('trained', 'true')
    if (filters.traits.loves_play) newSp.set('loves_play', 'true')
    if (filters.traits.loves_walks) newSp.set('loves_walks', 'true')
    if (filters.traits.good_with_dogs) newSp.set('good_with_dogs', 'true')
    if (filters.traits.good_with_cats) newSp.set('good_with_cats', 'true')
    if (filters.traits.affectionate) newSp.set('affectionate', 'true')
    newSp.set('page', '1')
    setSp(newSp)
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      city: '',
      species: '',
      sex: '',
      petName: '',
      size: '',
      traits: {
        sterilized: false,
        vaccinated: false,
        child_friendly: false,
        trained: false,
        loves_play: false,
        loves_walks: false,
        good_with_dogs: false,
        good_with_cats: false,
        affectionate: false,
      },
    })
    setSp(new URLSearchParams())
  }

  const list = data?.results ?? []

  return (
    <div>
      <PageHeroTitle
        title="Pet Adopt"
        subtitle="Adopt right now!"
      />

      <div className="adopt-page">
        <div className="adopt-container">
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
                placeholder="All of Poland"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            <div className="filter-section">
              <label className="filter-label">Pet Name</label>
              <input 
                type="text"
                className="filter-input"
                placeholder="How is a pet lured?"
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
              <label className="filter-label">Gender</label>
              <select 
                className="filter-select"
                value={filters.sex}
                onChange={(e) => handleFilterChange('sex', e.target.value)}
              >
                <option value="">No matter</option>
                <option value="male">♂️ Boy</option>
                <option value="female">♀️ Girl</option>
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">Size</label>
              <select 
                className="filter-select"
                value={filters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
              >
                <option value="">No matter</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="filter-section checkboxes">
              <label className="filter-label">Special Traits</label>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input 
                    type="checkbox"
                    checked={filters.traits.sterilized}
                    onChange={() => handleTraitChange('sterilized')}
                  />
                  <span>Sterilization/Castration</span>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox"
                    checked={filters.traits.vaccinated}
                    onChange={() => handleTraitChange('vaccinated')}
                  />
                  <span>Vaccinations</span>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox"
                    checked={filters.traits.child_friendly}
                    onChange={() => handleTraitChange('child_friendly')}
                  />
                  <span>Child-friendly</span>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox"
                    checked={filters.traits.trained}
                    onChange={() => handleTraitChange('trained')}
                  />
                  <span>Trained</span>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox"
                    checked={filters.traits.loves_play}
                    onChange={() => handleTraitChange('loves_play')}
                  />
                  <span>Loves to play</span>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox"
                    checked={filters.traits.loves_walks}
                    onChange={() => handleTraitChange('loves_walks')}
                  />
                  <span>Loves walks</span>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox"
                    checked={filters.traits.good_with_dogs}
                    onChange={() => handleTraitChange('good_with_dogs')}
                  />
                  <span>Accepts dogs</span>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox"
                    checked={filters.traits.good_with_cats}
                    onChange={() => handleTraitChange('good_with_cats')}
                  />
                  <span>Accepts cats</span>
                </label>
                <label className="checkbox-item">
                  <input 
                    type="checkbox"
                    checked={filters.traits.affectionate}
                    onChange={() => handleTraitChange('affectionate')}
                  />
                  <span>Loves caresses</span>
                </label>
              </div>
            </div>

            <button 
              type="button"
              className="filter-search-btn"
              onClick={handleApplyFilters}
              title="Apply filters"
            >
              🔍 Search
            </button>
          </aside>

          {/* Right Content - Pet List */}
          <main className="pets-main">
            {/* Add Pet Form */}
            {showAddForm && isAdmin && (
              <AddPetForm onSuccess={() => {
                setShowAddForm(false)
              }} />
            )}

            {loading && <div className="hint">Loading…</div>}

            {!loading && (
              <>
                <div className="results-header">
                  <div>
                    <h2>Find your new friend</h2>
                    <p className="result-count">{data?.count || 0} pets available</p>
                  </div>
                  {isAdmin && (
                    <button 
                      type="button"
                      className="add-pet-btn-top-right"
                      onClick={() => nav('/adopt/add')}
                    >
                      Add New Pet
                    </button>
                  )}
                </div>

                <div className="grid">
                  {list.map(pet => (
                    <Link key={pet.id} to={`/adopt/${pet.id}`} className="card-link">
                      <article className="card">
                        <div className="thumb">
                          <img src={pet.photo || '/images/pet-placeholder.jpg'} alt={pet.name} />
                          {pet.city && (
                            <div className="city-badge">📍 {pet.city}</div>
                          )}
                        </div>
                        <div className="meta">
                          <h3>{pet.name}</h3>
                          <p className="muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                            {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}{' '}
                            {pet.species || 'Pet'} • {pet.sex === 'male' ? '♂️ Boy' : '♀️ Girl'}
                            {' '} • 📅 {pet.age_years === 0 ? 'Baby' : pet.age_years !== undefined && pet.age_years !== null ? `${pet.age_years} years old` : pet.age_months ? `${pet.age_months} months old` : 'Age unknown'}
                            {pet.size ? ` • 📏 ${pet.size}` : ''}
                          </p>
                          {(pet.sterilized || pet.vaccinated || pet.child_friendly || pet.trained || pet.loves_play || pet.loves_walks || pet.good_with_dogs || pet.good_with_cats || pet.affectionate) && (
                            <div className="traits-tags">
                              {pet.sterilized && <span className="trait-tag">✓ Sterilized</span>}
                              {pet.vaccinated && <span className="trait-tag">✓ Vaccinated</span>}
                              {pet.child_friendly && <span className="trait-tag">✓ Child-friendly</span>}
                              {pet.trained && <span className="trait-tag">✓ Trained</span>}
                              {pet.loves_play && <span className="trait-tag">✓ Loves to play</span>}
                              {pet.loves_walks && <span className="trait-tag">✓ Loves walks</span>}
                              {pet.good_with_dogs && <span className="trait-tag">✓ Good with dogs</span>}
                              {pet.good_with_cats && <span className="trait-tag">✓ Good with cats</span>}
                              {pet.affectionate && <span className="trait-tag">✓ Affectionate</span>}
                            </div>
                          )}
                          <p className="desc">{pet.description || 'No description available'}</p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                {list.length === 0 && (
                  <div className="no-results">
                    <p>No pets found matching your filters</p>
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
