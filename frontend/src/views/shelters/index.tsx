// src/views/shelters/index.tsx
import { useState, useEffect, useCallback } from 'react'
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { shelterApi, type Shelter } from '@/services/modules/shelter'
import CreateShelter from './components/CreateShelter'
import './index.scss'

export default function SheltersPage() {
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadShelters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await shelterApi.list({ 
        is_active: true,
        page: currentPage,
        page_size: 100  // 每页显示 100 条
      })
      console.warn('API Response:', response.data.results)
      setShelters(response.data.results)
      setTotalCount(response.data.count)
    } catch (err: any) {
      setError(err.message || 'Failed to load shelters')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    loadShelters()
  }, [currentPage, loadShelters])

  const filteredShelters = shelters.filter(shelter => 
    shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shelter.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shelter.region?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getOccupancyColor = (rate: number) => {
    if (rate < 70) return 'success'
    if (rate < 90) return 'warning'
    return 'danger'
  }

  const handleCreateSuccess = () => {
    loadShelters() // Refresh the list after creating a new shelter
  }

  const handleAddClick = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('Please log in to add a shelter')
      // Optionally redirect to login page
      // navigate('/auth/login')
      return
    }
    setShowCreateModal(true)
  }

  if (loading) {
    return (
      <Container className="shelters-page py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading shelters...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="shelters-page py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadShelters}>
            Try Again
          </Button>
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="shelters-page py-4">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1>🏠 Animal Shelters</h1>
            <p className="text-muted mb-0">Find local animal shelters and rescue organizations</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="stats-badge">
              <Badge bg="primary" pill className="fs-6 px-3 py-2">
                {totalCount} {totalCount === 1 ? 'Shelter' : 'Shelters'}
              </Badge>
            </div>
            <Button 
              variant="primary" 
              className="add-shelter-btn"
              onClick={handleAddClick}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Add Shelter
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Row className="mb-4">
        <Col md={6} lg={4}>
          <Form.Control
            type="text"
            placeholder="🔍 Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </Col>
      </Row>

      {/* Shelters Grid */}
      {filteredShelters.length === 0 ? (
        <Alert variant="info">
          <p className="mb-0">No shelters found. Try adjusting your search.</p>
        </Alert>
      ) : (
        <Row className="g-4">
          {filteredShelters.map((shelter) => (
            <Col key={shelter.id} xs={12} sm={6} lg={4} xl={3}>
              <Card className="shelter-card h-100">
                {/* Cover Image */}
                <div className="shelter-cover">
                  {shelter.cover_url ? (
                    <Card.Img 
                      variant="top" 
                      src={shelter.cover_url} 
                      alt={shelter.name}
                      className="cover-image"
                    />
                  ) : (
                    <div className="cover-placeholder">
                      <i className="bi bi-house-heart fs-1"></i>
                    </div>
                  )}
                  {shelter.is_verified && (
                    <Badge bg="success" className="verified-badge">
                      ✓ Verified
                    </Badge>
                  )}
                </div>

                <Card.Body className="d-flex flex-column">
                  {/* Logo and Name */}
                  <div className="d-flex align-items-start mb-2">
                    {shelter.logo_url ? (
                      <img 
                        src={shelter.logo_url} 
                        alt={`${shelter.name} logo`}
                        className="shelter-logo me-3"
                      />
                    ) : (
                      <div className="shelter-logo-placeholder me-3">
                        <i className="bi bi-building"></i>
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <Card.Title className="mb-2 fs-5">{shelter.name}</Card.Title>
                      <div className="address-section mb-2">
                        <small className="text-muted d-block">
                          <i className="bi bi-geo-alt-fill me-1"></i>
                          {(() => {
                            const addressParts = []
                            if (shelter.street) addressParts.push(shelter.street)
                            if (shelter.city) addressParts.push(shelter.city)
                            if (addressParts.length > 0) {
                              return addressParts.join(', ')
                            }
                            if (shelter.region) return shelter.region
                            if (shelter.country) return shelter.country
                            return 'No address provided'
                          })()}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {shelter.description && (
                    <Card.Text className="description-text mb-3">
                      {shelter.description.length > 80
                        ? `${shelter.description.substring(0, 80)}...`
                        : shelter.description}
                    </Card.Text>
                  )}

                  {/* Capacity Info */}
                  <div className="capacity-info mb-3 mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">Capacity</small>
                      <Badge 
                        bg={getOccupancyColor(shelter.occupancy_rate || 0)}
                        className="occupancy-badge"
                      >
                        {shelter.occupancy_rate?.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="capacity-bar">
                      <div 
                        className={`capacity-fill bg-${getOccupancyColor(shelter.occupancy_rate || 0)}`}
                        style={{ width: `${Math.min(shelter.occupancy_rate || 0, 100)}%` }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      {shelter.current_animals} / {shelter.capacity} animals
                    </small>
                  </div>

                  {/* Contact Info */}
                  <div className="contact-quick mb-3">
                    {shelter.phone && (
                      <div className="contact-item">
                        <i className="bi bi-telephone me-2"></i>
                        <small>{shelter.phone}</small>
                      </div>
                    )}
                    {shelter.email && (
                      <div className="contact-item">
                        <i className="bi bi-envelope me-2"></i>
                        <small>{shelter.email}</small>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <Link to={`/shelters/${shelter.id}`} className="w-100">
                    <Button variant="primary" className="w-100">
                      View Details
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Pagination (if needed) */}
      {totalCount > 12 && (
        <div className="d-flex justify-content-center mt-4">
          <Button
            variant="outline-primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="me-2"
          >
            Previous
          </Button>
          <Button
            variant="outline-primary"
            disabled={currentPage * 12 >= totalCount}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Shelter Modal */}
      <CreateShelter
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </Container>
  )
}

