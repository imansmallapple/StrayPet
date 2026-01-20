import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap'
import { lostApi, buildLostFormData } from '@/services/modules/lost'
import './index.scss'

export default function LostPost() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // —— 基础信息 ——
  const [petName, setPetName] = useState('')
  const [species, setSpecies] = useState('dog')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [lostAt, setLostAt] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // —— 地址输入字段 ——
  const [country, setCountry] = useState('Poland')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [street, setStreet] = useState('')
  const [postal, setPostal] = useState('')

  // —— 联系信息 ——
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    try {
      // 验证必填字段
      if (!petName.trim()) {
        setError('Pet name is required')
        return
      }
      if (!species) {
        setError('Species is required')
        return
      }
      if (!lostAt) {
        setError('Lost date and time is required')
        return
      }
      if (!photo) {
        setError('Pet photo is required')
        return
      }
      if (!country.trim() || !region.trim() || !city.trim() || !street.trim()) {
        setError('Please fill in all location information (Country, Region, City, Street)')
        return
      }

      // ✅ 新增 address_data 结构
      const address_data = {
        country: country || undefined,
        region: region || undefined,
        city: city || undefined,
        street: street || undefined,
        postal_code: postal || undefined,
      }
      console.warn('[LostPost] address_data:', address_data)

      const payload = {
        pet_name: petName,
        species,
        sex,
        lost_time: new Date(lostAt).toISOString(),
        description,
        photo: photo ?? undefined,
        contact_phone: contactPhone || undefined,
        contact_email: contactEmail || undefined,
        address_data,
      }

      console.warn('Submitting payload:', payload)
      const fd = buildLostFormData(payload as any)
      console.warn('FormData entries:')
      ;(fd as any).forEach((value: any, key: string) => {
        console.warn(`  ${key}:`, value instanceof File ? `File(${value.name})` : value)
      })
      setLoading(true)
      await lostApi.create(fd)
      setSuccess(true)
      setTimeout(() => {
        nav('/lost')
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'Failed to report lost pet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lost-post-page">
      {/* Hero Section */}
      <div className="hero-section">
        <Container>
          <div className="hero-content">
            <h1>📢 Report Lost Pet</h1>
            <p>Help reunite your beloved pet with your family</p>
          </div>
        </Container>
      </div>

      {/* Form Section */}
      <Container className="form-container">
        {success && (
          <Alert variant="success" className="alert-success">
            <span className="alert-icon">✅</span>
            <div>
              <strong>Reported Successfully!</strong>
              <p>Your lost pet report has been published. Redirecting...</p>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="alert-error">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Error</strong>
              <p>{error}</p>
            </div>
          </Alert>
        )}

        <Row className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', width: '100%' }}>
          {/* Left Column - Info Card */}
          <div className="info-col" style={{ gridColumn: '1' }}>
            <Card className="info-card">
              <Card.Body>
                <h5 className="card-title">💡 Tips for Better Results</h5>
                <div className="tips-list">
                  <div className="tip-item">
                    <span className="tip-icon">📷</span>
                    <div>
                      <strong>Add a clear photo</strong>
                      <p>Show your pet's face and distinctive features</p>
                    </div>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">🏷️</span>
                    <div>
                      <strong>Include details</strong>
                      <p>Breed, color, size, collar, tags, and scars</p>
                    </div>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">📍</span>
                    <div>
                      <strong>Precise location</strong>
                      <p>The exact area where your pet was last seen</p>
                    </div>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">⏰</span>
                    <div>
                      <strong>Accurate time</strong>
                      <p>When your pet went missing</p>
                    </div>
                  </div>
                  <div className="tip-item">
                    <span className="tip-icon">✍️</span>
                    <div>
                      <strong>Detailed description</strong>
                      <p>Personality traits, special markings, behavior</p>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Middle Column - Form */}
          <div className="form-col" style={{ gridColumn: '2' }}>
            <Card className="form-card">
              <Card.Body>
                <Form onSubmit={onSubmit} className="lost-form">
                  {/* Section 1: Basic Information */}
                  <div className="form-section">
                    <h5 className="section-title">🐾 Basic Information</h5>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Pet Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., Max, Fluffy, Buddy"
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        required
                      />
                      <Form.Text className="text-danger">Required</Form.Text>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Species *</Form.Label>
                          <Form.Select
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            required
                          >
                            <option value="dog">🐕 Dog</option>
                            <option value="cat">🐱 Cat</option>
                            <option value="rabbit">🐰 Rabbit</option>
                            <option value="bird">🐦 Bird</option>
                            <option value="other">Other</option>
                          </Form.Select>
                          <Form.Text className="text-danger">Required</Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Sex</Form.Label>
                          <Form.Select
                            value={sex}
                            onChange={(e) => setSex(e.target.value as 'male' | 'female')}
                          >
                            <option value="male">♂️ Male</option>
                            <option value="female">♀️ Female</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Lost Date & Time *</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={lostAt}
                        onChange={(e) => setLostAt(e.target.value)}
                        required
                      />
                      <Form.Text className="text-danger">Required</Form.Text>
                    </Form.Group>
                  </div>

                  {/* Section 2: Last Place Seen */}
                  <div className="form-section">
                    <h5 className="section-title">📍 Last Place Seen</h5>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g., Poland"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                          />
                          <Form.Text className="text-danger">Required</Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>State/Region *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g., Mazovia"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            required
                          />
                          <Form.Text className="text-danger">Required</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g., Warsaw"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                          />
                          <Form.Text className="text-danger">Required</Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Postal Code</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g., 00-001"
                            value={postal}
                            onChange={(e) => setPostal(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Street Address *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g., ul. Nowy Świat 10"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        required
                      />
                      <Form.Text className="text-danger">Required</Form.Text>
                    </Form.Group>
                  </div>

                  {/* Section 3: Description & Photo */}
                  <div className="form-section">
                    <h5 className="section-title">📝 Description & Photo</h5>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Description (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Describe your pet: breed, color, distinctive marks, behavior, etc. The more details, the better!"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ resize: 'none' }}
                      />
                      <Form.Text className="text-muted">
                        {description.length}/500 characters - Optional
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Pet Photo *</Form.Label>
                      <div className="photo-upload-area">
                        {photoPreview ? (
                          <div className="photo-preview">
                            <img src={photoPreview} alt="Pet preview" />
                            <button
                              type="button"
                              className="btn-remove-photo"
                              onClick={() => {
                                setPhoto(null)
                                setPhotoPreview(null)
                              }}
                            >
                              ✕ Remove Photo
                            </button>
                          </div>
                        ) : (
                          <label className="upload-label">
                            <div className="upload-icon">📸</div>
                            <div className="upload-text">
                              <p>Click to upload a photo</p>
                              <small>JPG, PNG up to 5MB</small>
                            </div>
                            <Form.Control
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              style={{ display: 'none' }}
                              required
                            />
                          </label>
                        )}
                      </div>
                      <Form.Text className="text-danger">Required</Form.Text>
                    </Form.Group>
                  </div>

                  {/* Section 4: Contact Information */}
                  <div className="form-section">
                    <h5 className="section-title">📞 Your Contact Information</h5>
                    <p className="info-text">So the owner can reach you if they have information about your pet</p>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number *</Form.Label>
                          <Form.Control
                            type="tel"
                            placeholder="e.g., +48 12 345 67 89"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            required
                          />
                          <Form.Text className="text-danger">Required</Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address *</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="e.g., your.email@example.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            required
                          />
                          <Form.Text className="text-danger">Required</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* Submit Button */}
                  <div className="form-actions">
                    <Button
                      variant="primary"
                      size="lg"
                      type="submit"
                      disabled={loading}
                      className="btn-submit"
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Reporting...
                        </>
                      ) : (
                        '📢 Report Lost Pet'
                      )}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="lg"
                      onClick={() => nav('/lost')}
                      disabled={loading}
                      className="btn-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>

          {/* Right Column - Contact Card */}
          <div className="info-col" style={{ gridColumn: '3' }}>
            <Card className="contact-card">
              <Card.Body>
                <h5 className="card-title">🆘 Need Help?</h5>
                <p>If you need assistance reporting your lost pet, contact our support team:</p>
                <div className="contact-info">
                  <p>📧 <strong>Email:</strong> support@example.com</p>
                  <p>📞 <strong>Phone:</strong> 1-800-LOST-PET</p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Row>
      </Container>
    </div>
  )
}
