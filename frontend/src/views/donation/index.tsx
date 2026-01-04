// src/views/donation/index.tsx
import { useState, useEffect } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  Spinner,
  Badge,
} from 'react-bootstrap'

import './index.scss'
import { shelterApi, type Shelter } from '@/services/modules/shelter'

export default function DonationPage() {
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShelters()
  }, [])

  const fetchShelters = async () => {
    try {
      setLoading(true)
      // 调用后端 API 获取收容所列表
      const response = await shelterApi.list({ is_active: true })
      setShelters(response.data.results || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching shelters:', err)
      setError('Failed to load shelter list')
      setShelters([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="donation-page">
      <Container className="py-5">
        {/* 标题部分 */}
        <div className="mb-5 text-center">
          <h1 className="donation-title mb-3">Found a Lost or Stray Dog?</h1>
          <p className="lead text-muted">
            If you find a lost dog outside, don't assume it has no owner. The dog might just be lost, and someone might be frantically searching for it.
          </p>
        </div>

        {/* 关键信息卡片 */}
        <Row className="mb-5">
          <Col lg={12}>
            <Alert variant="info" className="mb-4">
              <Alert.Heading>If you find a lost dog outside, you have a responsibility to notify your local shelter first.</Alert.Heading>
              <hr />
              <p className="mb-0">
                We appreciate your effort in finding a lost pet. Please contact the shelter below - they will help you reunite the pet with its owner or provide proper care for the animal.
              </p>
            </Alert>
          </Col>
        </Row>

        {/* 操作指南部分 */}
        <Row className="mb-5">
          <Col lg={12}>
            <h2 className="mb-4">What to Do When You Find a Pet</h2>
            <div className="guides-grid">
              <Card className="guide-card h-100">
                <Card.Body>
                  <div className="guide-number">1</div>
                  <h5 className="card-title">Walk the Dog Around the Neighborhood</h5>
                  <p className="card-text">
                    Check the dog's tag and ask nearby residents if they recognize the dog. Most lost dogs hide close to home. Someone nearby might help you locate the owner.
                  </p>
                </Card.Body>
              </Card>

              <Card className="guide-card h-100">
                <Card.Body>
                  <div className="guide-number">2</div>
                  <h5 className="card-title">Post Photos on Social Media & Community Groups</h5>
                  <p className="card-text">
                    Use social media to share pet information quickly. Utilize multiple platforms and neighborhood networks, including local forums. Nextdoor and Neighbors by Ring help you reach the community and increase chances of finding the owner.
                  </p>
                </Card.Body>
              </Card>

              <Card className="guide-card h-100">
                <Card.Body>
                  <div className="guide-number">3</div>
                  <h5 className="card-title">Check for a Microchip</h5>
                  <p className="card-text">
                    Most veterinary clinics and pet stores have microchip scanners and can scan for free. This can help identify the owner and facilitate quick reunification.
                  </p>
                </Card.Body>
              </Card>

              <Card className="guide-card h-100">
                <Card.Body>
                  <div className="guide-number">4</div>
                  <h5 className="card-title">Report the Lost Pet</h5>
                  <p className="card-text">
                    Contact your local animal shelter and inform them you've found a lost dog. This will help the owner find their pet once they're notified.
                  </p>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        {/* 收容所列表部分 */}
        <Row className="mb-5">
          <Col lg={12}>
            <h2 className="mb-4">Find a Local Animal Shelter Near You</h2>
            
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : shelters.length === 0 ? (
              <Alert variant="warning">
                No shelter information available at this time. Please try again later.
              </Alert>
            ) : (
              <div className="shelters-grid">
                {shelters.map((shelter) => (
                  <Card key={shelter.id} className="shelter-card h-100">
                    <Card.Body>
                      <div className="shelter-header mb-3">
                        <h5 className="shelter-name">
                          {shelter.name}
                          {shelter.is_verified && (
                            <Badge bg="success" className="ms-2">Verified</Badge>
                          )}
                        </h5>
                      </div>

                      <p className="card-text shelter-description">
                        {shelter.description}
                      </p>

                      <div className="shelter-info mb-3">
                        <div className="info-item">
                          <strong>Capacity:</strong>
                          {shelter.current_animals} / {shelter.capacity}
                        </div>
                        <div className="info-item">
                          <strong>Founded:</strong>
                          {shelter.founded_year || 'Unknown'}
                        </div>
                      </div>

                      <div className="shelter-contact mb-3">
                        {shelter.email && (
                          <div className="contact-item">
                            <i className="bi bi-envelope"></i>
                            <a href={`mailto:${shelter.email}`}>{shelter.email}</a>
                          </div>
                        )}
                        {shelter.phone && (
                          <div className="contact-item">
                            <i className="bi bi-telephone"></i>
                            <a href={`tel:${shelter.phone}`}>{shelter.phone}</a>
                          </div>
                        )}
                        {shelter.website && (
                          <div className="contact-item">
                            <i className="bi bi-globe"></i>
                            <a href={shelter.website} target="_blank" rel="noopener noreferrer">
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="shelter-social">
                        {shelter.facebook_url && (
                          <a href={shelter.facebook_url} target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">
                            <i className="bi bi-facebook"></i>
                          </a>
                        )}
                        {shelter.instagram_url && (
                          <a href={shelter.instagram_url} target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                            <i className="bi bi-instagram"></i>
                          </a>
                        )}
                        {shelter.twitter_url && (
                          <a href={shelter.twitter_url} target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                            <i className="bi bi-twitter"></i>
                          </a>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  )
}
