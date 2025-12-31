import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { useEffect, useState, useRef, Fragment } from 'react'
import { Button, Modal, Form, Card } from 'react-bootstrap'

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

    setUploading(true)
    setUploadError('')

    try {
      const { data } = await authApi.uploadAvatar(file)
      setUserData(data)
    } catch (error: any) {
      setUploadError(error?.response?.data?.error || '头像上传失败')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleResetAvatar = async () => {
    if (!window.confirm('确定要重置为默认头像吗？')) return
    
    setUploading(true)
    setUploadError('')

    try {
      const { data } = await authApi.resetAvatarToDefault()
      setUserData(data)
    } catch (error: any) {
      setUploadError(error?.response?.data?.error || '重置头像失败')
    } finally {
      setUploading(false)
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
      ? userData.avatar
      : URL.createObjectURL(userData.avatar as any)
    : undefined

  return (
    <Fragment>
      <Card className="profile-card shadow-sm border-0">
        <Card.Header className="profile-card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="bi bi-person-circle me-2"></i>
              个人信息
            </h4>
            {!isOtherUserProfile && (
              <div className="d-flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      <i className="bi bi-check-lg me-1"></i>
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setIsEditing(false)
                        setEditData(userData)
                      }}
                      disabled={saving}
                    >
                      <i className="bi bi-x-lg me-1"></i>
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    编辑信息
                  </button>
                )}
              </div>
            )}
          </div>
        </Card.Header>
        <Card.Body className="profile-card-body">
          {uploadError && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>
              {uploadError}
              <button type="button" className="btn-close" onClick={() => setUploadError('')}></button>
            </div>
          )}

          {/* Avatar Section */}
          <div className="profile-avatar-section mb-4">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userData?.username} className="avatar-img" />
                ) : (
                  <span className="avatar-placeholder">{userData?.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {!isOtherUserProfile && (
                <div className="avatar-controls">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="上传头像"
                  >
                    <i className="bi bi-cloud-upload me-1"></i>
                    {uploading ? '上传中…' : '上传头像'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleResetAvatar}
                    disabled={uploading || !userData?.avatar}
                    title="重置为默认头像"
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    重置
                  </button>
                  <small className="d-block text-muted mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    支持 JPG、PNG、GIF、WebP，最大 5MB
                  </small>
                </div>
              )}
            </div>
          </div>

          <div className="profile-info-grid">
            <InfoRow 
              label="用户名" 
              value={userData?.username ?? '—'}
              icon="at"
            />
            <InfoRow 
              label="邮箱" 
              value={userData?.email ?? '—'}
              icon="envelope"
            />
            <InfoRow 
              label="电话" 
              value={userData?.phone ?? '—'}
              icon="telephone"
            />
            <InfoRow 
              label="姓氏" 
              value={userData?.last_name ?? '—'}
              icon="person"
            />
            <InfoRow 
              label="名字" 
              value={userData?.first_name ?? '—'}
              icon="person"
            />
          </div>

          <hr className="my-4" />

          {/* 宠物相关信息 */}
          <div className="profile-pet-info">
            <h5 className="mb-3">
              <i className="bi bi-paw-fill me-2"></i>
              养宠物信息
            </h5>

            <div className="pet-info-group">
              <label className="pet-info-label">养宠物经验</label>
              <div className="pet-info-content">
                {isEditing && !isOtherUserProfile ? (
                  <Form.Check
                    type="checkbox"
                    checked={(editData as any).has_experience}
                    onChange={(e: any) => setEditData({...editData, has_experience: e.target.checked})}
                    label="有养宠物经验"
                  />
                ) : (
                  <span className="badge bg-info">
                    {(userData as any)?.has_experience ? '有经验' : '无经验'}
                  </span>
                )}
              </div>
            </div>

            <div className="pet-info-group">
              <label className="pet-info-label">居住环境</label>
              <div className="pet-info-content">
                {isEditing && !isOtherUserProfile ? (
                  <Form.Select
                    value={(editData as any).living_situation || ''}
                    onChange={(e: any) => setEditData({...editData, living_situation: e.target.value})}
                    size="sm"
                  >
                    <option value="">选择居住环境</option>
                    <option value="apartment">公寓</option>
                    <option value="house">独栋房屋</option>
                    <option value="townhouse">联排别墅</option>
                    <option value="farm">农场</option>
                  </Form.Select>
                ) : (
                  <span className="badge bg-secondary">
                    {getLivingSituationLabel((userData as any)?.living_situation)}
                  </span>
                )}
              </div>
            </div>

            <div className="pet-info-group">
              <label className="pet-info-label">有无院子</label>
              <div className="pet-info-content">
                {isEditing && !isOtherUserProfile ? (
                  <Form.Check
                    type="checkbox"
                    checked={(editData as any).has_yard}
                    onChange={(e: any) => setEditData({...editData, has_yard: e.target.checked})}
                    label="有院子"
                  />
                ) : (
                  <span className="badge bg-primary">
                    {(userData as any)?.has_yard ? '有院子' : '无院子'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Friend Actions */}
          {isOtherUserProfile && friendshipStatus !== null && (
            <>
              <hr className="my-4" />
              <div className="friend-actions">
                <div className="d-flex gap-2 flex-wrap">
                  {!friendshipStatus?.status ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddFriend}
                        disabled={loadingFriendship}
                      >
                        <i className="bi bi-person-plus me-1"></i>
                        添加好友
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowMessageModal(true)}
                      >
                        <i className="bi bi-chat-dots me-1"></i>
                        发送私信
                      </Button>
                    </>
                  ) : friendshipStatus.status === 'pending' ? (
                    <>
                      {friendshipStatus.from_user.id === currentUser?.id ? (
                        <>
                          <Button variant="secondary" size="sm" disabled>
                            <i className="bi bi-hourglass-split me-1"></i>
                            已发送申请
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setShowMessageModal(true)}
                          >
                            <i className="bi bi-chat-dots me-1"></i>
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
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            接受好友请求
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={handleRejectFriend}
                            disabled={loadingFriendship}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            拒绝
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setShowMessageModal(true)}
                          >
                            <i className="bi bi-chat-dots me-1"></i>
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
                      >
                        <i className="bi bi-chat-dots me-1"></i>
                        发送私信
                      </Button>
                      <Button variant="secondary" size="sm" disabled>
                        <i className="bi bi-check-circle me-1"></i>
                        已成为好友
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      <i className="bi bi-x-circle me-1"></i>
                      已拒绝
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Message Modal */}
      <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-chat-dots me-2"></i>
            给 {userData?.username} 发送私信
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {messageError && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {messageError}
              <button type="button" className="btn-close" onClick={() => setMessageError('')}></button>
            </div>
          )}
          <form>
            <div className="mb-3">
              <label className="form-label">消息内容</label>
              <textarea
                className="form-control"
                rows={4}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="输入消息内容…"
                disabled={sendingMessage}
                maxLength={500}
              />
              <small className="text-muted d-block mt-1">
                {messageContent.length}/500
              </small>
              {friendshipStatus?.status !== 'accepted' && (
                <div className="alert alert-warning mt-2 small mb-0">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  非好友每天最多发送3条私信
                </div>
              )}
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMessageModal(false)}>
            关闭
          </Button>
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={sendingMessage || !messageContent.trim()}
          >
            {sendingMessage ? '发送中…' : '发送'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Fragment>
  )
}

function InfoRow({ label, value, icon = 'info-circle' }: { label: string; value: string; icon?: string }) {
  return (
    <div className="info-row">
      <div className="info-row-label">
        <i className={`bi bi-${icon} me-2`}></i>
        {label}
      </div>
      <div className="info-row-value">{value}</div>
    </div>
  )
}

function getLivingSituationLabel(situation?: string): string {
  if (!situation) return '—'
  const situationMap: Record<string, string> = {
    apartment: '公寓',
    house: '独栋房屋',
    townhouse: '联排别墅',
    farm: '农场'
  }
  return situationMap[situation] || situation
}
