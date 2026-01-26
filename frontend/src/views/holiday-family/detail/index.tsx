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
  rejection_reason?: string
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
  const [showDocModal, setShowDocModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  useEffect(() => {
    if (!toastMessage) return

    const timer = setTimeout(() => {
      setToastMessage(null)
    }, 3000)

    return () => clearTimeout(timer)
  }, [toastMessage])

  const handleApprove = async () => {
    setApproving(true)
    try {
      const response = await holidayFamilyApi.approve(id as string)
      const appData = response.data.data || response.data
      setApplication(appData)
      setToastMessage({ type: 'success', text: 'Application approved successfully!' })
    } catch (_err) {
      setToastMessage({ type: 'error', text: 'Failed to approve application' })
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      const response = await holidayFamilyApi.reject(id as string, rejectReason)
      const appData = response.data.data || response.data
      setApplication(appData)
      setShowRejectModal(false)
      setRejectReason('')
      setToastMessage({ type: 'success', text: 'Application rejected successfully!' })
    } catch (err: any) {
      console.error('Reject error:', err)
      console.error('Error response:', err.response?.data)
      setToastMessage({ type: 'error', text: 'Failed to reject application' })
    } finally {
      setRejecting(false)
    }
  }

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
        Back to List
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
              <label>Can Take Care Of</label>
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
          <h2>Reason for this application</h2>
          <div className="text-content">{application.motivation}</div>
        </section>

        <section className="detail-section full-width">
          <h2>Description</h2>
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
            <button 
              type="button"
              className="document-link"
              onClick={() => setShowDocModal(true)}
              style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '16px' }}
            >
              📄 View ID Document
            </button>
          </section>
        )}

        {/* Action Buttons Section */}
        {application.status === 'pending' && (
          <section className="detail-section full-width action-buttons">
            <button 
              type="button"
              className="approve-btn"
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? 'Approving...' : '✓ Approve'}
            </button>
            <button 
              type="button"
              className="reject-btn"
              onClick={() => setShowRejectModal(true)}
              disabled={rejecting}
            >
              {rejecting ? 'Rejecting...' : '✕ Reject'}
            </button>
          </section>
        )}

        {/* Rejection Reason Section */}
        {application.status === 'rejected' && application.rejection_reason && (
          <section className="detail-section full-width rejection-reason">
            <h2>Rejection Reason</h2>
            <div className="reason-content">{application.rejection_reason}</div>
          </section>
        )}
      </div>

      {/* ID Document Modal */}
      {showDocModal && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              type="button"
              className="modal-close"
              onClick={() => setShowDocModal(false)}
            >
              ✕
            </button>
            <h2>ID Document</h2>
            {application.id_document.endsWith('.pdf') ? (
              <iframe
                src={application.id_document}
                title="ID Document"
                sandbox="allow-same-origin allow-presentation"
                style={{ width: '100%', height: '600px', border: 'none', borderRadius: '8px' }}
              />
            ) : (
              <img 
                src={application.id_document}
                alt="ID Document"
                style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: '8px' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content reject-modal" onClick={e => e.stopPropagation()}>
            <button 
              type="button"
              className="modal-close"
              onClick={() => setShowRejectModal(false)}
            >
              ✕
            </button>
            <h2>Reject Application</h2>
            <p className="reject-description">Please provide a reason for rejecting this application:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="reject-textarea"
              rows={6}
            />
            <div className="reject-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-reject-btn"
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type}`}>
          <div className="toast-content">
            {toastMessage.type === 'success' ? '✓' : '✕'} {toastMessage.text}
          </div>
        </div>
      )}
    </div>
  )
}
