// src/views/lost/detail/index.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap'
import { lostApi, type LostPet } from '@/services/modules/lost'
import './index.scss'

export default function LostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<LostPet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await lostApi.retrieve(Number(id))
        if (!alive) return
        setItem(data)
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load lost pet details')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [id])

  if (loading) {
    return (
      <Container className="lost-detail-page">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading pet details...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="lost-detail-page">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/lost')}>
            ← Back to Lost Pets
          </Button>
        </Alert>
      </Container>
    )
  }

  if (!item) return null

  const title = item.pet_name || `${item.species}${item.breed ? ' · ' + item.breed : ''}`
  const imgSrc = item.photo_url ?? item.photo ?? undefined
  
  const getStatusBadge = () => {
    switch (item.status) {
      case 'found':
        return <Badge bg="success" className="status-badge">Found ✅</Badge>
      case 'closed':
        return <Badge bg="secondary" className="status-badge">Closed</Badge>
      case 'open':
      default:
        return <Badge bg="warning" text="dark" className="status-badge">Lost 🔍</Badge>
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAddress = () => {
    if (typeof item.address === 'string') return item.address
    if (typeof item.address === 'object' && item.address !== null) {
      return (item.address as any).full || '—'
    }
    // Build from individual fields
    const parts = []
    if (item.city) parts.push(item.city)
    if (item.region) parts.push(item.region)
    if (item.country) parts.push(item.country)
    return parts.length > 0 ? parts.join(', ') : '—'
  }

  return (
    <Container className="lost-detail-page">
      <div className="header-section">
        <Button 
          variant="outline-secondary" 
          className="back-btn"
          onClick={() => navigate('/lost')}
        >
          ← Back to Lost Pets
        </Button>
      </div>

      <Row className="detail-content">
        <Col lg={7} className="mb-4">
          <Card className="image-card">
            <div className="image-container">
              {imgSrc ? (
                <img src={imgSrc} alt={title} className="pet-image" />
              ) : (
                <div className="no-image-placeholder">
                  <span className="no-image-icon">📷</span>
                  <p>No Photo Available</p>
                </div>
              )}
            </div>
          </Card>

          {item.description && (
            <Card className="description-card mt-4">
              <Card.Body>
                <h5 className="section-title">📝 Description</h5>
                <p className="description-text">{item.description}</p>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={5}>
          <Card className="info-card">
            <Card.Body>
              <div className="title-section">
                <h2 className="pet-title">{title}</h2>
                {getStatusBadge()}
              </div>

              <div className="info-section">
                <h5 className="section-title">🐾 Pet Information</h5>
                
                <InfoRow label="Species" value={item.species || '—'} />
                {item.breed && <InfoRow label="Breed" value={item.breed} />}
                {item.color && <InfoRow label="Color" value={item.color} />}
                <InfoRow 
                  label="Gender" 
                  value={item.sex === 'male' ? 'Male' : item.sex === 'female' ? 'Female' : '—'} 
                />
                {item.size && <InfoRow label="Size" value={item.size} />}
              </div>

              <div className="info-section">
                <h5 className="section-title">📍 Location & Time</h5>
                
                <InfoRow label="Location" value={getAddress()} />
                <InfoRow 
                  label="Lost Time" 
                  value={formatDate(item.lost_time)} 
                />
                {item.reward && (
                  <InfoRow 
                    label="Reward" 
                    value={`$${item.reward}`}
                    highlight
                  />
                )}
              </div>

              <div className="info-section">
                <h5 className="section-title">👤 Reporter Information</h5>
                
                {item.reporter_username && (
                  <InfoRow label="Reporter" value={item.reporter_username} />
                )}
                {item.contact_phone && (
                  <InfoRow label="Phone" value={item.contact_phone} />
                )}
                {item.contact_email && (
                  <InfoRow label="Email" value={item.contact_email} />
                )}
                <InfoRow 
                  label="Posted" 
                  value={formatDate(item.created_at)} 
                />
              </div>

              {item.status === 'open' && (
                <div className="action-section">
                  <Button variant="primary" className="contact-btn w-100" size="lg">
                    📞 Contact Reporter
                  </Button>
                  <p className="help-text">
                    If you have any information about this pet, please contact the reporter.
                  </p>
                </div>
              )}

              {item.status === 'found' && (
                <Alert variant="success" className="mt-3">
                  <Alert.Heading>Good News! 🎉</Alert.Heading>
                  <p className="mb-0">This pet has been found and reunited with their owner!</p>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

interface InfoRowProps {
  label: string
  value: string
  highlight?: boolean
}

function InfoRow({ label, value, highlight }: InfoRowProps) {
  return (
    <div className={`info-row ${highlight ? 'highlight' : ''}`}>
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  )
}
