// src/views/adoption/detail/index.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useRequest } from 'ahooks'
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Spinner,
} from 'react-bootstrap'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import { shelterApi, type Shelter } from '@/services/modules/shelter'
import './index.scss'
// Use local MapboxMap implementation for interactive map
import SafeHtml from '@/components/SafeHtml'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

type PetDetail = Pet & {
  city?: string
  status?: string
  breed?: string
  description_long?: string
  traits?: string[]
  photos?: string[]
  
  // Health and traits from backend
  dewormed?: boolean
  vaccinated?: boolean
  microchipped?: boolean
  child_friendly?: boolean
  trained?: boolean
  loves_play?: boolean
  loves_walks?: boolean
  good_with_dogs?: boolean
  good_with_cats?: boolean
  affectionate?: boolean
  needs_attention?: boolean
  sterilized?: boolean
  contact_phone?: string
  
  shelter_name?: string
  shelter_address?: string
  shelter_city?: string
  shelter_phone?: string
  shelter_email?: string
  shelter_website?: string
  shelter_description?: string
  shelter_current_animals?: number
  shelter_capacity?: number
  shelter_occupancy_rate?: number
  shelter_id?: number
  shelter?: {
    id?: number
    name?: string
    description?: string
  } | number
}

export default function AdoptDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [shelter, setShelter] = useState<Shelter | null>(null)

  const { data, loading } = useRequest(
    () =>
      adoptApi
        .detail(Number(id))
        .then(res => res.data as PetDetail),
    {
      ready: !!id,
      refreshDeps: [id],
    },
  )

  // 当 pet 数据加载完成后，根据 shelter_id 获取 shelter 详情
  useEffect(() => {
    if (data) {
      // 调试日志：查看 pet 数据中的 shelter 相关字段
      console.warn('=== Pet data loaded ===')
      console.warn('Full pet object keys:', Object.keys(data))
      console.warn('Shelter fields:', {
        shelter_id: (data as any).shelter_id,
        shelter_name: (data as any).shelter_name,
        shelter_description: (data as any).shelter_description,
        shelter_phone: (data as any).shelter_phone,
        shelter_email: (data as any).shelter_email,
        shelter_address: (data as any).shelter_address,
        shelter_website: (data as any).shelter_website,
      })
      console.warn('Full data:', data)
      
      // 尝试多种方式获取 shelter_id
      const shelterId = (data as any).shelter_id 
        || (data as any).shelter?.id 
        || (data as any).shelter
      
      console.warn('Detected shelterId:', shelterId)
      
      if (shelterId && typeof shelterId === 'number') {
        console.warn('Fetching shelter details for shelterId:', shelterId)
        shelterApi
          .detail(shelterId)
          .then(res => {
            console.warn('=== Shelter data loaded ===')
            console.warn('Shelter data:', res.data)
            setShelter(res.data)
          })
          .catch(err => console.error('Failed to load shelter details:', err))
      } else {
        console.warn('No valid shelterId found')
      }
    }
  }, [data])

  // Prepare photo data
  const allPhotos = data?.photos && data.photos.length > 0 
    ? data.photos 
    : data?.photo 
      ? [data.photo] 
      : ['/images/pet-placeholder.jpg']

  if (!id) {
    return <div className="pet-detail-empty">Invalid pet id</div>
  }

  if (loading || !data) {
    return (
      <div className="pet-detail-loading">
        <Spinner animation="border" role="status" />
      </div>
    )
  }

  const pet = data

  const ageText = (() => {
    const y = pet.age_years || 0
    const m = pet.age_months || 0
    
    // Determine age label based on form mapping
    if (y === 0 && m <= 3) {
      return 'Baby (0\u20133 months)'
    } else if (y === 0 && m <= 6) {
      return 'Very young (3\u20136 months)'
    } else if (y === 1 && m === 0) {
      return 'Young / Junior (6\u201312 months)'
    } else if (y >= 1 && y < 7) {
      return 'Adult (1\u20137 years)'
    } else if (y >= 7) {
      return 'Senior (7+ years)'
    }
    
    return 'Age N/A'
  })()

  // Map sex to Boy/Girl
  const sexText = (() => {
    const sex = (pet.sex || '').toLowerCase()
    if (sex === 'male') return 'Boy'
    return 'Girl'
  })()

  // Build traits array from backend boolean fields
  const healthTraits: string[] = []
  if (pet.sterilized) healthTraits.push('Sterilized/Neutered')
  if (pet.vaccinated) healthTraits.push('Vaccinated')
  if (pet.dewormed) healthTraits.push('Dewormed')
  if (pet.microchipped) healthTraits.push('Microchipped')
  if (pet.child_friendly) healthTraits.push('Good with children')
  if (pet.trained) healthTraits.push('House trained')
  if (pet.loves_play) healthTraits.push('Loves to play')
  if (pet.loves_walks) healthTraits.push('Loves walks')
  if (pet.good_with_dogs) healthTraits.push('Good with other dogs')
  if (pet.good_with_cats) healthTraits.push('Good with cats')
  if (pet.affectionate) healthTraits.push('Affectionate')
  if (pet.needs_attention) healthTraits.push('Needs lots of attention')

  const traits = pet.traits && pet.traits.length > 0 ? pet.traits : healthTraits

  return (
    <div className="pet-detail-page">
      {/* 顶部绿色区域 */}
      <div className="pet-detail-hero">
        <Container>
          <div className="pet-detail-hero-text">
            <p className="muted">🐾 Pet Details</p>
            <h1>{pet.name}</h1>
          </div>
        </Container>
      </div>

      <Container className="pet-detail-content">
        <Row className="g-4 align-items-start">
          {/* 左侧：大图 + 基本信息表格 + 描述 + trait 列表 */}
          <Col lg={8}>
            <Card className="pet-detail-main-card">
              <div className="pet-detail-photo-wrapper">
                {allPhotos.length > 0 && (
                  <div className="pet-detail-photos-grid">
                    {allPhotos.map((photo) => (
                      <div key={photo} className="pet-photo-item">
                        <img src={photo} alt={`${pet.name}`} />
                        {allPhotos.indexOf(photo) === 0 && (
                          <div className="pet-photo-badge">
                            {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {pet.status && (
                  <Badge bg="success" className="pet-detail-status-pill">
                    {pet.status}
                  </Badge>
                )}
              </div>

              <div className="pet-detail-table-wrapper">
                <Table borderless size="sm" className="pet-detail-table">
                  <tbody>
                    <tr>
                      <th>Name</th>
                      <td>{pet.name}</td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td><Badge bg="success" className="status-badge">{pet.status || 'Available'}</Badge></td>
                    </tr>
                    <tr>
                      <th>Species</th>
                      <td>{(pet.species ?? 'Pet').toString()}</td>
                    </tr>
                    <tr>
                      <th>Breed</th>
                      <td>{pet.breed || 'Mixed'}</td>
                    </tr>
                    <tr>
                      <th>Sex</th>
                      <td>{sexText}</td>
                    </tr>
                    <tr>
                      <th>Age</th>
                      <td>{ageText}</td>
                    </tr>
                    {pet.size && (
                      <tr>
                        <th>Size</th>
                        <td>{pet.size}</td>
                      </tr>
                    )}
                    <tr>
                      <th>City/Address</th>
                      <td className="address-cell">{(pet.address_display && pet.address_display !== '-' && pet.address_display !== '—') ? pet.address_display : (pet.city || pet.shelter_city || '—')}</td>
                    </tr>
                    {pet.contact_phone && (
                      <tr>
                        <th>Contact Phone</th>
                        <td>{pet.contact_phone}</td>
                      </tr>
                    )}
                    <tr>
                      <th>Added</th>
                      <td>{pet.add_date?.slice(0, 10) || '—'}</td>
                    </tr>
                    <tr>
                      <th>Updated</th>
                      <td>{pet.pub_date?.slice(0, 10) || '—'}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              <div className="pet-detail-description">
                <SafeHtml html={pet.description_long || pet.description || 'No description yet.'} />
              </div>

              {traits.length > 0 && (
                <div className="pet-detail-traits">
                  {traits.map(t => (
                    <div key={t} className="trait-item">
                      <span className="bullet" aria-hidden>
                        ✓
                      </span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>

          {/* 右侧：收容所卡片 */}
          <Col lg={4}>
            <ShelterCard pet={pet} navigate={navigate} shelter={shelter} />
          </Col>
        </Row>
      </Container>
    </div>
  )
}

// Shelter Card Component
function ShelterMapPreview({ lon, lat }: { lon: number; lat: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const initAttemptedRef = useRef(false)

  const handleMapClick = useCallback(() => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    window.open(googleMapsUrl, '_blank')
  }, [lat, lon])

  useEffect(() => {
    if (!ref.current || initAttemptedRef.current) return
    
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      console.warn('Mapbox token missing: set VITE_MAPBOX_TOKEN')
      return
    }

    // Check WebGL support before creating map
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      console.warn('WebGL not supported, will use static image fallback')
      return
    }

    initAttemptedRef.current = true

    try {
      mapboxgl.accessToken = token

      const map = new mapboxgl.Map({
        container: ref.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lon, lat],
        zoom: 13,
        interactive: true,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      new mapboxgl.Marker().setLngLat([lon, lat]).addTo(map)
      map.on('click', handleMapClick)
      
      mapInstanceRef.current = map
    } catch (error) {
      console.error('Failed to initialize Mapbox map, will use static fallback:', error)
      initAttemptedRef.current = false
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.warn('Error removing map:', e)
        }
        mapInstanceRef.current = null
      }
    }
  }, [lat, lon, handleMapClick])

  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if (!token) {
    return (
      <div 
        style={{ 
          width: '100%',
          height: '180px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          color: '#6c757d'
        }}
      >
        <i className="bi bi-map fs-3"></i>
      </div>
    )
  }

  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+7c3aed(${lon},${lat})/${lon},${lat},13,0/400x180@2x?access_token=${token}`
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '180px', cursor: 'pointer' }} onClick={handleMapClick}>
      {/* Static map image always shown as fallback */}
      <img 
        src={staticMapUrl} 
        alt="Map location"
        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
      />
      
      {/* Interactive map container */}
      <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
      
      {/* Google Maps 图标提示 */}
      <div 
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '4px 8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '12px',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <i className="bi bi-box-arrow-up-right"></i>
        <span>View in Maps</span>
      </div>
    </div>
  )
}

type ShelterCardProps = {
  pet: PetDetail
  navigate: ReturnType<typeof useNavigate>
  shelter?: Shelter | null
}

function ShelterCard({ pet, navigate, shelter }: ShelterCardProps) {
  const petData = pet as PetDetail
  const hasCoords = typeof (pet as any)?.address_lat === 'number' && typeof (pet as any)?.address_lon === 'number'
    || (shelter?.latitude && shelter?.longitude)

  return (
    <article className="shelter-card">
      {/* Map or Cover Image */}
      {hasCoords ? (
        <div className="shelter-map">
          <ShelterMapPreview 
            lon={(shelter?.longitude ?? (pet as any).address_lon) as number} 
            lat={(shelter?.latitude ?? (pet as any).address_lat) as number} 
          />
        </div>
      ) : (
        <div className="cover-placeholder">
          <i className="bi bi-house-heart"></i>
        </div>
      )}

      <div className="shelter-content">
        {/* Logo and Name */}
        <div className="shelter-header">
          {shelter?.logo_url ? (
            <img 
              src={shelter.logo_url} 
              alt={`${shelter.name} logo`}
              className="shelter-logo"
            />
          ) : (
            <div className="shelter-logo-placeholder">
              <i className="bi bi-building"></i>
            </div>
          )}
          <div className="header-info">
            <h3 className="shelter-name">{shelter?.name || petData.shelter_name || 'Local Animal Shelter'}</h3>
            <p className="address">
              <i className="bi bi-geo-alt-fill"></i>
              {shelter ? 
                [shelter.street, shelter.city, shelter.region].filter(Boolean).join(', ') || 'Address not available'
                : (petData.shelter_address || petData.shelter_city || petData.city || 'Address not available')
              }
            </p>
          </div>
        </div>

        {/* Description */}
        {(shelter?.description || petData.shelter_description) && (
          <p className="description">
            {(shelter?.description || petData.shelter_description || '').length > 100
              ? `${(shelter?.description || petData.shelter_description || '').substring(0, 100)}...`
              : (shelter?.description || petData.shelter_description || '')}
          </p>
        )}

        {/* Capacity Info */}
        <div className="capacity-section">
          <div className="capacity-header">
            <span>Capacity</span>
            <span className="occupancy-badge">
              {shelter?.occupancy_rate !== undefined 
                ? `${Math.round(shelter.occupancy_rate)}%`
                : (petData.shelter_occupancy_rate !== undefined 
                  ? `${Math.round(petData.shelter_occupancy_rate)}%`
                  : (petData.status || 'Available'))
              }
            </span>
          </div>
          <div className="capacity-bar">
            <div 
              className="capacity-fill"
              style={{ width: `${Math.min(shelter?.occupancy_rate ?? petData.shelter_occupancy_rate ?? 65, 100)}%` }}
            ></div>
          </div>
          <p className="capacity-text">
            {shelter?.current_animals !== undefined && shelter?.capacity !== undefined
              ? `${shelter.current_animals} / ${shelter.capacity} animals`
              : (petData.shelter_current_animals !== undefined && petData.shelter_capacity !== undefined
                ? `${petData.shelter_current_animals} / ${petData.shelter_capacity} animals`
                : 'Based on this shelter\'s typical occupancy')
            }
          </p>
        </div>

        {/* Contact Info */}
        <div className="contact-section">
          {(shelter?.phone || petData.shelter_phone) && (
            <div className="contact-item">
              <i className="bi bi-telephone"></i>
              <small>{shelter?.phone || petData.shelter_phone}</small>
            </div>
          )}
          {!shelter && petData.contact_phone && !petData.shelter_phone && (
            <div className="contact-item">
              <i className="bi bi-telephone"></i>
              <small>{petData.contact_phone}</small>
            </div>
          )}
          {shelter?.email && (
            <div className="contact-item">
              <i className="bi bi-envelope"></i>
              <small>{shelter.email}</small>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/adopt/${pet.id}/apply`)}
          >
            💬 Ask about this pet
          </button>
          {(shelter?.email) && (
            <a href={`mailto:${shelter.email}`} className="btn btn-secondary">
              <i className="bi bi-envelope"></i>
              Contact
            </a>
          )}
        </div>
      </div>
    </article>
  )
}