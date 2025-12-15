// src/views/lost/components/LostPetsList.tsx
import { useEffect, useState } from 'react'
import { Row, Col, Card, Badge, Button, Spinner, Alert, Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { lostApi, type LostPet, type PageResp } from '@/services/modules/lost'
import './LostPetsList.scss'

interface LostPetsListProps {
  onReportClick?: () => void
}

export default function LostPetsList({ onReportClick }: LostPetsListProps) {
  const [data, setData] = useState<PageResp<LostPet> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 12

  const fetchLostPets = async (currentPage: number) => {
    try {
      setLoading(true)
      setError('')
      const { data } = await lostApi.list({
        page: currentPage,
        page_size: pageSize,
        ordering: '-created_at',
        status: 'open'  // Only show open (lost) pets
      })
      setData(data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load lost pets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLostPets(page)
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, you would pass search params to the API
    fetchLostPets(1)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'found':
        return <Badge bg="success">Found ✅</Badge>
      case 'closed':
        return <Badge bg="secondary">Closed</Badge>
      case 'open':
      default:
        return <Badge bg="warning" text="dark">Lost 🔍</Badge>
    }
  }

  if (loading && !data) {
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading lost pets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="danger" className="error-alert">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={() => fetchLostPets(page)}>
          Try Again
        </Button>
      </Alert>
    )
  }

  return (
    <div className="lost-pets-list">
      {/* Header with Report Button */}
      <div className="list-header">
        <div className="header-content">
          <div className="header-text">
            <h2>🔍 Lost Pets Database</h2>
            <p>Help reunite lost pets with their families</p>
          </div>
          {onReportClick && (
            <Button 
              variant="danger" 
              size="lg"
              className="report-button"
              onClick={onReportClick}
            >
              <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>📢</span>
              Report Lost Pet
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <Form onSubmit={handleSearch} className="search-form">
          <Form.Control
            type="text"
            placeholder="🔍 Search by pet name, breed, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <Button type="submit" variant="primary" className="search-btn">
            Search
          </Button>
        </Form>
      </div>

      {/* Stats */}
      {data && (
        <div className="stats-bar">
          <span className="stats-text">
            📊 Showing <strong>{data.results.length}</strong> of{' '}
            <strong>{data.count}</strong> lost pets
          </span>
        </div>
      )}

      {/* Pet Cards Grid */}
      {data && data.results.length > 0 ? (
        <Row className="pets-grid">
          {data.results.map((pet) => {
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
              <Col key={pet.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <Card className="pet-card">
                  <div className="pet-image-container">
                    {imgSrc ? (
                      <Card.Img
                        variant="top"
                        src={imgSrc}
                        alt={title}
                        className="pet-image"
                      />
                    ) : (
                      <div className="no-image-placeholder">
                        <span className="no-image-icon">📷</span>
                        <p>No Photo</p>
                      </div>
                    )}
                    <div className="status-badge-overlay">
                      {getStatusBadge(pet.status)}
                    </div>
                  </div>

                  <Card.Body>
                    <Card.Title className="pet-title">{title}</Card.Title>
                    
                    <div className="pet-details">
                      {pet.breed && (
                        <div className="detail-item">
                          <span className="detail-icon">🐕</span>
                          <span>{pet.breed}</span>
                        </div>
                      )}
                      {pet.color && (
                        <div className="detail-item">
                          <span className="detail-icon">🎨</span>
                          <span>{pet.color}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span>Lost: {lostDate}</span>
                      </div>
                      {pet.reward && (
                        <div className="detail-item reward">
                          <span className="detail-icon">💰</span>
                          <span>Reward: {pet.reward}</span>
                        </div>
                      )}
                    </div>

                    {pet.description && (
                      <Card.Text className="pet-description">
                        {pet.description.length > 80
                          ? `${pet.description.substring(0, 80)}...`
                          : pet.description}
                      </Card.Text>
                    )}

                    <Link to={`/lost/${pet.id}`} className="view-details-link">
                      <Button variant="outline-primary" size="sm" className="w-100">
                        View Details →
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      ) : (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No Lost Pets Found</h3>
          <p>There are currently no lost pets reported in this area.</p>
        </div>
      )}

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="pagination-container">
          <Button
            variant="outline-secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Previous
          </Button>
          <span className="page-info">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <Button
            variant="outline-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  )
}
