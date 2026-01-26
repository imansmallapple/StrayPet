// src/views/holiday-family/certified-user-detail/index.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Container, Row, Col, Spinner, Alert, Card, Button, Form } from 'react-bootstrap'
import { authApi, type UserMe } from '@/services/modules/auth'
import { holidayFamilyApi } from '@/services/modules/holiday-family'
import './index.scss'

interface PhotoWithId {
  file: File
  id: string
}

export default function CertifiedUserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [userData, setUserData] = useState<UserMe | null>(null)
  const [application, setApplication] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserMe | null>(null)
  const [newPhotos, setNewPhotos] = useState<PhotoWithId[]>([])
  const [deletePhotoIds, setDeletePhotoIds] = useState<number[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (!userId) {
          setError('User ID not found')
          setLoading(false)
          return
        }

        // 获取当前登录用户信息
        const { data: current } = await authApi.getProfile()
        if (!alive) return
        setCurrentUser(current)

        const userId_num = Number(userId)

        // 获取用户信息
        const { data: user } = await authApi.getUserProfile(userId_num)
        if (!alive) return

        // 检查用户是否已认证
        if (!user.is_holiday_family_certified) {
          setError('This user is not a verified Holiday Family partner')
          setLoading(false)
          return
        }

        // 处理avatar URL
        if (user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('/')) {
          user.avatar = `http://localhost:8000${user.avatar}`
        }

        setUserData(user)

        // 获取该用户的Holiday Family应用信息
        try {
          const { data: appData } = await holidayFamilyApi.getUserApplication(userId_num)
          console.warn('========== COMPLETE APPLICATION DATA ==========')
          console.warn(JSON.stringify(appData, null, 2))
          console.warn('========== END APPLICATION DATA ==========')
          console.warn('Has family_photos field:', 'family_photos' in appData)
          console.warn('Family photos value:', appData.family_photos)
          console.warn('Family photos type:', typeof appData.family_photos)
          console.warn('Family photos is array:', Array.isArray(appData.family_photos))
          if (Array.isArray(appData.family_photos)) {
            console.warn('Family photos count:', appData.family_photos.length)
            if (appData.family_photos.length > 0) {
              console.warn('First photo:', JSON.stringify(appData.family_photos[0], null, 2))
            }
          }
          setApplication(appData)
          setEditData(appData)
        } catch (err) {
          console.warn('Failed to load Holiday Family application:', err)
          // 不显示错误，应用信息可能不存在
        }
      } catch (e: any) {
        if (alive) {
          setError(e?.response?.data?.detail || 'Failed to load user information')
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => { alive = false }
  }, [userId])

  const handleSaveChanges = async () => {
    if (!application?.id) return
    
    setSaving(true)
    try {
      // 保存应用信息
      const updatePayload = {
        phone: editData.phone,
        street_address: editData.street_address,
        city: editData.city,
        state: editData.state,
        postal_code: editData.postal_code,
        motivation: editData.motivation,
        introduction: editData.introduction,
      }
      
      const { data } = await holidayFamilyApi.updateApplication(application.id.toString(), updatePayload as any)
      setApplication(data)
      setEditData(data)
      
      // 如果有照片变化，保存照片
      if (newPhotos.length > 0 || deletePhotoIds.length > 0) {
        const photoFiles = newPhotos.map((p) => p.file)
        await holidayFamilyApi.updatePhotos(application.id.toString(), photoFiles, deletePhotoIds)
        // 重新获取更新后的应用数据
        const { data: updatedApp } = await holidayFamilyApi.getUserApplication(application.user)
        setApplication(updatedApp)
        setEditData(updatedApp)
      }
      
      setNewPhotos([])
      setDeletePhotoIds([])
      setIsEditing(false)
    } catch (err: any) {
      console.warn('Failed to update application:', err)
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isOwner = currentUser?.id === userData?.id

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate('/holiday-family')} variant="primary">
          Back to Holiday Families
        </Button>
      </Container>
    )
  }

  if (!userData) {
    return (
      <Container className="py-5">
        <Alert variant="warning">User information not found</Alert>
      </Container>
    )
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button 
            onClick={() => navigate('/holiday-family')} 
            variant="outline-secondary"
          >
            <i className="bi bi-chevron-left me-2"></i>Back to Families
          </Button>
          
          {isOwner && (
            isEditing ? (
              <div className="d-flex gap-2">
                <Button 
                  variant="success"
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  <i className="bi bi-check me-1"></i>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditData(application)
                  }}
                  disabled={saving}
                >
                  <i className="bi bi-x me-1"></i>Cancel
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline-primary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <i className="bi bi-pencil me-1"></i>Edit Profile
              </Button>
            )
          )}
        </div>

        <Card className="certified-user-card">
          <Card.Body className="p-0">
            {/* 用户头部信息 */}
            <div className="user-header">
              <Row className="align-items-center">
                <Col md={3} className="text-center">
                  <div className="user-avatar-container">
                    {userData.avatar && typeof userData.avatar === 'string' ? (
                      <img 
                        src={userData.avatar} 
                        alt={userData.username}
                        className="user-avatar"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/150?text=Avatar'
                        }}
                      />
                    ) : (
                      <div className="placeholder-avatar">
                        <i className="bi bi-person-circle"></i>
                      </div>
                    )}
                    <div className="verified-badge-large">
                      <i className="bi bi-check-circle-fill"></i>
                      <span>Verified</span>
                    </div>
                  </div>
                </Col>
                <Col md={9}>
                  <h2 className="user-name">{userData.first_name || userData.username}</h2>
                  <p className="user-username">@{userData.username}</p>
                  <div className="user-status">
                    <span className="badge bg-success">
                      <i className="bi bi-star-fill me-1"></i>Holiday Family Verified
                    </span>
                  </div>
                </Col>
              </Row>
            </div>

            {/* 用户详情信息 */}
            <div className="user-details-section">
              <h3>Contact Information</h3>
              <Row className="details-grid">
                <Col md={6} className="detail-item">
                  <label>Email</label>
                  <p>{userData.email}</p>
                </Col>
                {userData.phone && (
                  <Col md={6} className="detail-item">
                    <label>Phone Number</label>
                    <p>{userData.phone}</p>
                  </Col>
                )}
                {userData.first_name && (
                  <Col md={6} className="detail-item">
                    <label>First Name</label>
                    <p>{userData.first_name}</p>
                  </Col>
                )}
                {userData.last_name && (
                  <Col md={6} className="detail-item">
                    <label>Last Name</label>
                    <p>{userData.last_name}</p>
                  </Col>
                )}
                {application && application.phone && (
                  <Col md={6} className="detail-item">
                    <label>Phone Number</label>
                    {isEditing ? (
                      <Form.Control
                        type="tel"
                        value={editData?.phone || ''}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      />
                    ) : (
                      <p>{application.phone}</p>
                    )}
                  </Col>
                )}
              </Row>
            </div>

            {/* Holiday Family 申请信息 */}
            {application && (
              <>
                <div className="address-section">
                  <h3>Our Family Address</h3>
                  <Row className="details-grid">
                    {(editData?.street_address || application.street_address) && (
                      <Col md={12} className="detail-item">
                        <label>Street Address</label>
                        {isEditing ? (
                          <Form.Control
                            type="text"
                            value={editData?.street_address || ''}
                            onChange={(e) => setEditData({...editData, street_address: e.target.value})}
                          />
                        ) : (
                          <p>{application.street_address}</p>
                        )}
                      </Col>
                    )}
                    {(editData?.city || application.city) && (
                      <Col md={6} className="detail-item">
                        <label>City</label>
                        {isEditing ? (
                          <Form.Control
                            type="text"
                            value={editData?.city || ''}
                            onChange={(e) => setEditData({...editData, city: e.target.value})}
                          />
                        ) : (
                          <p>{application.city}</p>
                        )}
                      </Col>
                    )}
                    {(editData?.state || application.state) && (
                      <Col md={6} className="detail-item">
                        <label>State</label>
                        {isEditing ? (
                          <Form.Control
                            type="text"
                            value={editData?.state || ''}
                            onChange={(e) => setEditData({...editData, state: e.target.value})}
                          />
                        ) : (
                          <p>{application.state}</p>
                        )}
                      </Col>
                    )}
                    {(editData?.country || application.country) && (
                      <Col md={6} className="detail-item">
                        <label>Country</label>
                        {isEditing ? (
                          <Form.Control
                            type="text"
                            value={editData?.country || ''}
                            disabled
                          />
                        ) : (
                          <p>{application.country}</p>
                        )}
                      </Col>
                    )}
                    {(editData?.postal_code || application.postal_code) && (
                      <Col md={6} className="detail-item">
                        <label>Postal Code</label>
                        {isEditing ? (
                          <Form.Control
                            type="text"
                            value={editData?.postal_code || ''}
                            onChange={(e) => setEditData({...editData, postal_code: e.target.value})}
                          />
                        ) : (
                          <p>{application.postal_code}</p>
                        )}
                      </Col>
                    )}
                  </Row>
                </div>

                <div className="home-environment-section">
                  <h3>Home Environment</h3>
                  <Row className="details-grid">
                    {application.pet_count !== undefined && (
                      <Col md={6} className="detail-item">
                        <label>Number of Pets In Our Family</label>
                        <p>{application.pet_count}</p>
                      </Col>
                    )}
                    <Col md={12} className="detail-item">
                      <label>Pet Types We Take Care</label>
                      <p>
                        {[
                          application.can_take_dogs && '🐕 Dogs',
                          application.can_take_cats && '🐱 Cats',
                          application.can_take_rabbits && '🐰 Rabbits',
                          application.can_take_others && `Others: ${application.can_take_others}`
                        ].filter(Boolean).join(', ')}
                      </p>
                    </Col>
                  </Row>

                  {/* 家庭环境照片 */}
                  {(() => {
                    const hasPhotos = application.family_photos && application.family_photos.length > 0
                    const showPhotoSection = hasPhotos || isEditing
                    
                    if (!showPhotoSection) return null
                    
                    return (
                      <div className="family-photos-section mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <label className="d-block mb-0">
                            Family Environment Photos {hasPhotos ? `(${application.family_photos.length})` : ''}
                          </label>
                          {isEditing && (
                            <Button 
                              size="sm" 
                              variant="outline-primary"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <i className="bi bi-plus me-1"></i>Add Photos
                            </Button>
                          )}
                        </div>
                        
                        <Row className="family-photos-grid">
                          {/* 现有照片 */}
                          {application.family_photos?.map((photo: any) => {
                            const photoUrl = photo.photo || ''
                            return (
                              <Col key={photo.id} xs={6} sm={4} md={3} className="mb-3">
                                <div className="family-photo-item">
                                  <img
                                    src={photoUrl}
                                    alt="Family environment"
                                    className="family-photo-img"
                                    onError={(e) => {
                                      e.currentTarget.src = 'https://via.placeholder.com/200?text=Photo+Error'
                                    }}
                                  />
                                  {isEditing && (
                                    <div className="photo-delete-btn">
                                      <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => {
                                          setDeletePhotoIds([...deletePhotoIds, photo.id])
                                          // 从显示列表中移除
                                          setApplication({
                                            ...application,
                                            family_photos: application.family_photos.filter((p: any) => p.id !== photo.id)
                                          })
                                        }}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </Col>
                            )
                          })}
                          
                          {/* 新上传的照片预览 */}
                          {newPhotos.map((photoItem) => (
                            <Col key={photoItem.id} xs={6} sm={4} md={3} className="mb-3">
                              <div className="family-photo-item">
                                <img
                                  src={URL.createObjectURL(photoItem.file)}
                                  alt="New photo"
                                  className="family-photo-img"
                                />
                                <div className="photo-delete-btn">
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => {
                                      setNewPhotos(newPhotos.filter((p) => p.id !== photoItem.id))
                                    }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </div>
                                <div className="photo-new-badge">
                                  <span>New</span>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                        
                        {newPhotos.length === 0 && !hasPhotos && isEditing && (
                          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                            <p style={{ color: '#6b7280', marginBottom: '10px' }}>No photos uploaded yet</p>
                            <Button 
                              size="sm" 
                              variant="primary"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <i className="bi bi-cloud-arrow-up me-1"></i>Upload Photos
                            </Button>
                          </div>
                        )}
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            // 为每个文件添加唯一ID，避免ESLint警告
                            const filesWithId = files.map(file => ({
                              file,
                              id: `${file.name}-${Date.now()}-${Math.random()}`
                            }))
                            setNewPhotos([...newPhotos, ...filesWithId])
                          }}
                        />
                      </div>
                    )
                  })()}
                </div>

                <div className="pet-experience-section">
                  <h3>About Us</h3>
                  <Row className="details-grid">
                    {(editData?.motivation || application.motivation) && (
                      <Col md={12} className="detail-item">
                        <label>Motivation</label>
                        {isEditing ? (
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={editData?.motivation || ''}
                            onChange={(e) => setEditData({...editData, motivation: e.target.value})}
                          />
                        ) : (
                          <p className="long-text">{application.motivation}</p>
                        )}
                      </Col>
                    )}
                    {(editData?.introduction || application.introduction) && (
                      <Col md={12} className="detail-item">
                        <label>Our Background</label>
                        {isEditing ? (
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={editData?.introduction || ''}
                            onChange={(e) => setEditData({...editData, introduction: e.target.value})}
                          />
                        ) : (
                          <p className="long-text">{application.introduction}</p>
                        )}
                      </Col>
                    )}
                  </Row>
                </div>
              </>
            )}

            {/* Home Environment 部分 */}
            {(userData.living_situation || userData.has_yard !== undefined || userData.other_pets) && (
              <div className="home-environment-section">
                <h3>Home Environment</h3>
                <Row className="details-grid">
                  {userData.living_situation && (
                    <Col md={6} className="detail-item">
                      <label>Living Situation</label>
                      <p>{userData.living_situation}</p>
                    </Col>
                  )}
                  {userData.has_yard !== undefined && (
                    <Col md={6} className="detail-item">
                      <label>Has Yard</label>
                      <p>{userData.has_yard ? 'Yes' : 'No'}</p>
                    </Col>
                  )}
                  {userData.other_pets && (
                    <Col md={12} className="detail-item">
                      <label>Other Pets in Home</label>
                      <p>{userData.other_pets}</p>
                    </Col>
                  )}
                </Row>
              </div>
            )}

            {/* Pet Experience 部分 */}
            {(userData.has_experience !== undefined || userData.preferred_species || userData.preferred_size) && (
              <div className="pet-experience-section">
                <h3>Pet Experience</h3>
                <Row className="details-grid">
                  <Col md={6} className="detail-item">
                    <label>Pet Keeping Experience</label>
                    <p>{userData.has_experience ? 'Yes, I have experience with pets' : 'No, I am new to pet care'}</p>
                  </Col>
                  {userData.preferred_species && (
                    <Col md={6} className="detail-item">
                      <label>Preferred Pet Species</label>
                      <p>{userData.preferred_species}</p>
                    </Col>
                  )}
                  {userData.preferred_size && (
                    <Col md={6} className="detail-item">
                      <label>Preferred Pet Size</label>
                      <p>{userData.preferred_size}</p>
                    </Col>
                  )}
                </Row>
              </div>
            )}

            {/* 宠物偏好信息 */}
            {(userData.prefer_vaccinated || userData.prefer_sterilized || userData.prefer_dewormed || userData.prefer_child_friendly) && (
              <div className="pet-preferences-section">
                <h3>Pet Care Preferences</h3>
                <Row className="details-grid">
                  {userData.prefer_vaccinated && (
                    <Col md={6} className="detail-item">
                      <label>Prefer Vaccinated Pets</label>
                      <p className="preference-check">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>Yes
                      </p>
                    </Col>
                  )}
                  {userData.prefer_sterilized && (
                    <Col md={6} className="detail-item">
                      <label>Prefer Sterilized Pets</label>
                      <p className="preference-check">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>Yes
                      </p>
                    </Col>
                  )}
                  {userData.prefer_dewormed && (
                    <Col md={6} className="detail-item">
                      <label>Prefer Dewormed Pets</label>
                      <p className="preference-check">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>Yes
                      </p>
                    </Col>
                  )}
                  {userData.prefer_child_friendly && (
                    <Col md={6} className="detail-item">
                      <label>Prefer Child-Friendly Pets</label>
                      <p className="preference-check">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>Yes
                      </p>
                    </Col>
                  )}
                </Row>
              </div>
            )}

            {/* 其他信息 / Tell us about yourself 部分 */}
            {userData.additional_notes && (
              <div className="additional-notes-section">
                <h3>Tell Us About Yourself</h3>
                <p className="notes-content">{userData.additional_notes}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="action-buttons">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate(`/user/profile/${userData.id}`)}
              >
                <i className="bi bi-person-circle me-2"></i>View Full Profile
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
