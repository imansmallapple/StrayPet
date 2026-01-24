// src/views/adoption/components/AddPetModal.tsx
import { useState } from 'react'
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { adoptApi } from '@/services/modules/adopt'

interface AddPetModalProps {
  show: boolean
  onHide: () => void
  onSuccess?: () => void
}

export default function AddPetModal({ show, onHide, onSuccess }: AddPetModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    sex: 'M',
    age_years: '',
    age_months: '',
    description: '',
    city: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await adoptApi.create({
        ...formData,
        age_years: formData.age_years ? parseInt(formData.age_years) : undefined,
        age_months: formData.age_months ? parseInt(formData.age_months) : undefined,
      } as any)
      
      // Reset form
      setFormData({
        name: '',
        species: 'dog',
        sex: 'M',
        age_years: '',
        age_months: '',
        description: '',
        city: '',
      })
      
      alert('✓ Pet added successfully!')
      onSuccess?.()
      onHide()
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || 'Failed to add pet'
      setError(errMsg)
      console.error('Add pet error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>🐾 Add New Pet</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit} id="add-pet-form">
          {/* Pet Name */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              Pet Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Buddy, Fluffy"
              required
            />
          </Form.Group>

          {/* Species & Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Form.Group>
              <Form.Label className="fw-bold">
                Species <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="species"
                value={formData.species}
                onChange={handleChange}
                required
              >
                <option value="dog">🐕 Dog</option>
                <option value="cat">🐱 Cat</option>
                <option value="other">🐾 Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-bold">
                Gender <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                required
              >
                <option value="male">♂️ Boy</option>
                <option value="female">♀️ Girl</option>
              </Form.Select>
            </Form.Group>
          </div>

          {/* Age */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <Form.Group>
              <Form.Label className="fw-bold">Age (Years)</Form.Label>
              <Form.Control
                type="number"
                name="age_years"
                value={formData.age_years}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 2"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-bold">Age (Months)</Form.Label>
              <Form.Control
                type="number"
                name="age_months"
                value={formData.age_months}
                onChange={handleChange}
                min="0"
                max="11"
                placeholder="e.g., 6"
              />
            </Form.Group>
          </div>

          {/* City */}
          <Form.Group className="mb-3" style={{ marginTop: '1rem' }}>
            <Form.Label className="fw-bold">City</Form.Label>
            <Form.Control
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g., San Francisco"
            />
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Tell us about this pet..."
              rows={4}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          form="add-pet-form"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Adding...
            </>
          ) : (
            '🐾 Add Pet'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
