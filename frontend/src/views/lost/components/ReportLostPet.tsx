// src/views/lost/components/ReportLostPet.tsx
import { useState } from 'react'
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap'
import { lostApi, buildLostFormData } from '@/services/modules/lost'
import './ReportLostPet.scss'

interface ReportLostPetProps {
  onSuccess?: () => void
}

export default function ReportLostPet({ onSuccess }: ReportLostPetProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Basic information
  const [petName, setPetName] = useState('')
  const [species, setSpecies] = useState('dog')
  const [breed, setBreed] = useState('')
  const [color, setColor] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [size, setSize] = useState('medium')
  const [lostTime, setLostTime] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')

  // Address information
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [street, setStreet] = useState('')
  const [building, setBuilding] = useState('')
  const [postal, setPostal] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!species || !lostTime) {
      setError('Please fill in all required fields (Species and Lost Time)')
      return
    }

    try {
      setLoading(true)

      const address_data = {
        country: country || null,
        region: region || null,
        city: city || null,
        street: street || null,
        building_number: building || null,
        postal_code: postal || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
      }

      const payload = {
        pet_name: petName || undefined,
        species,
        breed: breed || undefined,
        color: color || undefined,
        sex,
        size: size || undefined,
        lost_time: new Date(lostTime).toISOString(),
        description: description || undefined,
        reward: reward || undefined,
        photo: photo || undefined,
        address_data,
      }

      const formData = buildLostFormData(payload as any)
      await lostApi.create(formData)
      
      setSuccess(true)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
      }, 2000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="report-lost-pet">
      <Card className="report-card">
        <Card.Body>
          <h2 className="section-title">📝 Report a Lost Pet</h2>
          <p className="section-subtitle">
            Please provide as much detail as possible to help locate your pet
          </p>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && (
            <Alert variant="success">
              ✅ Report submitted successfully! Redirecting...
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h5 className="subsection-title">🐾 Pet Information</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pet Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Max, Luna"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Species <span className="required">*</span></Form.Label>
                    <Form.Select value={species} onChange={(e) => setSpecies(e.target.value)} required>
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="bird">Bird</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Breed</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Golden Retriever, Persian"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Color</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Brown, White and Black"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select value={sex} onChange={(e) => setSex(e.target.value as 'male' | 'female')}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Size</Form.Label>
                    <Form.Select value={size} onChange={(e) => setSize(e.target.value)}>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Lost Time <span className="required">*</span></Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={lostTime}
                      onChange={(e) => setLostTime(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Describe any distinctive features, behavior, or circumstances of the loss..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Reward (optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., $100, or any reward information"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                />
              </Form.Group>
            </div>

            {/* Location Information */}
            <div className="form-section">
              <h5 className="subsection-title">📍 Last Seen Location</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>State/Province</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., California"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., San Francisco"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Street Address</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., 123 Main Street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Building/Apt Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Apt 5B"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., 94102"
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Latitude (optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., 37.7749"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Longitude (optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., -122.4194"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Photo Upload */}
            <div className="form-section">
              <h5 className="subsection-title">📷 Photo</h5>
              <Form.Group className="mb-3">
                <Form.Label>Upload a photo of your pet</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <div className="photo-preview mt-3">
                    <img src={photoPreview} alt="Preview" />
                  </div>
                )}
              </Form.Group>
            </div>

            <div className="form-actions">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? '⏳ Submitting...' : '📤 Submit Report'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
