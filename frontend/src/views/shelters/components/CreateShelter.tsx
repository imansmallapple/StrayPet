// src/views/shelters/components/CreateShelter.tsx
import { useState, useEffect, useRef } from 'react'
import { Modal, Form, Button, Row, Col, Alert, ListGroup } from 'react-bootstrap'
import { shelterApi, type ShelterCreatePayload } from '@/services/modules/shelter'
import './CreateShelter.scss'

interface CreateShelterProps {
  show: boolean
  onHide: () => void
  onSuccess: () => void
}

export default function CreateShelter({ show, onHide, onSuccess }: CreateShelterProps) {
  const [formData, setFormData] = useState<ShelterCreatePayload>({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    capacity: 0,
    current_animals: 0,
    is_active: true,
    address_data: {
      country: '',
      region: '',
      city: '',
      street: '',
      postal_code: ''
    },
    facebook_url: '',
    instagram_url: '',
    twitter_url: ''
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mapbox autocomplete states
  const [activeField, setActiveField] = useState<'country' | 'region' | 'city' | null>(null)
  const [countrySearch, setCountrySearch] = useState('')
  const [regionSearch, setRegionSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')
  
  const [countrySuggestions, setCountrySuggestions] = useState<any[]>([])
  const [regionSuggestions, setRegionSuggestions] = useState<any[]>([])
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false)
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  
  const [countryActiveIndex, setCountryActiveIndex] = useState(-1)
  const [regionActiveIndex, setRegionActiveIndex] = useState(-1)
  const [cityActiveIndex, setCityActiveIndex] = useState(-1)
  
  const countrySuggestionsWrapper = useRef<HTMLDivElement | null>(null)
  const regionSuggestionsWrapper = useRef<HTMLDivElement | null>(null)
  const citySuggestionsWrapper = useRef<HTMLDivElement | null>(null)
  const countryInputRef = useRef<HTMLInputElement | null>(null)
  const regionInputRef = useRef<HTMLInputElement | null>(null)
  const cityInputRef = useRef<HTMLInputElement | null>(null)

  // Mapbox Country Autocomplete
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      console.error('VITE_MAPBOX_TOKEN not found in environment variables')
      return
    }

    const handle = setTimeout(async () => {
      if (!countrySearch || countrySearch.length < 1) {
        setCountrySuggestions([])
        setShowCountrySuggestions(false)
        return
      }

      try {
        const q = encodeURIComponent(countrySearch)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&types=country&autocomplete=true&limit=6`
        const r = await fetch(url)
        const j = await r.json()
        const feats: any[] = j.features ?? []
        setCountrySuggestions(feats)
        setShowCountrySuggestions(feats.length > 0)
        setCountryActiveIndex(-1)
      } catch (err) {
        console.error('Mapbox fetch error:', err)
        setCountrySuggestions([])
        setShowCountrySuggestions(false)
      }
    }, 200)

    return () => clearTimeout(handle)
  }, [countrySearch])

  // Mapbox Region Autocomplete
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) return

    const handle = setTimeout(async () => {
      if (!regionSearch || regionSearch.length < 1) {
        setRegionSuggestions([])
        setShowRegionSuggestions(false)
        return
      }

      try {
        const countryCode = formData.address_data?.country_code
        const countryParam = countryCode ? `&country=${encodeURIComponent(countryCode)}` : ''
        const q = encodeURIComponent(regionSearch)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&types=region&autocomplete=true&limit=6${countryParam}`

        const r = await fetch(url)
        const j = await r.json()
        let feats: any[] = j.features ?? []

        if (formData.address_data?.country) {
          const wanted = formData.address_data.country.trim().toLowerCase()
          feats = feats.filter(f => {
            const ctx = f.context ?? []
            const c = ctx.find((x: any) => (x.id || '').startsWith('country.'))
            const name = (c?.text || '').trim().toLowerCase()
            const sc = (c?.short_code || '').trim().toLowerCase()
            return (name && name === wanted) || (sc && sc === wanted)
          })
        }

        setRegionSuggestions(feats)
        setShowRegionSuggestions(feats.length > 0)
        setRegionActiveIndex(-1)
      } catch {
        setRegionSuggestions([])
        setShowRegionSuggestions(false)
      }
    }, 200)

    return () => clearTimeout(handle)
  }, [regionSearch, formData.address_data?.country_code, formData.address_data?.country])

  // Mapbox City Autocomplete
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) return

    const handle = setTimeout(async () => {
      if (!citySearch || citySearch.length < 1) {
        setCitySuggestions([])
        setShowCitySuggestions(false)
        return
      }

      try {
        const countryCode = formData.address_data?.country_code
        const countryParam = countryCode ? `&country=${encodeURIComponent(countryCode)}` : ''
        const q = encodeURIComponent(citySearch)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&types=place,locality&autocomplete=true&limit=6${countryParam}`

        const r = await fetch(url)
        const j = await r.json()
        let feats: any[] = j.features ?? []

        if (formData.address_data?.country) {
          const wanted = formData.address_data.country.trim().toLowerCase()
          feats = feats.filter(f => {
            const ctx = f.context ?? []
            const c = ctx.find((x: any) => (x.id || '').startsWith('country.'))
            const name = (c?.text || '').trim().toLowerCase()
            const sc = (c?.short_code || '').trim().toLowerCase()
            return (name && name === wanted) || (sc && sc === wanted)
          })
        }

        if (formData.address_data?.region) {
          const wantedRegion = formData.address_data.region.trim().toLowerCase()
          feats = feats.filter(f => {
            const ctx = f.context ?? []
            const reg = ctx.find((x: any) => (x.id || '').startsWith('region.'))?.text
            const regName = (reg || '').trim().toLowerCase()
            return !regName || regName === wantedRegion
          })
        }

        setCitySuggestions(feats)
        setShowCitySuggestions(feats.length > 0)
        setCityActiveIndex(-1)
      } catch {
        setCitySuggestions([])
        setShowCitySuggestions(false)
      }
    }, 200)

    return () => clearTimeout(handle)
  }, [citySearch, formData.address_data?.country_code, formData.address_data?.country, formData.address_data?.region])

  // Click outside to close suggestions
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const t = ev.target as Node
      const cwrap = countrySuggestionsWrapper.current
      const rwrap = regionSuggestionsWrapper.current
      const ciwrap = citySuggestionsWrapper.current
      if (cwrap && !cwrap.contains(t)) setShowCountrySuggestions(false)
      if (rwrap && !rwrap.contains(t)) setShowRegionSuggestions(false)
      if (ciwrap && !ciwrap.contains(t)) setShowCitySuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function fillAddressFromFeature(feature: any, field?: 'country' | 'region' | 'city') {
    if (!feature) return

    const ctx: any[] = feature.context ?? []
    const placeTypes: string[] = feature.place_type ?? []

    const countryCtx = ctx.find(c => (c.id || '').startsWith('country.'))
    const regionCtx = ctx.find(c => (c.id || '').startsWith('region.'))
    const placeCtx = ctx.find(c => (c.id || '').startsWith('place.')) || ctx.find(c => (c.id || '').startsWith('locality.'))

    let country = countryCtx?.text || countryCtx?.short_code || ''
    const countryCode = (countryCtx?.short_code || '').toLowerCase() || undefined
    let region = regionCtx?.text || ''
    let city = placeCtx?.text || ''

    const postcodeCtx = ctx.find(c => (c.id || '').startsWith('postcode.'))
    const postcode = postcodeCtx?.text || ''

    // 不再从前端获取坐标，让后端的 geocode_address 函数处理

    if (!country && placeTypes.includes('country')) {
      country = feature.text || feature.place_name || country
    }
    if (!region && placeTypes.includes('region')) {
      region = feature.text || feature.place_name || region
    }
    if (!city && (placeTypes.includes('place') || placeTypes.includes('locality'))) {
      city = feature.text || feature.place_name || city
    }

    const usingField: 'country' | 'region' | 'city' | null = field ?? activeField

    setFormData(prev => {
      const next = { ...prev }
      // Ensure address_data is an object, not an array
      const addr = { ...(prev.address_data || {}) }

      if (feature.properties && feature.properties.address) {
        addr.street = `${feature.properties.address} ${feature.text}`
      }

      if (countryCode) {
        addr.country_code = countryCode
      }

      if (usingField === 'country') {
        if (country) addr.country = country
      } else if (usingField === 'region') {
        if (region) addr.region = region
        if (!addr.country && country) addr.country = country
      } else if (usingField === 'city') {
        if (city) addr.city = city
        if (!addr.region && region) addr.region = region
        if (!addr.country && country) addr.country = country
      } else {
        if (country) addr.country = country
        if (region) addr.region = region
        if (city) addr.city = city
      }

      if (postcode) addr.postal_code = postcode
      // 不在前端保存坐标，让后端的 geocode_address 函数来处理
      // 后端会使用更准确的地理编码逻辑（包括波兰语支持、门牌号处理等）

      next.address_data = addr
      return next
    })

    if (usingField === 'country') {
      setCountrySearch('')
      setCountrySuggestions([])
      setShowCountrySuggestions(false)
      setCountryActiveIndex(-1)
      setTimeout(() => regionInputRef.current?.focus(), 0)
    } else if (usingField === 'region') {
      setRegionSearch('')
      setRegionSuggestions([])
      setShowRegionSuggestions(false)
      setRegionActiveIndex(-1)
      setTimeout(() => cityInputRef.current?.focus(), 0)
    } else if (usingField === 'city') {
      setCitySearch('')
      setCitySuggestions([])
      setShowCitySuggestions(false)
      setCityActiveIndex(-1)
    } else {
      setCountrySearch('')
      setRegionSearch('')
      setCitySearch('')
      setCountrySuggestions([])
      setRegionSuggestions([])
      setCitySuggestions([])
      setShowCountrySuggestions(false)
      setShowRegionSuggestions(false)
      setShowCitySuggestions(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const currentAddressData = prev.address_data || {}
      return {
        ...prev,
        address_data: {
          ...currentAddressData,
          [field]: value
        }
      }
    })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Shelter name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 让后端负责地理编码，不在前端处理
      const payload: ShelterCreatePayload = {
        ...formData
      }

      // 只在有地址数据时才设置 address_data
      if (formData.address_data && Object.keys(formData.address_data).length > 0) {
        payload.address_data = formData.address_data
      }
      
      if (logoFile) {
        payload.logo = logoFile
      }
      if (coverFile) {
        payload.cover_image = coverFile
      }

      await shelterApi.create(payload)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        email: '',
        phone: '',
        website: '',
        capacity: 0,
        current_animals: 0,
        is_active: true,
        address_data: {
          country: '',
          region: '',
          city: '',
          street: '',
          postal_code: ''
        },
        facebook_url: '',
        instagram_url: '',
        twitter_url: ''
      })
      setLogoFile(null)
      setCoverFile(null)
      setLogoPreview(null)
      setCoverPreview(null)

      onSuccess()
      onHide()
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create shelter')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onHide()
    }
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="create-shelter-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Shelter
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Basic Information */}
          <div className="form-section">
            <h5 className="section-title">Basic Information</h5>
            
            <Form.Group className="mb-3">
              <Form.Label>Shelter Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter shelter name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Tell us about your shelter..."
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Founded Year</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g., 2020"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.founded_year || ''}
                onChange={(e) => handleInputChange('founded_year', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </Form.Group>
          </div>
          
          {/* Contact Information */}
          <div className="form-section">
            <h5 className="section-title">Contact Information</h5>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="contact@shelter.com"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Website</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://www.shelter.com"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </Form.Group>
          </div>

          {/* Address */}
          <div className="form-section">
            <h5 className="section-title">Location</h5>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <div ref={countrySuggestionsWrapper} style={{ position: 'relative' }}>
                    <Form.Control
                      type="text"
                      placeholder="Country"
                      ref={countryInputRef}
                      value={formData.address_data?.country || ''}
                      onChange={(e) => {
                        const v = e.target.value
                        handleAddressChange('country', v)
                        setActiveField('country')
                        setCountrySearch(v)
                        if (!v || v.length < 1) {
                          setCountrySuggestions([])
                          setShowCountrySuggestions(false)
                        }
                      }}
                      onFocus={() => {
                        setActiveField('country')
                        if (countrySearch && countrySuggestions.length > 0) {
                          setShowCountrySuggestions(true)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!showCountrySuggestions || countrySuggestions.length === 0) return
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          setCountryActiveIndex(i => Math.min(i + 1, countrySuggestions.length - 1))
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          setCountryActiveIndex(i => Math.max(i - 1, 0))
                        } else if (e.key === 'Enter') {
                          e.preventDefault()
                          if (countryActiveIndex >= 0 && countryActiveIndex < countrySuggestions.length) {
                            fillAddressFromFeature(countrySuggestions[countryActiveIndex], 'country')
                          }
                        } else if (e.key === 'Escape') {
                          setShowCountrySuggestions(false)
                        }
                      }}
                    />

                    {activeField === 'country' && showCountrySuggestions && countrySuggestions.length > 0 && (
                      <ListGroup
                        className="position-absolute w-100 shadow-sm"
                        style={{ top: 'calc(100% + 6px)', left: 0, zIndex: 999, maxHeight: '200px', overflowY: 'auto' }}
                      >
                        {countrySuggestions.map((s, idx) => (
                          <ListGroup.Item
                            key={s.id}
                            action
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => fillAddressFromFeature(s, 'country')}
                            active={idx === countryActiveIndex}
                          >
                            {s.place_name}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Region/State</Form.Label>
                  <div ref={regionSuggestionsWrapper} style={{ position: 'relative' }}>
                    <Form.Control
                      type="text"
                      placeholder="Region"
                      ref={regionInputRef}
                      value={formData.address_data?.region || ''}
                      onChange={(e) => {
                        const v = e.target.value
                        handleAddressChange('region', v)
                        setActiveField('region')
                        setRegionSearch(v)
                        if (!v || v.length < 1) {
                          setRegionSuggestions([])
                          setShowRegionSuggestions(false)
                        }
                      }}
                      onFocus={() => {
                        setActiveField('region')
                        if (regionSearch && regionSuggestions.length > 0) {
                          setShowRegionSuggestions(true)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!showRegionSuggestions || regionSuggestions.length === 0) return
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          setRegionActiveIndex(i => Math.min(i + 1, regionSuggestions.length - 1))
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          setRegionActiveIndex(i => Math.max(i - 1, 0))
                        } else if (e.key === 'Enter') {
                          e.preventDefault()
                          if (regionActiveIndex >= 0 && regionActiveIndex < regionSuggestions.length) {
                            fillAddressFromFeature(regionSuggestions[regionActiveIndex], 'region')
                          }
                        } else if (e.key === 'Escape') {
                          setShowRegionSuggestions(false)
                        }
                      }}
                    />

                    {activeField === 'region' && showRegionSuggestions && regionSuggestions.length > 0 && (
                      <ListGroup
                        className="position-absolute w-100 shadow-sm"
                        style={{ top: 'calc(100% + 6px)', left: 0, zIndex: 999, maxHeight: '200px', overflowY: 'auto' }}
                      >
                        {regionSuggestions.map((s, idx) => (
                          <ListGroup.Item
                            key={s.id}
                            action
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => fillAddressFromFeature(s, 'region')}
                            active={idx === regionActiveIndex}
                          >
                            {s.place_name}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <div ref={citySuggestionsWrapper} style={{ position: 'relative' }}>
                    <Form.Control
                      type="text"
                      placeholder="City"
                      ref={cityInputRef}
                      value={formData.address_data?.city || ''}
                      onChange={(e) => {
                        const v = e.target.value
                        handleAddressChange('city', v)
                        setActiveField('city')
                        setCitySearch(v)
                        if (!v || v.length < 1) {
                          setCitySuggestions([])
                          setShowCitySuggestions(false)
                        }
                      }}
                      onFocus={() => {
                        setActiveField('city')
                        if (citySearch && citySuggestions.length > 0) {
                          setShowCitySuggestions(true)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!showCitySuggestions || citySuggestions.length === 0) return
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          setCityActiveIndex(i => Math.min(i + 1, citySuggestions.length - 1))
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          setCityActiveIndex(i => Math.max(i - 1, 0))
                        } else if (e.key === 'Enter') {
                          e.preventDefault()
                          if (cityActiveIndex >= 0 && cityActiveIndex < citySuggestions.length) {
                            fillAddressFromFeature(citySuggestions[cityActiveIndex], 'city')
                          }
                        } else if (e.key === 'Escape') {
                          setShowCitySuggestions(false)
                        }
                      }}
                    />

                    {activeField === 'city' && showCitySuggestions && citySuggestions.length > 0 && (
                      <ListGroup
                        className="position-absolute w-100 shadow-sm"
                        style={{ top: 'calc(100% + 6px)', left: 0, zIndex: 999, maxHeight: '200px', overflowY: 'auto' }}
                      >
                        {citySuggestions.map((s, idx) => (
                          <ListGroup.Item
                            key={s.id}
                            action
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => fillAddressFromFeature(s, 'city')}
                            active={idx === cityActiveIndex}
                          >
                            {s.place_name}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., 90001"
                    value={formData.address_data?.postal_code || ''}
                    onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Street and building</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., 123 Main Street"
                value={formData.address_data?.street || ''}
                onChange={(e) => handleAddressChange('street', e.target.value)}
              />
            </Form.Group>
          </div>

          {/* Capacity */}
          <div className="form-section">
            <h5 className="section-title">Capacity</h5>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Capacity</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="e.g., 100"
                    value={formData.capacity || 0}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Animals</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="e.g., 50"
                    value={formData.current_animals || 0}
                    onChange={(e) => handleInputChange('current_animals', parseInt(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Images */}
          <div className="form-section">
            <h5 className="section-title">Images</h5>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Logo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  {logoPreview && (
                    <div className="image-preview mt-2">
                      <img src={logoPreview} alt="Logo preview" />
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cover Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                  />
                  {coverPreview && (
                    <div className="image-preview mt-2">
                      <img src={coverPreview} alt="Cover preview" />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Social Media */}
          <div className="form-section">
            <h5 className="section-title">Social Media (Optional)</h5>
            
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-facebook me-2"></i>
                Facebook URL
              </Form.Label>
              <Form.Control
                type="url"
                placeholder="https://facebook.com/your-shelter"
                value={formData.facebook_url || ''}
                onChange={(e) => handleInputChange('facebook_url', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-instagram me-2"></i>
                Instagram URL
              </Form.Label>
              <Form.Control
                type="url"
                placeholder="https://instagram.com/your-shelter"
                value={formData.instagram_url || ''}
                onChange={(e) => handleInputChange('instagram_url', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-twitter-x me-2"></i>
                Twitter/X URL
              </Form.Label>
              <Form.Control
                type="url"
                placeholder="https://twitter.com/your-shelter"
                value={formData.twitter_url || ''}
                onChange={(e) => handleInputChange('twitter_url', e.target.value)}
              />
            </Form.Group>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Create Shelter
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
