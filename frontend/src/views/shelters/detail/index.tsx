// src/views/shelters/detail/index.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, ListGroup } from 'react-bootstrap'
import { shelterApi, type Shelter } from '@/services/modules/shelter'
import './index.scss'

export default function ShelterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [shelter, setShelter] = useState<Shelter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadShelter(parseInt(id))
    }
  }, [id])

  const loadShelter = async (shelterId: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await shelterApi.detail(shelterId)
      setShelter(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load shelter details')
    } finally {
      setLoading(false)
    }
  }

  const getOccupancyColor = (rate: number) => {
    if (rate < 70) return 'success'
    if (rate < 90) return 'warning'
    return 'danger'
  }

  if (loading) {
    return (
      <Container className="shelter-detail-page py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading shelter details...</p>
        </div>
      </Container>
    )
  }

  if (error || !shelter) {
    return (
      <Container className="shelter-detail-page py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error || 'Shelter not found'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/shelters')}>
            Back to Shelters
          </Button>
        </Alert>
      </Container>
    )
  }

  const fullAddress = [
    shelter.street,
    shelter.city,
    shelter.region,
    shelter.country,
    shelter.postal_code
  ].filter(Boolean).join(', ')

  return (
    <Container className="shelter-detail-page py-4">
      {/* Back Button */}
      <Button 
        variant="outline-secondary" 
        onClick={() => navigate('/shelters')}
        className="mb-3"
      >
        <i className="bi bi-arrow-left me-2"></i>
        Back to Shelters
      </Button>

      {/* Cover Image */}
      {shelter.cover_url && (
        <div className="cover-section mb-4">
          <img 
            src={shelter.cover_url} 
            alt={shelter.name}
            className="cover-image"
          />
        </div>
      )}

      <Row>
        {/* Main Content */}
        <Col lg={8}>
          {/* Header Section */}
          <Card className="header-card mb-4">
            <Card.Body>
              <div className="d-flex align-items-start">
                {shelter.logo_url ? (
                  <img 
                    src={shelter.logo_url} 
                    alt={`${shelter.name} logo`}
                    className="shelter-logo me-4"
                  />
                ) : (
                  <div className="shelter-logo-placeholder me-4">
                    <i className="bi bi-building"></i>
                  </div>
                )}
                
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-2">
                    <h1 className="mb-0 me-3">{shelter.name}</h1>
                    {shelter.is_verified && (
                      <Badge bg="success" className="verified-badge">
                        <i className="bi bi-check-circle me-1"></i>
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {fullAddress && (
                    <p className="location mb-2">
                      <i className="bi bi-geo-alt me-2"></i>
                      {fullAddress}
                    </p>
                  )}

                  {shelter.founded_year && (
                    <p className="text-muted mb-0">
                      <i className="bi bi-calendar me-2"></i>
                      Founded in {shelter.founded_year}
                    </p>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* About Section */}
          {shelter.description && (
            <Card className="mb-4">
              <Card.Body>
                <h3 className="section-title">About</h3>
                <p className="description-text">{shelter.description}</p>
              </Card.Body>
            </Card>
          )}

          {/* Capacity Section */}
          <Card className="mb-4">
            <Card.Body>
              <h3 className="section-title mb-3">Capacity Information</h3>
              
              <div className="capacity-stats">
                <Row className="g-3 mb-4">
                  <Col xs={6} md={3}>
                    <div className="stat-box">
                      <div className="stat-value">{shelter.capacity}</div>
                      <div className="stat-label">Total Capacity</div>
                    </div>
                  </Col>
                  <Col xs={6} md={3}>
                    <div className="stat-box">
                      <div className="stat-value">{shelter.current_animals}</div>
                      <div className="stat-label">Current Animals</div>
                    </div>
                  </Col>
                  <Col xs={6} md={3}>
                    <div className="stat-box">
                      <div className="stat-value">{shelter.available_capacity || 0}</div>
                      <div className="stat-label">Available</div>
                    </div>
                  </Col>
                  <Col xs={6} md={3}>
                    <div className="stat-box">
                      <div className="stat-value text-{getOccupancyColor(shelter.occupancy_rate || 0)}">
                        {shelter.occupancy_rate?.toFixed(0)}%
                      </div>
                      <div className="stat-label">Occupancy</div>
                    </div>
                  </Col>
                </Row>

                <div className="capacity-bar-large">
                  <div 
                    className={`capacity-fill bg-${getOccupancyColor(shelter.occupancy_rate || 0)}`}
                    style={{ width: `${Math.min(shelter.occupancy_rate || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Contact Information */}
          <Card className="contact-card mb-4 sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <h3 className="section-title mb-3">Contact Information</h3>
              
              <ListGroup variant="flush">
                {shelter.phone && (
                  <ListGroup.Item className="contact-item">
                    <i className="bi bi-telephone contact-icon"></i>
                    <div>
                      <div className="contact-label">Phone</div>
                      <a href={`tel:${shelter.phone}`} className="contact-value">
                        {shelter.phone}
                      </a>
                    </div>
                  </ListGroup.Item>
                )}

                {shelter.email && (
                  <ListGroup.Item className="contact-item">
                    <i className="bi bi-envelope contact-icon"></i>
                    <div>
                      <div className="contact-label">Email</div>
                      <a href={`mailto:${shelter.email}`} className="contact-value">
                        {shelter.email}
                      </a>
                    </div>
                  </ListGroup.Item>
                )}

                {shelter.website && (
                  <ListGroup.Item className="contact-item">
                    <i className="bi bi-globe contact-icon"></i>
                    <div>
                      <div className="contact-label">Website</div>
                      <a 
                        href={shelter.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="contact-value"
                      >
                        Visit Website <i className="bi bi-box-arrow-up-right ms-1"></i>
                      </a>
                    </div>
                  </ListGroup.Item>
                )}

                {fullAddress && (
                  <ListGroup.Item className="contact-item">
                    <i className="bi bi-geo-alt contact-icon"></i>
                    <div>
                      <div className="contact-label">Address</div>
                      <div className="contact-value">{fullAddress}</div>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>

              <div className="mt-4">
                <Button 
                  variant="primary" 
                  className="w-100 contact-btn"
                  onClick={() => window.location.href = `mailto:${shelter.email}`}
                  disabled={!shelter.email}
                >
                  <i className="bi bi-envelope me-2"></i>
                  Contact Shelter
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Social Media */}
          {(shelter.facebook_url || shelter.instagram_url || shelter.twitter_url) && (
            <Card className="social-card">
              <Card.Body>
                <h3 className="section-title mb-3">Follow Us</h3>
                
                <div className="social-links">
                  {shelter.facebook_url && (
                    <a 
                      href={shelter.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link facebook"
                    >
                      <i className="bi bi-facebook"></i>
                      <span>Facebook</span>
                    </a>
                  )}

                  {shelter.instagram_url && (
                    <a 
                      href={shelter.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link instagram"
                    >
                      <i className="bi bi-instagram"></i>
                      <span>Instagram</span>
                    </a>
                  )}

                  {shelter.twitter_url && (
                    <a 
                      href={shelter.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link twitter"
                    >
                      <i className="bi bi-twitter-x"></i>
                      <span>Twitter/X</span>
                    </a>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  )
}
