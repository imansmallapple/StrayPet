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
import MapboxMap from '@/components/MapboxMap'
import SafeHtml from '@/components/SafeHtml'

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
                    <MapboxMap address={address} lon={(pet as any)?.address_lon} lat={(pet as any)?.address_lat} />
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
