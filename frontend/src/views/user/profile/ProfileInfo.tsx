import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { useEffect, useState, useRef, Fragment } from 'react'
import { Button, Modal, Form, Spinner, Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import './ProfileInfo.scss'

export interface ProfileInfoProps {
  me: ApiUserMe
  isOtherUserProfile?: boolean
  currentUser?: ApiUserMe | null
}

export default function ProfileInfo({ me, isOtherUserProfile = false, currentUser }: ProfileInfoProps) {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [userData, setUserData] = useState(me)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(me)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [friendshipStatus, setFriendshipStatus] = useState<any>(null)
  const [loadingFriendship, setLoadingFriendship] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageError, setMessageError] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resettingAvatar, setResettingAvatar] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // 加载好友关系
  useEffect(() => {
    if (!isOtherUserProfile || !me.id) return

    const loadFriendship = async () => {
      setLoadingFriendship(true)
      try {
        const { data } = await authApi.checkFriendship(me.id)
        setFriendshipStatus(data)
      } catch {
        setFriendshipStatus(null)
      } finally {
        setLoadingFriendship(false)
      }
    }

    loadFriendship()
  }, [me.id, isOtherUserProfile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const { data } = await authApi.uploadAvatar(file)
      console.warn('Avatar upload response:', data)
      console.warn('Avatar field from response:', data.avatar)
      console.warn('Avatar field type:', typeof data.avatar)
      
      // 强制添加缓存破坏参数，确保浏览器加载新图片
      const timestamp = `${Date.now()}_${Math.random().toString(36).substring(7)}`
      let newAvatarUrl: string | undefined = undefined
      
      if (typeof data.avatar === 'string' && data.avatar) {
        // 移除旧的版本参数
        let cleanUrl = data.avatar.split('?')[0].split('#')[0]
        // 如果是相对路径，转换为绝对URL（指向后端服务器）
        if (cleanUrl.startsWith('/')) {
          cleanUrl = `http://localhost:8000${cleanUrl}`
        }
        // 添加新的版本参数
        newAvatarUrl = `${cleanUrl}?v=${timestamp}`
      }
      
      console.warn('New avatar URL with cache bust:', newAvatarUrl)
      
      const updatedData = {
        ...data,
        avatar: newAvatarUrl || data.avatar
      } as typeof data
      
      // 使用Image预加载确保浏览器获取新图片
      const preloadImg = new Image()
      preloadImg.crossOrigin = 'anonymous'
      
      preloadImg.onload = () => {
        console.warn('Image preloaded successfully, updating UI')
        setUserData(updatedData)
        setEditData(updatedData)
        localStorage.setItem('user', JSON.stringify(updatedData))
        window.dispatchEvent(new Event('auth:updated'))
      }
      
      preloadImg.onerror = (error) => {
        console.warn('Image preload failed, error:', error)
        console.warn('Attempted to load URL:', newAvatarUrl)
        console.warn('Full avatar data:', updatedData.avatar)
        // 即使预加载失败，也更新UI
        setUserData(updatedData)
        setEditData(updatedData)
        localStorage.setItem('user', JSON.stringify(updatedData))
        window.dispatchEvent(new Event('auth:updated'))
      }
      
      console.warn('Starting image preload with URL:', newAvatarUrl)
      preloadImg.src = newAvatarUrl || ''
    } catch (error: any) {
      setUploadError(error?.response?.data?.error || 'Avatar upload failed, please try again')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleResetAvatar = async () => {
    setResettingAvatar(true)
    try {
      const { data } = await authApi.resetAvatarToDefault()
      
      // 强制添加缓存破坏参数
      const timestamp = `${Date.now()}_${Math.random().toString(36).substring(7)}`
      let newAvatarUrl: string | undefined = undefined
      
      if (typeof data.avatar === 'string' && data.avatar) {
        let cleanUrl = data.avatar.split('?')[0].split('#')[0]
        // 如果是相对路径，转换为绝对URL
        if (cleanUrl.startsWith('/')) {
          cleanUrl = `http://localhost:8000${cleanUrl}`
        }
        newAvatarUrl = `${cleanUrl}?v=${timestamp}`
      }
      
      const updatedData = {
        ...data,
        avatar: newAvatarUrl || data.avatar
      } as typeof data
      
      // 使用Image预加载确保浏览器获取新图片
      const preloadImg = new Image()
      preloadImg.crossOrigin = 'anonymous'
      
      preloadImg.onload = () => {
        console.warn('Reset avatar image preloaded successfully')
        setUserData(updatedData)
        setEditData(updatedData)
        localStorage.setItem('user', JSON.stringify(updatedData))
        window.dispatchEvent(new Event('auth:updated'))
        setShowResetModal(false)
      }
      preloadImg.onerror = () => {
        console.warn('Reset avatar image preload failed, updating UI anyway')
        setUserData(updatedData)
        setEditData(updatedData)
        localStorage.setItem('user', JSON.stringify(updatedData))
        window.dispatchEvent(new Event('auth:updated'))
        setShowResetModal(false)
      }
      preloadImg.src = newAvatarUrl || ''
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to reset avatar')
    } finally {
      setResettingAvatar(false)
    }
  }

  const handleAddFriend = async () => {
    setLoadingFriendship(true)
    try {
      const { data } = await authApi.addFriend(me.id)
      setFriendshipStatus(data)
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to add friend')
    } finally {
      setLoadingFriendship(false)
    }
  }

  const handleAcceptFriend = async () => {
    if (!friendshipStatus?.id) return
    setLoadingFriendship(true)
    try {
      const { data } = await authApi.acceptFriendRequest(friendshipStatus.id)
      setFriendshipStatus(data)
      // 触发事件通知其他组件刷新好友列表
      window.dispatchEvent(new Event('friendship:updated'))
      alert('Friend request accepted!')
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to accept friend request')
    } finally {
      setLoadingFriendship(false)
    }
  }

  const handleRejectFriend = async () => {
    if (!friendshipStatus?.id) return
    setLoadingFriendship(true)
    try {
      const { data } = await authApi.rejectFriendRequest(friendshipStatus.id)
      setFriendshipStatus(data)
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to reject friend request')
    } finally {
      setLoadingFriendship(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const payload: any = {
        has_experience: (editData as any).has_experience,
        living_situation: (editData as any).living_situation,
        has_yard: (editData as any).has_yard
      }
      const { data } = await authApi.updateProfile(payload)
      setUserData(data)
      setEditData(data)
      setIsEditing(false)
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to save profile information')
    } finally {
      setSaving(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return
    
    setSendingMessage(true)
    setMessageError('')
    try {
      await authApi.sendMessage(me.id, messageContent)
      setMessageContent('')
      setShowMessageModal(false)
      alert('Message sent successfully')
    } catch (error: any) {
      setMessageError(error?.response?.data?.error || 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password must be different from the old password')
      return
    }

    setChangingPassword(true)
    try {
      await authApi.changePassword(userData.id, {
        old_password: oldPassword,
        password: newPassword
      })
      alert('Password changed successfully')
      setShowPasswordModal(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      const errorMsg = error?.response?.data?.old_password?.[0] ||
                       error?.response?.data?.password?.[0] ||
                       error?.response?.data?.detail ||
                       error?.response?.data?.msg ||
                       'Failed to change password'
      setPasswordError(errorMsg)
    } finally {
      setChangingPassword(false)
    }
  }

  // 打开与用户的对话
  const handleOpenChat = () => {
    // 清除该用户在已关闭列表中的记录
    const stored = localStorage.getItem('closedConversations')
    if (stored) {
      try {
        const closed = new Set(JSON.parse(stored) as number[])
        closed.delete(me.id)
        localStorage.setItem('closedConversations', JSON.stringify(Array.from(closed)))
      } catch (e) {
        console.error('Failed to clear closed conversations:', e)
      }
    }
    // 导航到消息中心
    navigate(`/user/profile?tab=message-center&user=${me.id}`)
  }

  const avatarUrl = userData?.avatar 
    ? typeof userData.avatar === 'string' 
      ? userData.avatar.startsWith('http') 
        ? userData.avatar 
        : `http://localhost:8000${userData.avatar}`
      : URL.createObjectURL(userData.avatar as any)
    : undefined

  return (
    <Fragment>
      <div className="profile-card">
        {/* Holiday Family Certified Alert - moved to top */}
        {userData?.is_holiday_family_certified && (
          <div className="alert alert-success mb-0" style={{ padding: '12px 16px', borderRadius: 0, marginBottom: 0 }}>
            <i className="bi bi-check-circle me-2"></i>
            <strong>Holiday Family Verified</strong>
            <p className="mb-0 mt-1" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              This user has been verified as a Holiday Family partner.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="profile-card-header">
          <div className="header-title">
            <i className="bi bi-person-circle"></i>
            <h5 className="mb-0">Basic Information</h5>
          </div>
          {!isOtherUserProfile && (
            <div className="header-actions">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      setIsEditing(false)
                      setEditData(userData)
                    }}
                    disabled={saving}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <i className="bi bi-key me-1"></i>
                    Change Password
                  </Button>
                  {userData?.is_staff && (
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => navigate('/holiday-family/list')}
                    >
                      <i className="bi bi-list-check me-1"></i>
                      View Applications
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="profile-card-body">
          {uploadError && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setUploadError('')}>
              <i className="bi bi-exclamation-circle me-2"></i>
              {uploadError}
            </Alert>
          )}

          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <div className="profile-avatar-large">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userData?.username} className="avatar-img" />
                ) : (
                  <div className="avatar-initials">
                    {userData?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>
            <div className="avatar-controls">
              {!isOtherUserProfile && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  <div className="d-flex gap-2 mb-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-cloud-upload"></i>
                      {uploading ? 'Uploading...' : 'Upload Avatar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => setShowResetModal(true)}
                      disabled={uploading || !userData?.avatar}
                      className="d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                      Reset
                    </Button>
                  </div>
                  <small className="text-muted d-block">
                    <i className="bi bi-info-circle me-1"></i>
                    Supports JPG, PNG, GIF, WebP. Max 5MB
                  </small>
                </>
              )}
            </div>
          </div>

          {/* User Info Grid */}
          <div className="info-grid">
            <div className="info-item">
              <label className="info-label">Username</label>
              <div className="info-value">{userData?.username || <span className="empty-state">Not set</span>}</div>
            </div>
            
            <div className="info-item">
              <label className="info-label">Email</label>
              <div className="info-value">{userData?.email || <span className="empty-state">Not set</span>}</div>
            </div>

            <div className="info-item">
              <label className="info-label">Last Name</label>
              <div className="info-value">
                {isEditing && !isOtherUserProfile ? (
                  <input
                    type="text"
                    value={(editData as any).last_name || ''}
                    onChange={(e: any) => setEditData({...editData, last_name: e.target.value})}
                    placeholder="Enter last name"
                    className="form-control form-control-sm"
                  />
                ) : (
                  userData?.last_name || <span className="empty-state">Not set</span>
                )}
              </div>
            </div>

            <div className="info-item">
              <label className="info-label">First Name</label>
              <div className="info-value">
                {isEditing && !isOtherUserProfile ? (
                  <input
                    type="text"
                    value={(editData as any).first_name || ''}
                    onChange={(e: any) => setEditData({...editData, first_name: e.target.value})}
                    placeholder="Enter first name"
                    className="form-control form-control-sm"
                  />
                ) : (
                  userData?.first_name || <span className="empty-state">Not set</span>
                )}
              </div>
            </div>

            <div className="info-item">
              <label className="info-label">Phone</label>
              <div className="info-value">
                {isEditing && !isOtherUserProfile ? (
                  <input
                    type="tel"
                    value={(editData as any).phone || ''}
                    onChange={(e: any) => setEditData({...editData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="form-control form-control-sm"
                  />
                ) : (
                  userData?.phone || <span className="empty-state">Not set</span>
                )}
              </div>
            </div>

            <div className="info-item">
              <label className="info-label">Pet Experience</label>
              <div className="info-value">
                {isEditing && !isOtherUserProfile ? (
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="petExp"
                      checked={(editData as any).has_experience || false}
                      onChange={(e: any) => setEditData({...editData, has_experience: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="petExp">
                      Have pet experience
                    </label>
                  </div>
                ) : (
                  <span className={`info-badge ${(userData as any)?.has_experience ? 'badge-success' : 'badge-secondary'}`}>
                    <i className={`bi ${(userData as any)?.has_experience ? 'bi-check' : 'bi-dash'} me-1`}></i>
                    {(userData as any)?.has_experience ? 'Experienced' : 'No experience'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pet Care Section */}
          {!isOtherUserProfile && (
            <div className="pet-care-section">
              <div className="section-title">
                <i className="bi bi-heart-fill"></i>
                Pet Information
              </div>
              <div className="pet-info-items">
                <div className="pet-info-item">
                  <label className="pet-label">🏠 Living Situation</label>
                  <div className="pet-value">
                    {isEditing ? (
                      <select
                        value={(editData as any).living_situation || ''}
                        onChange={(e: any) => setEditData({...editData, living_situation: e.target.value})}
                        className="form-select form-select-sm"
                      >
                        <option value="">Select living situation</option>
                        <option value="apartment">🏢 Apartment</option>
                        <option value="house">🏠 House</option>
                        <option value="townhouse">🏘️ Townhouse</option>
                        <option value="farm">🌾 Farm</option>
                      </select>
                    ) : (
                      (userData as any)?.living_situation ? (
                        <span className="living-situation-badge">
                          {getLivingSituationLabel((userData as any)?.living_situation)}
                        </span>
                      ) : (
                        <span className="empty-state">Not set</span>
                      )
                    )}
                  </div>
                </div>

                <div className="pet-info-item">
                  <label className="pet-label">🏡 Has Yard</label>
                  <div className="pet-value">
                    {isEditing ? (
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="yardSwitch"
                          checked={(editData as any).has_yard || false}
                          onChange={(e: any) => setEditData({...editData, has_yard: e.target.checked})}
                        />
                        <label className="form-check-label" htmlFor="yardSwitch">
                          Has yard
                        </label>
                      </div>
                    ) : (
                      <span className={`info-badge ${(userData as any)?.has_yard ? 'badge-success' : 'badge-secondary'}`}>
                        <i className={`bi ${(userData as any)?.has_yard ? 'bi-check' : 'bi-dash'} me-1`}></i>
                        {(userData as any)?.has_yard ? 'Has yard' : 'No yard'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Friend Actions */}
          {isOtherUserProfile && (
            <div className="friend-actions">
              <h6 className="mb-3">
                <i className="bi bi-person-plus me-2"></i>
                Actions
              </h6>
              <div className="action-buttons">
                {friendshipStatus?.status === 'accepted' ? (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleOpenChat}
                    className="d-flex align-items-center gap-1"
                  >
                    <i className="bi bi-chat-dots"></i>
                    Send Message
                  </Button>
                ) : !friendshipStatus?.status ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddFriend}
                      disabled={loadingFriendship}
                      className="d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-person-plus"></i>
                      {loadingFriendship ? 'Loading...' : 'Add Friend'}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleOpenChat}
                      className="d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-chat-dots"></i>
                      发送私信
                    </Button>
                  </>
                ) : friendshipStatus.status === 'pending' ? (
                  <>
                    {friendshipStatus.from_user.id === currentUser?.id ? (
                      <>
                        <Button variant="secondary" size="sm" disabled className="d-flex align-items-center gap-1">
                          <i className="bi bi-check-circle"></i>
                          Request Sent
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleOpenChat}
                          className="d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-chat-dots"></i>
                          发送私信
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={handleAcceptFriend}
                          disabled={loadingFriendship}
                          className="d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-check-lg"></i>
                          Accept Request
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={handleRejectFriend}
                          disabled={loadingFriendship}
                          className="d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-x-lg"></i>
                          Reject
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleOpenChat}
                          className="d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-chat-dots"></i>
                          发送私信
                        </Button>
                      </>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Avatar Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="fw-600">
            <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
            Confirm Reset Avatar
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Are you sure you want to reset your avatar to the default? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleResetAvatar}
            disabled={resettingAvatar}
          >
            {resettingAvatar ? 'Resetting...' : 'Confirm Reset'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Message Modal */}
      <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="fw-600">
            <i className="bi bi-chat-dots me-2"></i>
            Send Message to {userData?.username}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {messageError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-circle me-2"></i>
              {messageError}
            </Alert>
          )}
          <Form.Group>
            <Form.Label className="fw-600 mb-2">Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type your message..."
              disabled={sendingMessage}
              maxLength={500}
              className="form-control-lg"
            />
            <small className="text-muted d-block mt-2">
              {messageContent.length}/500
            </small>
            {friendshipStatus?.status !== 'accepted' && (
              <Alert variant="warning" className="mt-2 mb-0 py-2">
                <i className="bi bi-info-circle me-2"></i>
                Non-friends can send up to 3 messages per day
              </Alert>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowMessageModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={sendingMessage || !messageContent.trim()}
          >
            {sendingMessage ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              <>
                <i className="bi bi-send me-1"></i>
                Send
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="fw-600">
            <i className="bi bi-key me-2"></i>
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {passwordError && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-circle me-2"></i>
              {passwordError}
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="fw-600 mb-2">Current Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={changingPassword}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-600 mb-2">New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your new password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={changingPassword}
            />
            <small className="text-muted d-block mt-2">
              At least 8 characters, preferably with uppercase, lowercase and numbers
            </small>
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-600 mb-2">Confirm New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={changingPassword}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowPasswordModal(false)
              setOldPassword('')
              setNewPassword('')
              setConfirmPassword('')
              setPasswordError('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleChangePassword}
            disabled={changingPassword}
          >
            {changingPassword ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Changing...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-1"></i>
                Change Password
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Fragment>
  )
}

function getLivingSituationLabel(situation?: string): string {
  if (!situation) return 'Not set'
  const situationMap: Record<string, string> = {
    apartment: '🏢 Apartment',
    house: '🏠 House',
    townhouse: '🏘️ Townhouse',
    farm: '🌾 Farm'
  }
  return situationMap[situation] || situation
}
