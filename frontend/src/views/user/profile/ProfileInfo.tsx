import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { useEffect, useState, useRef, Fragment } from 'react'
import { Button, Modal, Form, Spinner, Alert } from 'react-bootstrap'
import './ProfileInfo.scss'

export interface ProfileInfoProps {
  me: ApiUserMe
  isOtherUserProfile?: boolean
  currentUser?: ApiUserMe | null
}

export default function ProfileInfo({ me, isOtherUserProfile = false, currentUser }: ProfileInfoProps) {
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
      setUploadError('文件大小超过 5MB')
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
      setUploadError(error?.response?.data?.error || '头像上传失败，请重试')
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
      alert(error?.response?.data?.error || '重置头像失败')
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
      alert(error?.response?.data?.error || '添加好友失败')
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
    } catch (error: any) {
      alert(error?.response?.data?.error || '接受好友请求失败')
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
      alert(error?.response?.data?.error || '拒绝好友请求失败')
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
      alert(error?.response?.data?.error || '保存个人信息失败')
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
      alert('消息已发送')
    } catch (error: any) {
      setMessageError(error?.response?.data?.error || '消息发送失败')
    } finally {
      setSendingMessage(false)
    }
  }

  const avatarUrl = userData?.avatar 
    ? typeof userData.avatar === 'string' 
      ? userData.avatar  // avatar URL已在handleAvatarUpload和handleResetAvatar中包含时间戳
      : URL.createObjectURL(userData.avatar as any)
    : undefined

  return (
    <Fragment>
      <div className="profile-card">
        {/* Header */}
        <div className="profile-card-header">
          <div className="header-title">
            <i className="bi bi-person-circle"></i>
            <h5 className="mb-0">基本信息</h5>
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
                    {saving ? '保存中...' : '保存'}
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
                    取消
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="bi bi-pencil me-1"></i>
                  编辑信息
                </Button>
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
                      {uploading ? '上传中...' : '上传头像'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => setShowResetModal(true)}
                      disabled={uploading || !userData?.avatar}
                      className="d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                      重置
                    </Button>
                  </div>
                  <small className="text-muted d-block">
                    <i className="bi bi-info-circle me-1"></i>
                    支持 JPG、PNG、GIF、WebP，最大 5MB
                  </small>
                </>
              )}
            </div>
          </div>

          {/* User Info Grid */}
          <div className="info-grid">
            <div className="info-item">
              <label className="info-label">用户名</label>
              <div className="info-value">{userData?.username || '—'}</div>
            </div>
            
            <div className="info-item">
              <label className="info-label">邮箱</label>
              <div className="info-value">{userData?.email || '—'}</div>
            </div>

            <div className="info-item">
              <label className="info-label">姓氏</label>
              <div className="info-value">
                {isEditing && !isOtherUserProfile ? (
                  <input
                    type="text"
                    value={(editData as any).last_name || ''}
                    onChange={(e: any) => setEditData({...editData, last_name: e.target.value})}
                    placeholder="输入姓氏"
                    className="form-control form-control-sm"
                  />
                ) : (
                  userData?.last_name || '—'
                )}
              </div>
            </div>

            <div className="info-item">
              <label className="info-label">名字</label>
              <div className="info-value">
                {isEditing && !isOtherUserProfile ? (
                  <input
                    type="text"
                    value={(editData as any).first_name || ''}
                    onChange={(e: any) => setEditData({...editData, first_name: e.target.value})}
                    placeholder="输入名字"
                    className="form-control form-control-sm"
                  />
                ) : (
                  userData?.first_name || '—'
                )}
              </div>
            </div>

            <div className="info-item">
              <label className="info-label">电话</label>
              <div className="info-value">
                {isEditing && !isOtherUserProfile ? (
                  <input
                    type="tel"
                    value={(editData as any).phone || ''}
                    onChange={(e: any) => setEditData({...editData, phone: e.target.value})}
                    placeholder="输入电话号码"
                    className="form-control form-control-sm"
                  />
                ) : (
                  userData?.phone || '—'
                )}
              </div>
            </div>

            <div className="info-item">
              <label className="info-label">养宠经验</label>
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
                      有养宠物经验
                    </label>
                  </div>
                ) : (
                  <span className={`badge ${(userData as any)?.has_experience ? 'bg-success' : 'bg-secondary'}`}>
                    <i className={`bi ${(userData as any)?.has_experience ? 'bi-check' : 'bi-dash'} me-1`}></i>
                    {(userData as any)?.has_experience ? '有经验' : '无经验'}
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
                宠物信息
              </div>
              <div className="pet-info-items">
                <div className="pet-info-item">
                  <label className="pet-label">🏠 居住环境</label>
                  <div className="pet-value">
                    {isEditing ? (
                      <select
                        value={(editData as any).living_situation || ''}
                        onChange={(e: any) => setEditData({...editData, living_situation: e.target.value})}
                        className="form-select form-select-sm"
                      >
                        <option value="">选择居住环境</option>
                        <option value="apartment">🏢 公寓</option>
                        <option value="house">🏠 独栋房屋</option>
                        <option value="townhouse">🏘️ 联排别墅</option>
                        <option value="farm">🌾 农场</option>
                      </select>
                    ) : (
                      getLivingSituationLabel((userData as any)?.living_situation)
                    )}
                  </div>
                </div>

                <div className="pet-info-item">
                  <label className="pet-label">🏡 有无院子</label>
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
                          有院子
                        </label>
                      </div>
                    ) : (
                      <span className={`badge ${(userData as any)?.has_yard ? 'bg-success' : 'bg-secondary'}`}>
                        <i className={`bi ${(userData as any)?.has_yard ? 'bi-check' : 'bi-dash'} me-1`}></i>
                        {(userData as any)?.has_yard ? '有' : '无'}
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
                操作
              </h6>
              <div className="action-buttons">
                {!friendshipStatus?.status ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddFriend}
                      disabled={loadingFriendship}
                      className="d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-person-plus"></i>
                      {loadingFriendship ? '加载中...' : '添加好友'}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setShowMessageModal(true)}
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
                          已发送申请
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setShowMessageModal(true)}
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
                          接受请求
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={handleRejectFriend}
                          disabled={loadingFriendship}
                          className="d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-x-lg"></i>
                          拒绝
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setShowMessageModal(true)}
                          className="d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-chat-dots"></i>
                          发送私信
                        </Button>
                      </>
                    )}
                  </>
                ) : friendshipStatus.status === 'accepted' ? (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setShowMessageModal(true)}
                      className="d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-chat-dots"></i>
                      发送私信
                    </Button>
                    <Button variant="secondary" size="sm" disabled className="d-flex align-items-center gap-1">
                      <i className="bi bi-check-circle"></i>
                      已成为好友
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" disabled className="d-flex align-items-center gap-1">
                    <i className="bi bi-dash-circle"></i>
                    已拒绝
                  </Button>
                )}
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
            确认重置头像
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            确定要将头像重置为默认头像吗？此操作无法撤销。
          </p>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            取消
          </Button>
          <Button 
            variant="danger" 
            onClick={handleResetAvatar}
            disabled={resettingAvatar}
          >
            {resettingAvatar ? '重置中...' : '确认重置'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Message Modal */}
      <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="fw-600">
            <i className="bi bi-chat-dots me-2"></i>
            给 {userData?.username} 发送消息
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
            <Form.Label className="fw-600 mb-2">消息内容</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="输入你想说的话…"
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
                非好友每天最多发送3条消息
              </Alert>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowMessageModal(false)}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={sendingMessage || !messageContent.trim()}
          >
            {sendingMessage ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                发送中...
              </>
            ) : (
              <>
                <i className="bi bi-send me-1"></i>
                发送
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Fragment>
  )
}

function getLivingSituationLabel(situation?: string): string {
  if (!situation) return '—'
  const situationMap: Record<string, string> = {
    apartment: '🏢 公寓',
    house: '🏠 独栋房屋',
    townhouse: '🏘️ 联排别墅',
    farm: '🌾 农场'
  }
  return situationMap[situation] || situation
}
