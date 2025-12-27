import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import { blogApi, type Comment } from '@/services/modules/blog'
import { useEffect, useState, useRef, Fragment } from 'react'
import { Container, Row, Col, Nav, Card, Spinner, Alert, Pagination, Button, Modal } from 'react-bootstrap'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import MyArticlesList from './MyArticlesList'
import FavoriteArticlesList from './FavoriteArticlesList'
import './index.scss'

type TabKey = 'info' | 'preferences' | 'favorite-pets' | 'favorite-articles' | 'my-articles' | 'my-pets' | 'replies'

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>()
  const location = useLocation()
  const hashTab = (location.hash.replace('#', '') as TabKey)
  const validTabs: TabKey[] = ['info', 'preferences', 'favorite-pets', 'favorite-articles', 'my-articles', 'my-pets', 'replies']
  const activeTab: TabKey = validTabs.includes(hashTab) ? hashTab : 'info'
  const [me, setMe] = useState<ApiUserMe | null>(null)
  const [currentUser, setCurrentUser] = useState<ApiUserMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isOtherUserProfile = Boolean(userId && currentUser && Number(userId) !== currentUser.id)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // 获取当前登录用户信息
        const { data: current } = await authApi.getProfile()
        if (!alive) return
        setCurrentUser(current)

        // 获取要显示的用户信息
        let data
        if (userId) {
          const userId_num = Number(userId)
          // 如果 userId 等于当前用户 ID，显示当前用户信息
          if (userId_num === current.id) {
            data = current
          } else {
            // 否则获取其他用户的公开资料
            const { data: userData } = await authApi.getUserProfile(userId_num)
            data = userData
          }
        } else {
          // 没有 userId 参数，显示当前用户
          data = current
        }
        if (!alive) return
        setMe(data)
      } catch (e: any) {
        setError(e?.response?.data?.detail || '加载用户信息失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId])


  // activeTab is derived from URL hash; no state set in effect

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3">加载中…</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  if (!me) return null

  return (
    <Container className="profile-container py-4">
      <Row>
        {/* Sidebar */}
        <Col md={3} className="mb-4">
          <Card className="profile-sidebar shadow-sm">
            <Card.Body>
              <div className="text-center mb-3">
                <div className="profile-avatar">
                  {me.avatar ? (
                    <img 
                      src={typeof me.avatar === 'string' ? me.avatar : URL.createObjectURL(me.avatar as any)}
                      alt={me.username}
                      className="avatar-img"
                    />
                  ) : (
                    me.username.charAt(0).toUpperCase()
                  )}
                </div>
                <h5 className="mt-3 mb-0">{me.username}</h5>
                {me.email && <small className="text-muted">{me.email}</small>}
              </div>
              <Nav className="flex-column">
                <Nav.Link
                  href="#info"
                  active={activeTab === 'info'}
                  className="profile-nav-link"
                >
                  <i className="bi bi-person-circle me-2"></i>
                  个人信息
                </Nav.Link>
                {!isOtherUserProfile && (
                  <>
                    <Nav.Link
                      href="#preferences"
                      active={activeTab === 'preferences'}
                      className="profile-nav-link"
                    >
                      <i className="bi bi-sliders me-2"></i>
                      我的偏好
                    </Nav.Link>
                    <Nav.Link
                      href="#favorite-pets"
                      active={activeTab === 'favorite-pets'}
                      className="profile-nav-link"
                    >
                      <i className="bi bi-star-fill me-2"></i>
                      收藏的宠物
                    </Nav.Link>
                    <Nav.Link
                      href="#favorite-articles"
                      active={activeTab === 'favorite-articles'}
                      className="profile-nav-link"
                    >
                      <i className="bi bi-bookmark-star-fill me-2"></i>
                      收藏的文章
                    </Nav.Link>
                    <Nav.Link
                      href="#my-articles"
                      active={activeTab === 'my-articles'}
                      className="profile-nav-link"
                    >
                      <i className="bi bi-file-earmark-text me-2"></i>
                      我的文章
                    </Nav.Link>
                    <Nav.Link
                      href="#my-pets"
                      active={activeTab === 'my-pets'}
                      className="profile-nav-link"
                    >
                      <i className="bi bi-heart-fill me-2"></i>
                      我的宠物
                    </Nav.Link>
                    <Nav.Link
                      href="#replies"
                      active={activeTab === 'replies'}
                      className="profile-nav-link"
                    >
                      <i className="bi bi-chat-dots-fill me-2"></i>
                      回复我的
                    </Nav.Link>
                  </>
                )}
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Main content */}
        <Col md={9}>
          {activeTab === 'info' && <ProfileInfo me={me} isOtherUserProfile={isOtherUserProfile} />}
          {!isOtherUserProfile && activeTab === 'preferences' && <PreferencesForm />}
          {!isOtherUserProfile && activeTab === 'favorite-pets' && <FavoritesList />}
          {!isOtherUserProfile && activeTab === 'favorite-articles' && <FavoriteArticlesList />}
          {!isOtherUserProfile && activeTab === 'my-articles' && <MyArticlesList />}
          {!isOtherUserProfile && activeTab === 'my-pets' && <MyPetsList />}
          {!isOtherUserProfile && activeTab === 'replies' && <RepliesList />}
        </Col>
      </Row>
    </Container>
  )
}

function ProfileInfo({ me, isOtherUserProfile = false }: { me: ApiUserMe; isOtherUserProfile?: boolean }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [userData, setUserData] = useState(me)
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
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <h4 className="mb-0">个人信息</h4>
        </Card.Header>
        <Card.Body>
          {uploadError && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setUploadError('')}>
              {uploadError}
            </Alert>
          )}

          {/* Avatar Section */}
          <Row className="info-row py-3 border-bottom align-items-center">
            <Col md={3}>
              <label className="text-muted fw-semibold">头像</label>
            </Col>
            <Col md={9}>
              <div className="d-flex align-items-center gap-3">
                <div className="profile-avatar-large">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={userData?.username} className="avatar-img" />
                  ) : (
                    <span>{userData?.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-grow-1">
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
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm me-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            上传中…
                          </>
                        ) : (
                          '上传头像'
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleResetAvatar}
                        disabled={uploading || !userData?.avatar}
                      >
                        重置为默认
                      </button>
                      <div className="small text-muted mt-2">
                        支持 JPG、PNG、GIF、WebP，最大 5MB
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          <InfoRow label="用户名" value={userData?.username ?? '—'} />
          <InfoRow label="姓 (Last name)" value={userData?.last_name ?? '—'} />
          <InfoRow label="名 (First name)" value={userData?.first_name ?? '—'} />
          <InfoRow label="邮箱" value={userData?.email ?? '—'} />
          <InfoRow label="电话" value={userData?.phone ?? '—'} />

          {/* Friend Actions */}
          {isOtherUserProfile && (
            <>
              <hr className="my-4" />
              <Row className="friend-actions">
                <Col md={9} className="d-flex gap-2">
                  {!friendshipStatus?.status ? (
                    <Button
                      variant="primary"
                      onClick={handleAddFriend}
                      disabled={loadingFriendship}
                    >
                      {loadingFriendship ? '加载中…' : '添加好友'}
                    </Button>
                  ) : friendshipStatus.status === 'pending' ? (
                    <>
                      {friendshipStatus.to_user.id === userData.id ? (
                        <>
                          <Button
                            variant="success"
                            onClick={handleAcceptFriend}
                            disabled={loadingFriendship}
                          >
                            接受好友请求
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={handleRejectFriend}
                            disabled={loadingFriendship}
                          >
                            拒绝
                          </Button>
                        </>
                      ) : (
                        <Button variant="secondary" disabled>
                          待对方接受
                        </Button>
                      )}
                    </>
                  ) : friendshipStatus.status === 'accepted' ? (
                    <Button
                      variant="success"
                      onClick={() => setShowMessageModal(true)}
                    >
                      发送私信
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>
                      已拒绝
                    </Button>
                  )}
                </Col>
              </Row>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Message Modal */}
      <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>给 {userData?.username} 发送私信</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {messageError && <Alert variant="danger">{messageError}</Alert>}
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
              />
              {friendshipStatus?.status !== 'accepted' && (
                <small className="text-warning mt-2 d-block">
                  ⚠️ 非好友每天最多发送3条私信
                </small>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Row className="info-row py-3 border-bottom">
      <Col md={3}>
        <label className="text-muted fw-semibold">{label}</label>
      </Col>
      <Col md={9}>
        <span>{value}</span>
      </Col>
    </Row>
  )
}

function FavoritesList() {
  const [favorites, setFavorites] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data } = await adoptApi.myFavorites({})
        if (!alive) return
        setFavorites(data.results || [])
      } catch (e: any) {
        if (!alive) return
        setError(e?.response?.data?.detail || '加载收藏失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3">加载中…</div>
      </div>
    )
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>
  }

  if (favorites.length === 0) {
    return (
      <Card className="shadow-sm text-center py-5">
        <Card.Body>
          <i className="bi bi-star text-muted" style={{ fontSize: '4rem' }}></i>
          <h5 className="mt-3 text-muted">还没有收藏任何宠物</h5>
          <p className="text-muted">去 <Link to="/adopt">领养页面</Link> 看看吧</p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div>
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-white border-bottom">
          <h4 className="mb-0">我的收藏 ({favorites.length})</h4>
        </Card.Header>
      </Card>
      <Row className="g-4">
        {favorites.map((pet) => (
          <Col key={pet.id} xs={12} sm={6} md={4}>
            <PetCard pet={pet} onRemove={(id) => setFavorites(prev => prev.filter(p => p.id !== id))} />
          </Col>
        ))}
      </Row>
    </div>
  )
}

function PetCard({ pet, onRemove }: { pet: Pet; onRemove: (id: number) => void }) {
  const [removing, setRemoving] = useState(false)

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (removing) return

    setRemoving(true)
    try {
      await adoptApi.unfavorite(pet.id)
      onRemove(pet.id)
    } catch (err) {
      console.error('Remove favorite failed:', err)
      alert('取消收藏失败')
      setRemoving(false)
    }
  }

  const ageText = () => {
    if (pet.age_years || pet.age_months) {
      const yy = pet.age_years ? `${pet.age_years}岁` : ''
      const mm = pet.age_months ? `${pet.age_months}月` : ''
      return [yy, mm].filter(Boolean).join(' ')
    }
    return '年龄未知'
  }

  return (
    <Card className="pet-card h-100 border-0 shadow-sm">
      <div className="position-relative">
        <button
          type="button"
          className="pet-card-remove-btn"
          onClick={handleRemove}
          disabled={removing}
          aria-label="取消收藏"
        >
          {removing ? '⋯' : '×'}
        </button>
        <Link to={`/adopt/${pet.id}`}>
          <Card.Img
            variant="top"
            src={pet.photo || '/images/pet-placeholder.jpg'}
            alt={pet.name}
            style={{ height: 200, objectFit: 'cover' }}
          />
        </Link>
      </div>
      <Card.Body>
        <Link to={`/adopt/${pet.id}`} className="text-decoration-none text-dark">
          <Card.Title className="fs-5 fw-bold">{pet.name}</Card.Title>
          <Card.Text className="text-muted small">
            <i className="bi bi-geo-alt me-1"></i>
            {pet.address_display || pet.city || '位置未知'}
          </Card.Text>
          <Card.Text className="small">
            <span className="badge bg-light text-dark me-2">{pet.species || '宠物'}</span>
            <span className="text-muted">{ageText()}</span>
          </Card.Text>
        </Link>
      </Card.Body>
    </Card>
  )
}

function PreferencesForm() {
  const [preferences, setPreferences] = useState({
    preferred_species: '',
    preferred_size: '',
    preferred_age_min: '',
    preferred_age_max: '',
    preferred_gender: '',
    has_experience: false,
    living_situation: '',
    has_yard: false,
    other_pets: '',
    additional_notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data } = await authApi.getProfile()
        if (!alive) return
        setPreferences({
          preferred_species: data.preferred_species || '',
          preferred_size: data.preferred_size || '',
          preferred_age_min: data.preferred_age_min?.toString() || '',
          preferred_age_max: data.preferred_age_max?.toString() || '',
          preferred_gender: data.preferred_gender || '',
          has_experience: data.has_experience || false,
          living_situation: data.living_situation || '',
          has_yard: data.has_yard || false,
          other_pets: data.other_pets || '',
          additional_notes: data.additional_notes || ''
        })
      } catch (_e: any) {
        setError('加载偏好设置失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const payload: any = {
        has_experience: preferences.has_experience,
        has_yard: preferences.has_yard
      }
      
      if (preferences.preferred_species) payload.preferred_species = preferences.preferred_species
      if (preferences.preferred_size) payload.preferred_size = preferences.preferred_size
      if (preferences.preferred_gender) payload.preferred_gender = preferences.preferred_gender
      if (preferences.living_situation) payload.living_situation = preferences.living_situation
      if (preferences.other_pets) payload.other_pets = preferences.other_pets
      if (preferences.additional_notes) payload.additional_notes = preferences.additional_notes
      if (preferences.preferred_age_min) payload.preferred_age_min = Number(preferences.preferred_age_min)
      if (preferences.preferred_age_max) payload.preferred_age_max = Number(preferences.preferred_age_max)
      
      await authApi.updateProfile(payload)
      setMessage('保存成功！')
      setTimeout(() => setMessage(''), 3000)
    } catch (_e: any) {
      setError(_e?.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3">加载中…</div>
      </div>
    )
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h4 className="mb-0">领养偏好设置</h4>
        <small className="text-muted">设置您理想的宠物特征，帮助我们为您推荐合适的宠物</small>
      </Card.Header>
      <Card.Body>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <label className="form-label">偏好物种</label>
              <select 
                className="form-select"
                value={preferences.preferred_species}
                onChange={(e) => setPreferences({...preferences, preferred_species: e.target.value})}
              >
                <option value="">不限</option>
                <option value="dog">狗</option>
                <option value="cat">猫</option>
                <option value="other">其他</option>
              </select>
            </Col>
            <Col md={6}>
              <label className="form-label">偏好大小</label>
              <select 
                className="form-select"
                value={preferences.preferred_size}
                onChange={(e) => setPreferences({...preferences, preferred_size: e.target.value})}
              >
                <option value="">不限</option>
                <option value="small">小型</option>
                <option value="medium">中型</option>
                <option value="large">大型</option>
              </select>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <label className="form-label">偏好年龄（最小月数）</label>
              <input 
                type="number"
                className="form-control"
                value={preferences.preferred_age_min}
                onChange={(e) => setPreferences({...preferences, preferred_age_min: e.target.value})}
                placeholder="例如: 6"
                min="0"
              />
            </Col>
            <Col md={6}>
              <label className="form-label">偏好年龄（最大月数）</label>
              <input 
                type="number"
                className="form-control"
                value={preferences.preferred_age_max}
                onChange={(e) => setPreferences({...preferences, preferred_age_max: e.target.value})}
                placeholder="例如: 24"
                min="0"
              />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <label className="form-label">偏好性别</label>
              <select 
                className="form-select"
                value={preferences.preferred_gender}
                onChange={(e) => setPreferences({...preferences, preferred_gender: e.target.value})}
              >
                <option value="">不限</option>
                <option value="male">公</option>
                <option value="female">母</option>
              </select>
            </Col>
            <Col md={6}>
              <label className="form-label">居住环境</label>
              <select 
                className="form-select"
                value={preferences.living_situation}
                onChange={(e) => setPreferences({...preferences, living_situation: e.target.value})}
              >
                <option value="">请选择</option>
                <option value="apartment">公寓</option>
                <option value="house">独栋房屋</option>
                <option value="townhouse">联排别墅</option>
                <option value="farm">农场</option>
              </select>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <div className="form-check">
                <input 
                  type="checkbox"
                  className="form-check-input"
                  id="has_experience"
                  checked={preferences.has_experience}
                  onChange={(e) => setPreferences({...preferences, has_experience: e.target.checked})}
                />
                <label className="form-check-label" htmlFor="has_experience">
                  我有养宠物的经验
                </label>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-check">
                <input 
                  type="checkbox"
                  className="form-check-input"
                  id="has_yard"
                  checked={preferences.has_yard}
                  onChange={(e) => setPreferences({...preferences, has_yard: e.target.checked})}
                />
                <label className="form-check-label" htmlFor="has_yard">
                  我家有院子
                </label>
              </div>
            </Col>
          </Row>

          <div className="mb-3">
            <label className="form-label">家中其他宠物</label>
            <input 
              type="text"
              className="form-control"
              value={preferences.other_pets}
              onChange={(e) => setPreferences({...preferences, other_pets: e.target.value})}
              placeholder="例如: 一只猫，两只狗"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">其他说明</label>
            <textarea 
              className="form-control"
              rows={4}
              value={preferences.additional_notes}
              onChange={(e) => setPreferences({...preferences, additional_notes: e.target.value})}
              placeholder="其他想说明的偏好或要求..."
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存偏好'}
          </button>
        </form>
      </Card.Body>
    </Card>
  )
}

function MyPetsList() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data } = await adoptApi.myPets({})
        if (!alive) return
        setPets(data.results || [])
      } catch (e: any) {
        if (!alive) return
        setError(e?.response?.data?.detail || '加载我的宠物失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3">加载中…</div>
      </div>
    )
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>
  }

  if (pets.length === 0) {
    return (
      <Card className="shadow-sm text-center py-5">
        <Card.Body>
          <i className="bi bi-heart text-muted" style={{ fontSize: '4rem' }}></i>
          <h5 className="mt-3 text-muted">还没有发布宠物</h5>
          <p className="text-muted">去 <Link to="/adopt">领养页面</Link> 发布您的宠物吧</p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div>
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-white border-bottom">
          <h4 className="mb-0">我的宠物 ({pets.length})</h4>
        </Card.Header>
      </Card>
      <Row className="g-4">
        {pets.map((pet) => (
          <Col key={pet.id} xs={12} sm={6} md={4}>
            <MyPetCard pet={pet} onRemove={(id) => setPets(prev => prev.filter(p => p.id !== id))} />
          </Col>
        ))}
      </Row>
    </div>
  )
}

function MyPetCard({ pet, onRemove }: { pet: Pet; onRemove: (id: number) => void }) {
  const [removing, setRemoving] = useState(false)

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (removing) return
    
    if (!confirm('确定要删除这只宠物吗？')) return

    setRemoving(true)
    try {
      await adoptApi.remove(pet.id)
      onRemove(pet.id)
    } catch (err) {
      console.error('Remove pet failed:', err)
      alert('删除宠物失败')
      setRemoving(false)
    }
  }

  const ageText = () => {
    if (pet.age_years || pet.age_months) {
      const yy = pet.age_years ? `${pet.age_years}岁` : ''
      const mm = pet.age_months ? `${pet.age_months}月` : ''
      return [yy, mm].filter(Boolean).join(' ')
    }
    return '年龄未知'
  }

  const statusBadge = () => {
    const statusMap: Record<string, { text: string; variant: string }> = {
      AVAILABLE: { text: '可领养', variant: 'success' },
      PENDING: { text: '待审核', variant: 'warning' },
      ADOPTED: { text: '已领养', variant: 'secondary' },
      LOST: { text: '走失', variant: 'danger' },
      DRAFT: { text: '草稿', variant: 'light' },
      ARCHIVED: { text: '已下架', variant: 'dark' }
    }
    const status = statusMap[pet.status || 'AVAILABLE'] || statusMap.AVAILABLE
    return <span className={`badge bg-${status.variant} me-2`}>{status.text}</span>
  }

  return (
    <Card className="pet-card h-100 border-0 shadow-sm">
      <div className="position-relative">
        <button
          type="button"
          className="pet-card-remove-btn"
          onClick={handleRemove}
          disabled={removing}
          aria-label="删除宠物"
        >
          {removing ? '⋯' : '×'}
        </button>
        <Link to={`/adopt/${pet.id}`}>
          <Card.Img
            variant="top"
            src={pet.photo || '/images/pet-placeholder.jpg'}
            alt={pet.name}
            style={{ height: 200, objectFit: 'cover' }}
          />
        </Link>
      </div>
      <Card.Body>
        <Link to={`/adopt/${pet.id}`} className="text-decoration-none text-dark">
          <Card.Title className="fs-5 fw-bold">{pet.name}</Card.Title>
          <Card.Text className="text-muted small">
            <i className="bi bi-geo-alt me-1"></i>
            {pet.address_display || pet.city || '位置未知'}
          </Card.Text>
          <Card.Text className="small">
            {statusBadge()}
            <span className="badge bg-light text-dark me-2">{pet.species || '宠物'}</span>
            <span className="text-muted">{ageText()}</span>
          </Card.Text>
        </Link>
      </Card.Body>
    </Card>
  )
}

function RepliesList() {
  const navigate = useNavigate()
  const [replies, setReplies] = useState<(Comment & { article_id?: number; article_title?: string; parent_comment?: Comment })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await blogApi.getRepliesToMe({ page, page_size: pageSize })
        if (!alive) return
        setReplies(data.results || [])
        setTotal(data.count || 0)
      } catch (e: any) {
        if (!alive) return
        setError(e?.response?.data?.detail || '加载回复失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [page, pageSize])

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('确定要删除这条评论吗？')) return
    try {
      // 在实际后端实现中，需要添加删除评论的 API
      // 临时方案：刷新列表
      setReplies(replies.filter(r => r.id !== commentId))
    } catch (err) {
      console.error('Delete comment failed:', err)
      alert('删除评论失败')
    }
  }

  const handleNavigateToArticle = (articleId?: number) => {
    if (articleId) {
      navigate(`/blog/${articleId}`)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3">加载中…</div>
      </div>
    )
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>
  }

  if (replies.length === 0) {
    return (
      <Card className="shadow-sm text-center py-5">
        <Card.Body>
          <i className="bi bi-chat-dots text-muted" style={{ fontSize: '4rem' }}></i>
          <h5 className="mt-3 text-muted">还没有人回复你的评论</h5>
          <p className="text-muted">去 <Link to="/blog">博客</Link> 发表有趣的评论吧</p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div>
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-white border-bottom">
          <h4 className="mb-0">回复我的评论 ({total})</h4>
        </Card.Header>
      </Card>

      {replies.map((reply) => (
        <Card 
          key={reply.id} 
          className="mb-3 shadow-sm border-0"
          onMouseEnter={() => setHoveredId(reply.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <Card.Body>
            {/* 上方：别人的回复 */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {/* 用户头像 */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#667eea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                {reply.user?.avatar ? (
                  <img
                    src={reply.user.avatar}
                    alt={reply.user.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  reply.user?.username?.charAt(0)?.toUpperCase()
                )}
              </div>

              {/* 主体内容 */}
              <div style={{ flex: 1 }}>
                {/* 用户名和日期 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#333' }}>
                    {reply.user?.username || '用户'}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    回复了我的评论
                  </span>
                  <span style={{ fontSize: '12px', color: '#bbb', marginLeft: 'auto' }}>
                    {new Date(reply.add_date).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* 回复内容 */}
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                  {reply.content}
                </div>
              </div>
            </div>

            {/* 下方：我的原评论 */}
            {reply.parent_comment && (
              <div
                style={{
                  fontSize: '13px',
                  color: '#666',
                  paddingLeft: '12px',
                  borderLeft: '3px solid #667eea',
                  backgroundColor: '#f5f7ff',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '12px'
                }}
              >
                <div style={{ color: '#667eea', fontWeight: '600', marginBottom: '4px', fontSize: '12px' }}>
                  我的评论
                </div>
                <div style={{ color: '#333', lineHeight: '1.5' }}>
                  {reply.parent_comment.content}
                </div>
              </div>
            )}

            {/* 操作按钮：放到最下面 */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {reply.article_id && (
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => handleNavigateToArticle(reply.article_id)}
                  style={{ fontSize: '12px' }}
                >
                  <i className="bi bi-link-45deg me-1"></i>
                  查看文章：{reply.article_title}
                </Button>
              )}
              
              {/* 删除按钮：仅在hover时显示 */}
              {hoveredId === reply.id && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleDelete(reply.id)}
                  style={{ fontSize: '12px' }}
                >
                  <i className="bi bi-trash me-1"></i>
                  删除
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination>
            <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
            <Pagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
            
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = page <= 3 ? i + 1 : page - 2 + i
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === page}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              )
            })}
            
            <Pagination.Next disabled={page === totalPages} onClick={() => setPage(page + 1)} />
            <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
          </Pagination>
        </div>
      )}
    </div>
  )
}
