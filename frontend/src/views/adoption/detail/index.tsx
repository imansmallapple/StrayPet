// src/views/adoption/detail/index.tsx
import { useParams, useNavigate } from 'react-router-dom'
// no hooks imported from react directly in this file anymore
import { useRequest } from 'ahooks'
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Spinner,
} from 'react-bootstrap'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import './index.scss'
// Use local MapboxMap implementation for interactive map
import SafeHtml from '@/components/SafeHtml'
import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
// Local Leaflet dependency for IE/WebGL fallback
import L, { type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
// Fix Leaflet marker icon paths in bundled environments
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

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
  shelter_website?: string
}

export default function AdoptDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

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

  // Prepare photo data
  const allPhotos = data?.photos && data.photos.length > 0 
    ? data.photos 
    : data?.photo 
      ? [data.photo] 
      : ['/images/pet-placeholder.jpg']
  
  const hasMultiplePhotos = allPhotos.length > 1

  // Keyboard navigation for photos
  useEffect(() => {
    if (!hasMultiplePhotos) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentPhotoIndex(prev => 
          prev === 0 ? allPhotos.length - 1 : prev - 1
        )
      } else if (e.key === 'ArrowRight') {
        setCurrentPhotoIndex(prev => 
          prev === allPhotos.length - 1 ? 0 : prev + 1
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasMultiplePhotos, allPhotos.length])

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
  const currentPhoto = allPhotos[currentPhotoIndex] || allPhotos[0]

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex(prev => 
      prev === 0 ? allPhotos.length - 1 : prev - 1
    )
  }

  const handleNextPhoto = () => {
    setCurrentPhotoIndex(prev => 
      prev === allPhotos.length - 1 ? 0 : prev + 1
    )
  }

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
    if (sex === 'female') return 'Girl'
    return 'Unknown'
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
  // Prefer the `address_display` string returned by backend pet serializer (PetListSerializer)
  // Fallbacks: `pet.address` (id or string) -> `pet.city` -> empty
  const _rawAddr = (pet.address_display || pet.address || pet.city || '').trim()
  const address = (_rawAddr === '-' || _rawAddr === '—') ? '' : _rawAddr
  

  

  return (
    <div className="pet-detail-page">
      {/* 顶部绿色区域 */}
      <div className="pet-detail-hero">
        <Container>
          <div className="pet-detail-hero-text">
            <div className="muted">My name is</div>
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
                <img src={currentPhoto} alt={pet.name} />
                {pet.status && (
                  <Badge bg="success" className="pet-detail-status-pill">
                    {pet.status}
                  </Badge>
                )}
                {hasMultiplePhotos && (
                  <>
                    <div className="pet-detail-photo-count">
                      {currentPhotoIndex + 1} / {allPhotos.length}
                    </div>
                    <button 
                      className="photo-nav-btn photo-nav-prev"
                      onClick={handlePrevPhoto}
                      type="button"
                      aria-label="Previous photo"
                    >
                      ‹
                    </button>
                    <button 
                      className="photo-nav-btn photo-nav-next"
                      onClick={handleNextPhoto}
                      type="button"
                      aria-label="Next photo"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              <div className="pet-detail-table-wrapper">
                <Table borderless size="sm" className="pet-detail-table">
                  <tbody>
                    <tr>
                      <th>Name:</th>
                      <td>{pet.name}</td>
                    </tr>
                    <tr>
                      <th>Status:</th>
                      <td><Badge bg="success" className="status-badge">{pet.status || 'Available'}</Badge></td>
                    </tr>
                    <tr>
                      <th>Species:</th>
                      <td>{(pet.species ?? 'Pet').toString()}</td>
                    </tr>
                    <tr>
                      <th>Breed:</th>
                      <td>{pet.breed || 'Mixed'}</td>
                    </tr>
                    <tr>
                      <th>Sex:</th>
                      <td>{sexText}</td>
                    </tr>
                    <tr>
                      <th>Age:</th>
                      <td>{ageText}</td>
                    </tr>
                    <tr>
                      <th>City/Address:</th>
                      <td className="address-cell">{(pet.address_display && pet.address_display !== '-' && pet.address_display !== '—') ? pet.address_display : (pet.city || pet.shelter_city || '—')}</td>
                    </tr>
                    {pet.contact_phone && (
                      <tr>
                        <th>Contact Phone:</th>
                        <td>{pet.contact_phone}</td>
                      </tr>
                    )}
                    <tr>
                      <th>Added:</th>
                      <td>{pet.add_date?.slice(0, 10) || '—'}</td>
                    </tr>
                    <tr>
                      <th>Updated:</th>
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

          {/* 右侧：救助站卡片 */}
          <Col lg={4}>
            <Card className="pet-detail-shelter-card">
              <Card.Body>
                <div className="shelter-address">
                  {pet.shelter_address || ((pet.address_display && pet.address_display !== '-' && pet.address_display !== '—') ? pet.address_display : 'No address available')}
                </div>

                {/* Interactive map with Google Maps link */}
                <ExternalMapPreview
                  address={address}
                  lat={typeof (pet as any)?.address_lat === 'number' ? (pet as any).address_lat : undefined}
                  lon={typeof (pet as any)?.address_lon === 'number' ? (pet as any).address_lon : undefined}
                />

                <div className="shelter-actions">
                  <Button
                    type="button"
                    variant="outline-warning"
                    className="w-100"
                    onClick={() => navigate(`/adopt/${pet.id}/apply`)}
                  >
                    📝 Ask about this pet
                  </Button>
                </div>

                {pet.shelter_website && (
                  <div className="shelter-footer">
                    <a
                      href={pet.shelter_website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit shelter website
                    </a>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

type MapboxMapProps = {
  address?: string | undefined
  lon?: number | undefined
  lat?: number | undefined
  className?: string | undefined
  width?: string | number | undefined
  height?: number | undefined
}

function MapboxMap({ address, lon, lat, className, width='100%', height=220 }: MapboxMapProps) {
  const ref = useRef<HTMLDivElement|null>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | L.Map | null>(null)
  const initializedRef = useRef(false)
  const showStaticFallbackRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return // Prevent re-initialization
    
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!ref.current) return

    if (!token) {
      console.warn('Mapbox token missing: set VITE_MAPBOX_TOKEN')
      showStaticFallbackRef.current = true
      initializedRef.current = true
      return
    }
    mapboxgl.accessToken = token

    // IE 检测：IE11 及以下通过 document.documentMode 或 UA 中的 Trident/MSIE
    const isIE = ((document as any).documentMode) || /MSIE|Trident/.test(navigator.userAgent)
    if (isIE) {
      const centerLatLng: LatLngTuple = (typeof lon === 'number' && typeof lat === 'number')
        ? [lat as number, lon as number]
        : [0, 0]
      const leafletMap = L.map(ref.current!, { zoomControl: true })
      leafletMap.setView(centerLatLng, (typeof lon === 'number' && typeof lat === 'number') ? 12 : 1)
      const tileUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${token}`
      const attribution = '© Mapbox © OpenStreetMap'
      L.tileLayer(tileUrl, { tileSize: 256, attribution, crossOrigin: true }).addTo(leafletMap)
      if (typeof lon === 'number' && typeof lat === 'number') {
        const defaultIcon = L.icon({ iconUrl: markerIconUrl, iconRetinaUrl: markerIcon2xUrl, shadowUrl: markerShadowUrl })
        L.marker(centerLatLng, { icon: defaultIcon }).addTo(leafletMap)
      }
      mapInstanceRef.current = leafletMap
      initializedRef.current = true
      return () => { 
        if (mapInstanceRef.current && 'remove' in mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      }
    }

    const supports = typeof (mapboxgl as any).supported === 'function'
      ? (mapboxgl as any).supported()
      : !!document.createElement('canvas').getContext('webgl')

    if (!supports) {
      // WebGL 不支持（非 IE 的老设备等）：使用本地 Leaflet 交互兜底
      console.warn('Mapbox GL not supported; using local Leaflet tiles fallback')
      const centerLatLng: LatLngTuple = (typeof lon === 'number' && typeof lat === 'number')
        ? [lat as number, lon as number]
        : [0, 0]
      const leafletMap = L.map(ref.current!, { zoomControl: true })
      leafletMap.setView(centerLatLng, (typeof lon === 'number' && typeof lat === 'number') ? 12 : 1)
      const tileUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${token}`
      const attribution = '© Mapbox © OpenStreetMap'
      L.tileLayer(tileUrl, { tileSize: 256, attribution, crossOrigin: true }).addTo(leafletMap)
      if (typeof lon === 'number' && typeof lat === 'number') {
        const defaultIcon = L.icon({ iconUrl: markerIconUrl, iconRetinaUrl: markerIcon2xUrl, shadowUrl: markerShadowUrl })
        L.marker(centerLatLng, { icon: defaultIcon }).addTo(leafletMap)
      }
      mapInstanceRef.current = leafletMap
      initializedRef.current = true
      return () => { 
        if (mapInstanceRef.current && 'remove' in mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      }
    }

    const center = (typeof lon === 'number' && typeof lat === 'number')
      ? [lon, lat] as [number, number]
      : undefined

    const map = new mapboxgl.Map({
      container: ref.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center ?? [0, 0],
      zoom: center ? 12 : 1,
      interactive: true,
    })
    map.addControl(new mapboxgl.NavigationControl())
    map.on('load', () => {
      map.resize()
    })
    if (center) new mapboxgl.Marker().setLngLat(center).addTo(map)

    mapInstanceRef.current = map
    initializedRef.current = true
    return () => {
      if (mapInstanceRef.current && 'remove' in mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lon])

  // Static image fallback for missing token
  if (showStaticFallbackRef.current) {
    const canStatic = typeof lon === 'number' && typeof lat === 'number'
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (canStatic && token) {
      const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${lon},${lat})/${lon},${lat},12,0/${Math.max(300, typeof width === 'number' ? width : 600)}x${height}?access_token=${token}`
      return (
        <img
          src={url}
          alt={address || 'Location'}
          className={className}
          style={{ width, height, borderRadius: 12, objectFit: 'cover' }}
        />
      )
    }
  }

  return <div ref={ref} className={className} style={{ width, height }} />
}

// Interactive map component with Google Maps external link
type ExternalMapPreviewProps = {
  address?: string | undefined
  lat?: number | undefined
  lon?: number | undefined
}

function ExternalMapPreview({ address, lat, lon }: ExternalMapPreviewProps) {
  const hasCoords = typeof lat === 'number' && typeof lon === 'number'
  const googleLink = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    : (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null)
  
  return (
    <div className="external-map-card">
      <div className="ext-map-header">
        {googleLink && (
          <a href={googleLink} target="_blank" rel="noopener noreferrer" className="ext-map-link">View larger map</a>
        )}
      </div>
      <div className="ext-map-interactive">
        {hasCoords ? (
          <MapboxMap
            address={address}
            lat={lat}
            lon={lon}
            className="mapbox-map"
            width="100%"
            height={280}
          />
        ) : (
          <div className="ext-map-thumb-placeholder">No map preview</div>
        )}
      </div>
    </div>
  )
}