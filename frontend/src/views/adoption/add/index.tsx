// src/views/adoption/add/index.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap'
import { adoptApi } from '@/services/modules/adopt'
import { shelterApi, Shelter } from '@/services/modules/shelter'
import PageHeroTitle from '@/components/page-hero-title'
import './index.scss'

export default function AdoptAdd() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [shelterId, setShelterId] = useState('')

  // 基础信息
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [species, setSpecies] = useState('dog')
  const [sex, setSex] = useState('male')
  const [ageYears, setAgeYears] = useState('')
  const [description, setDescription] = useState('')
  const [breed, setBreed] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // 健康和特征
  const [vaccinated, setVaccinated] = useState(false)
  const [sterilized, setSterilized] = useState(false)
  const [dewormed, setDewormed] = useState(false)
  const [microchipped, setMicrochipped] = useState(false)
  const [childFriendly, setChildFriendly] = useState(false)
  const [trained, setTrained] = useState(false)
  const [lovesPlay, setLovesPlay] = useState(false)
  const [lovesWalks, setLovesWalks] = useState(false)
  const [goodWithDogs, setGoodWithDogs] = useState(false)
  const [goodWithCats, setGoodWithCats] = useState(false)
  const [affectionate, setAffectionate] = useState(false)
  const [needsAttention, setNeedsAttention] = useState(false)

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // 加载 shelter 列表
  useEffect(() => {
    shelterApi.list({ is_active: true }).then((res) => {
      setShelters(res.data.results)
    }).catch((err) => {
      console.error('Failed to load shelters:', err)
    })
  }, [])

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
      if (!name || !species) {
        setError('Please fill in required fields (Name and Species)')
        return
      }

      const formData = new FormData()
      formData.append('name', name)
      formData.append('species', species)
      formData.append('sex', sex)
      formData.append('breed', breed)
      if (ageYears) formData.append('age_years', ageYears)
      formData.append('description', description)
      formData.append('city', city)
      formData.append('contact_phone', contactPhone)
      
      // 创建地址信息作为 JSON
      const addressData = {
        city: city,
        country: 'Poland', // 默认波兰，可根据需要改为动态
      }
      formData.append('address_data', JSON.stringify(addressData))
      
      // Shelter
      if (shelterId && shelterId !== 'others') {
        formData.append('shelter', String(shelterId))
      }
      
      // 健康和特征
      formData.append('vaccinated', String(vaccinated))
      formData.append('sterilized', String(sterilized))
      formData.append('dewormed', String(dewormed))
      formData.append('microchipped', String(microchipped))
      formData.append('child_friendly', String(childFriendly))
      formData.append('trained', String(trained))
      formData.append('loves_play', String(lovesPlay))
      formData.append('loves_walks', String(lovesWalks))
      formData.append('good_with_dogs', String(goodWithDogs))
      formData.append('good_with_cats', String(goodWithCats))
      formData.append('affectionate', String(affectionate))
      formData.append('needs_attention', String(needsAttention))
      
      if (photo) formData.append('cover', photo)

      setLoading(true)
      await adoptApi.create(formData as any)
      setSuccess(true)
      setTimeout(() => {
        nav('/adopt')
      }, 2000)
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Failed to add pet'
      setError(errMsg)
      console.error('Add pet error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="adopt-add-page">
      {/* Hero Section */}
      <PageHeroTitle
        title="Create an adoption listing"
        subtitle="Help find a loving home!"
      />

      <Container className="pb-4" style={{ maxWidth: '1000px' }}>
        {success && (
          <Alert variant="success" className="mt-4">
            ✓ Pet added successfully! Redirecting to pet list...
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mt-4">
            ✗ {error}
          </Alert>
        )}

        <Card className="shadow-lg rounded-4 mt-4">
          <Card.Body className="p-4">
            <Form onSubmit={onSubmit}>
              {/* Main Information */}
              <h5 className="mb-4 fw-bold">Main information</h5>

              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      City (in which city is the pet located?) <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Warszawa"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      Pet name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="How is the pet called?"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Sex <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      required
                    >
                      <option value="male">Boy</option>
                      <option value="female">Girl</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Age <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={ageYears}
                      onChange={(e) => setAgeYears(e.target.value)}
                      required
                    >
                      <option value="">Select age...</option>
                      <option value="0">Under 1 year old</option>
                      <option value="1">1 year old</option>
                      <option value="2">2 years old</option>
                      <option value="3">3 years old</option>
                      <option value="4">4 years old</option>
                      <option value="5">5 years old</option>
                      <option value="6">6 years old</option>
                      <option value="7">7 years old</option>
                      <option value="8">7+ years old</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Pet Description */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Pet description</Form.Label>
                <Form.Control
                  as="textarea"
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setDescription(e.target.value);
                    }
                  }}
                  placeholder="Describe the pet's personality, behavior, and special needs..."
                  rows={4}
                  style={{ resize: 'none' }}
                  maxLength={300}
                />
                <Form.Text className="text-muted">
                  {description.length}/300 characters
                </Form.Text>
              </Form.Group>

              {/* Additional Details */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Species <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={species}
                      onChange={(e) => setSpecies(e.target.value)}
                      required
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Race or in the form of a race</Form.Label>
                    <Form.Control
                      type="text"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="e.g., Hybrid, Labrador, etc."
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Size</Form.Label>
                    <Form.Select value="" onChange={() => {}}>
                      <option>Small</option>
                      <option>Medium</option>
                      <option>Large</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Contact phone</Form.Label>
                <Form.Control
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone number for the listing"
                />
                <Form.Text className="text-warning">
                  Please do not include phone numbers in advertisements. The phone number will be visible next to the pet.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Shelter Location</Form.Label>
                <Form.Select
                  value={shelterId}
                  onChange={(e) => setShelterId(e.target.value)}
                >
                  <option value="">Select shelter...</option>
                  {shelters.map((shelter) => (
                    <option key={shelter.id} value={shelter.id}>
                      {shelter.name}
                    </option>
                  ))}
                  <option value="others">Others</option>
                </Form.Select>
              </Form.Group>

              {/* Photo Upload */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">📸 Pet Photo</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                
                {photoPreview && (
                  <div className="mt-3">
                    <img
                      src={photoPreview}
                      alt="Pet preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}
              </Form.Group>

              {/* Health & Characteristics */}
              <h5 className="mb-3 fw-bold">Health & Characteristics</h5>

              <Row className="mb-4">
                <Col md={6}>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="sterilized"
                      label="Sterilization/Castration"
                      checked={sterilized}
                      onChange={(e) => setSterilized(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="dewormed"
                      label="Dewormed"
                      checked={dewormed}
                      onChange={(e) => setDewormed(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="childFriendly"
                      label="Child-friendly"
                      checked={childFriendly}
                      onChange={(e) => setChildFriendly(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="lovesPlay"
                      label="Loves to play"
                      checked={lovesPlay}
                      onChange={(e) => setLovesPlay(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="acceptsDogs"
                      label="Accepts dogs"
                      checked={goodWithDogs}
                      onChange={(e) => setGoodWithDogs(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="lovesCaresses"
                      label="Loves caresses"
                      checked={affectionate}
                      onChange={(e) => setAffectionate(e.target.checked)}
                    />
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="vaccinated"
                      label="Vaccination"
                      checked={vaccinated}
                      onChange={(e) => setVaccinated(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="microchipped"
                      label="Microchipped"
                      checked={microchipped}
                      onChange={(e) => setMicrochipped(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="trained"
                      label="Trained"
                      checked={trained}
                      onChange={(e) => setTrained(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="lovesWalks"
                      label="Loves walks"
                      checked={lovesWalks}
                      onChange={(e) => setLovesWalks(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="acceptsCats"
                      label="Accepts cats"
                      checked={goodWithCats}
                      onChange={(e) => setGoodWithCats(e.target.checked)}
                    />
                  </div>
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="needsAttention"
                      label="He tolerates staying in the shelter very badly"
                      checked={needsAttention}
                      onChange={(e) => setNeedsAttention(e.target.checked)}
                    />
                  </div>
                </Col>
              </Row>

              {/* Action Buttons */}
              <div className="d-flex gap-3 mt-5">
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={loading}
                  className="flex-grow-1"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Creating listing...
                    </>
                  ) : (
                    '✓ Create Listing'
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => nav('/adopt')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
