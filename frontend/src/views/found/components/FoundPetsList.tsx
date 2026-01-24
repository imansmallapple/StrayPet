// src/views/found/components/FoundPetsList.tsx
import { useEffect, useState } from 'react'
import { Row, Col, Card, Badge, Button, Spinner, Alert, Form } from 'react-bootstrap'
import { lostApi, type LostPet, type PageResp } from '@/services/modules/lost'
import './FoundPetsList.scss'

interface FoundPetsListProps {
  onReportClick?: () => void
}

export default function FoundPetsList({ onReportClick }: FoundPetsListProps) {
  const [data, setData] = useState<PageResp<LostPet> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 12

  const fetchFoundPets = async (currentPage: number) => {
    try {
      setLoading(true)
      setError('')
      // Filter for found pets (status = 'found') on server side
      const { data } = await lostApi.list({
        page: currentPage,
        page_size: pageSize,
        ordering: '-created_at',
        status: 'found'  // Server-side filter
      })
      setData(data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load found pets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFoundPets(page)
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchFoundPets(1)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1

  if (loading && !data) {
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Loading found pets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="danger" className="error-alert">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={() => fetchFoundPets(page)}>
          Try Again
        </Button>
      </Alert>
    )
  }

  return (
    <div className="found-pets-list">
      {/* Header with Report Button */}
      <div className="list-header">
        <div className="header-content">
          <div className="header-text">
            <h2>✨ Found Pets Database</h2>
            <p>These pets have been found and are waiting to be reunited with their owners</p>
          </div>
          {onReportClick && (
            <Button 
              variant="success" 
              size="lg"
              className="report-button"
              onClick={onReportClick}
            >
              <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🎉</span>
              Report Found Pet
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
          <Button type="submit" variant="success" className="search-btn">
            Search
          </Button>
        </Form>
      </div>

      {/* Stats */}
      {data && (
        <div className="stats-bar">
          <span className="stats-text">
            📊 Showing <strong>{data.results.length}</strong> found pets
          </span>
        </div>
      )}

      {/* Pet Cards Grid */}
      {data && data.results.length > 0 ? (
        <Row className="pets-grid">
          {data.results.map((pet) => {
            const imgSrc = pet.photo_url || pet.photo
            const title = pet.pet_name || `${pet.species}${pet.breed ? ' · ' + pet.breed : ''}`
            const foundDate = pet.created_at
              ? new Date(pet.created_at).toLocaleDateString('en-US', {
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
                      <Badge bg="success">Found ✅</Badge>
                    </div>
                  </div>

                  <Card.Body>
                    <Card.Title className="pet-title">{title}</Card.Title>
                    
                    <div className="pet-details">
                      <div className="detail-item">
                        <span className="detail-icon">{pet.sex === 'male' ? '♂️' : '♀️'}</span>
                        <span>{pet.sex === 'male' ? 'Boy' : 'Girl'}</span>
                      </div>
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
                      {pet.size && (
                        <div className="detail-item">
                          <span className="detail-icon">📏</span>
                          <span>{pet.size}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span>Found: {foundDate}</span>
                      </div>
                    </div>

                    {pet.description && (
                      <Card.Text className="pet-description">
                        {pet.description.length > 80
                          ? `${pet.description.substring(0, 80)}...`
                          : pet.description}
                      </Card.Text>
                    )}

                    <Button variant="outline-success" size="sm" className="w-100 contact-btn">
                      Contact Finder →
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      ) : (
        <div className="no-results">
          <div className="no-results-icon">✨</div>
          <h3>No Found Pets Yet</h3>
          <p>Check back later or help by reporting found pets in your area.</p>
          {onReportClick && (
            <Button 
              variant="success" 
              size="lg" 
              className="mt-3"
              onClick={onReportClick}
            >
              🎉 Report a Found Pet
            </Button>
          )}
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
