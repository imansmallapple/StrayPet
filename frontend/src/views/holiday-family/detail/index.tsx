// src/views/holiday-family/detail/index.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { holidayFamilyApi } from '@/services/modules/holiday-family'
import './index.scss'

interface HolidayFamilyDetail {
  id: number
  full_name: string
  email: string
  phone: string
  country: string
  state: string
  city: string
  street_address: string
  postal_code: string
  pet_count: number
  can_take_dogs: boolean
  can_take_cats: boolean
  can_take_rabbits: boolean
  can_take_others: string
  motivation: string
  introduction: string
  id_document: string
  family_photos: Array<{ id: number; photo: string; uploaded_at: string }>
  terms_agreed: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export default function HolidayFamilyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [application, setApplication] = useState<HolidayFamilyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await holidayFamilyApi.getDetail(id as string)
        setApplication(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application')
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [id])

  if (!user?.is_staff) {
    return (
      <div className="holiday-family-detail-container">
        <div className="error-box">
          <h2>Access Denied</h2>
          <p>You don't have permission to view this page.</p>
          <button type="button" onClick={() => navigate('/')} className="back-btn">
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="holiday-family-detail-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="holiday-family-detail-container">
        <div className="error-box">
          <h2>Error</h2>
          <p>{error || 'Application not found'}</p>
          <button type="button" onClick={() => navigate('/holiday-family')} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981'
      case 'rejected':
        return '#ef4444'
      case 'pending':
      default:
        return '#f59e0b'
    }
  }

  return (
    <div className="holiday-family-detail-container">
      <button type="button" className="back-btn" onClick={() => navigate('/holiday-family')}>
        ← Back to List
      </button>

      <div className="detail-header">
        <div className="header-content">
          <h1>{application.full_name}</h1>
          <div
            className="status-badge"
            style={{ backgroundColor: getStatusColor(application.status) }}
          >
            {application.status.toUpperCase()}
          </div>
        </div>
        <p className="submitted-date">
          Submitted on {new Date(application.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="detail-grid">
        {/* Personal Information Section */}
        <section className="detail-section">
          <h2>Personal Information</h2>
          <div className="info-group">
            <div className="info-item">
              <label>Email</label>
              <p>{application.email}</p>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <p>{application.phone}</p>
            </div>
          </div>
        </section>

        {/* Address Section */}
        <section className="detail-section">
          <h2>Address</h2>
          <div className="info-group">
            <div className="info-item">
              <label>Street Address</label>
              <p>{application.street_address}</p>
            </div>
            <div className="info-item">
              <label>City</label>
              <p>{application.city}</p>
            </div>
            <div className="info-item">
              <label>State/Region</label>
              <p>{application.state}</p>
            </div>
            <div className="info-item">
              <label>Country</label>
              <p>{application.country}</p>
            </div>
            {application.postal_code && (
              <div className="info-item">
                <label>Postal Code</label>
                <p>{application.postal_code}</p>
              </div>
            )}
          </div>
        </section>

        {/* Pet Information Section */}
        <section className="detail-section">
          <h2>Pet Experience</h2>
          <div className="info-group">
            <div className="info-item">
              <label>Number of Pets</label>
              <p>{application.pet_count}</p>
            </div>
            <div className="info-item">
              <label>Pet Types They Can Take</label>
              <div className="pet-types">
                {application.can_take_dogs && <span className="pet-tag">🐕 Dogs</span>}
                {application.can_take_cats && <span className="pet-tag">🐈 Cats</span>}
                {application.can_take_rabbits && <span className="pet-tag">🐰 Rabbits</span>}
                {application.can_take_others && (
                  <span className="pet-tag">Others: {application.can_take_others}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Story & Introduction Section */}
        <section className="detail-section full-width">
          <h2>Why They Want to Be a Holiday Family</h2>
          <div className="text-content">{application.motivation}</div>
        </section>

        <section className="detail-section full-width">
          <h2>About Them</h2>
          <div className="text-content">{application.introduction}</div>
        </section>

        {/* Family Photos Section */}
        {application.family_photos.length > 0 && (
          <section className="detail-section full-width">
            <h2>Home Environment Photos ({application.family_photos.length})</h2>
            <div className="photo-gallery">
              {application.family_photos.map((photo) => (
                <div key={photo.id} className="photo-item">
                  <img src={photo.photo} alt="Family home" />
                  <p className="photo-date">
                    {new Date(photo.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ID Document Section */}
        {application.id_document && (
          <section className="detail-section full-width">
            <h2>ID Document</h2>
            <a href={application.id_document} target="_blank" rel="noopener noreferrer" className="document-link">
              📄 View ID Document
            </a>
          </section>
        )}
      </div>
    </div>
  )
}
