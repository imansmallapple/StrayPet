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
import { useEffect, useRef } from 'react'
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
  status?: string          // e.g. "Looking for a home"
  breed?: string
  size?: string            // small / medium / large
  activity?: string        // e.g. "Couch Potatoes"
  added_at?: string
  updated_at?: string

  shelter_name?: string
  shelter_address?: string
  shelter_city?: string
  shelter_phone?: string
  shelter_website?: string

  description_long?: string
  traits?: string[]
  photos?: string[]
}

export default function AdoptDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

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
  const mainPhoto =
    pet.photo || pet.photos?.[0] || '/images/pet-placeholder.jpg'

  const ageText = (() => {
    if (pet.age_years || pet.age_months) {
      const yy = pet.age_years ? `${pet.age_years}y` : ''
      const mm = pet.age_months ? `${pet.age_months}m` : ''
      return [yy, mm].filter(Boolean).join(' ')
    }
    return 'Age N/A'
  })()

  const traits = pet.traits ?? []
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
                <img src={mainPhoto} alt={pet.name} />
                {pet.status && (
                  <Badge bg="success" className="pet-detail-status-pill">
                    {pet.status}
                  </Badge>
                )}
                {pet.photos && pet.photos.length > 1 && (
                  <div className="pet-detail-photo-count">
                    {pet.photos.length} photos
                  </div>
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
                      <th>City/Address:</th>
                      <td>{(pet.address_display && pet.address_display !== '-' && pet.address_display !== '—') ? pet.address_display : (pet.city || pet.shelter_city || '—')}</td>
                    </tr>
                    <tr>
                      <th>Status:</th>
                      <td>{pet.status || 'Looking for a home'}</td>
                    </tr>
                    <tr>
                      <th>Species:</th>
                      <td>{(pet.species ?? 'Pet').toString()}</td>
                    </tr>
                    <tr>
                      <th>Sex:</th>
                      <td>{pet.sex || 'Unknown'}</td>
                    </tr>
                    <tr>
                      <th>Age:</th>
                      <td>{ageText}</td>
                    </tr>
                    <tr>
                      <th>Size:</th>
                      <td>{pet.size || '—'}</td>
                    </tr>
                    <tr>
                      <th>Breed:</th>
                      <td>{pet.breed || 'Mixed'}</td>
                    </tr>
                    <tr>
                      <th>Activity:</th>
                      <td>{pet.activity || 'Calm'}</td>
                    </tr>
                    <tr>
                      <th>Added:</th>
                      <td>{pet.added_at?.slice(0, 10) || '—'}</td>
                    </tr>
                    <tr>
                      <th>Updated:</th>
                      <td>{pet.updated_at?.slice(0, 10) || '—'}</td>
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
                <div className="shelter-name">
                  {pet.shelter_name || (typeof pet.created_by === 'string' ? pet.created_by : 'Unknown shelter')}
                </div>
                <div className="shelter-sub">
                  {pet.shelter_city || pet.city || ''}
                </div>
                <div className="shelter-address">
                  {pet.shelter_address || ((pet.address_display && pet.address_display !== '-' && pet.address_display !== '—') ? pet.address_display : 'No address available')}
                </div>

                {/* 地图占位，后面可以换成真实地图组件 */}
                <div className="shelter-map-placeholder">
                  {address ? (
                    <MapboxMap
                      address={address}
                      lon={typeof (pet as any)?.address_lon === 'number' ? (pet as any).address_lon : undefined}
                      lat={typeof (pet as any)?.address_lat === 'number' ? (pet as any).address_lat : undefined}
                      className="mapbox-map"
                      width="100%"
                      height={220}
                    />
                  ) : (
                    <div className="map-unavailable muted">No address to show on map</div>
                  )}
                </div>

                <div className="shelter-actions">
                  {pet.shelter_phone && (
                    <Button
                      type="button"
                      variant="success"
                      className="w-100 mb-2"
                      as="a"
                      href={`tel:${pet.shelter_phone}`}
                    >
                      📞 Call shelter
                    </Button>
                  )}

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
  address?: string
  lon?: number
  lat?: number
  className?: string
  width?: string | number
  height?: number
}

function MapboxMap({ address, lon, lat, className, width='100%', height=220 }: MapboxMapProps) {
  const ref = useRef<HTMLDivElement|null>(null)
  const supportsRef = useRef<boolean>(true)
  const hasTokenRef = useRef<boolean>(true)

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!ref.current) return
    if (!token) {
      // Token 缺失时，不直接返回；允许走 Leaflet + OSM 交互或静态兜底
      console.warn('Mapbox token missing: set VITE_MAPBOX_TOKEN')
      hasTokenRef.current = false
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
      const tileUrl = token
        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${token}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      const attribution = token ? '© Mapbox © OpenStreetMap' : '© OpenStreetMap contributors'
      L.tileLayer(tileUrl, { tileSize: 256, attribution, crossOrigin: true }).addTo(leafletMap)
      if (typeof lon === 'number' && typeof lat === 'number') {
        const defaultIcon = L.icon({ iconUrl: markerIconUrl, iconRetinaUrl: markerIcon2xUrl, shadowUrl: markerShadowUrl })
        L.marker(centerLatLng, { icon: defaultIcon }).addTo(leafletMap)
      }
      return () => { leafletMap.remove() }
    }

    const supports = typeof (mapboxgl as any).supported === 'function'
      ? (mapboxgl as any).supported()
      : !!document.createElement('canvas').getContext('webgl')

    if (!supports) {
      // WebGL 不支持（非 IE 的老设备等）：使用本地 Leaflet 交互兜底
      console.warn('Mapbox GL not supported; using local Leaflet tiles fallback')
      supportsRef.current = false
      const centerLatLng: LatLngTuple = (typeof lon === 'number' && typeof lat === 'number')
        ? [lat as number, lon as number]
        : [0, 0]
      const leafletMap = L.map(ref.current!, { zoomControl: true })
      leafletMap.setView(centerLatLng, (typeof lon === 'number' && typeof lat === 'number') ? 12 : 1)
      const tileUrl = token
        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${token}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      const attribution = token ? '© Mapbox © OpenStreetMap' : '© OpenStreetMap contributors'
      L.tileLayer(tileUrl, { tileSize: 256, attribution, crossOrigin: true }).addTo(leafletMap)
      if (typeof lon === 'number' && typeof lat === 'number') {
        const defaultIcon = L.icon({ iconUrl: markerIconUrl, iconRetinaUrl: markerIcon2xUrl, shadowUrl: markerShadowUrl })
        L.marker(centerLatLng, { icon: defaultIcon }).addTo(leafletMap)
      }
      return () => { leafletMap.remove() }
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

    return () => map.remove()
  }, [address, lon, lat])

  // Static image fallback for missing token or unsupported WebGL
  const canStatic = typeof lon === 'number' && typeof lat === 'number'
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if ((!hasTokenRef.current || !supportsRef.current) && canStatic && token) {
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

  return <div ref={ref} className={className} style={{ width, height }} />
}