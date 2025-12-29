import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import { useEffect, useState, useRef, Fragment } from 'react'
import { Container, Row, Col, Nav, Card, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap'
import { Link, useLocation, useParams } from 'react-router-dom'
import MyArticlesList from './MyArticlesList'
import FavoriteArticlesList from './FavoriteArticlesList'
import MessageCenter from './MessageCenter'
import './index.scss'

type TabKey = 'info' | 'favorite-pets' | 'favorite-articles' | 'my-articles' | 'my-pets' | 'message-center'

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>()
  const location = useLocation()
  const hashTab = (location.hash.replace('#', '') as TabKey)
  const validTabs: TabKey[] = ['info', 'favorite-pets', 'favorite-articles', 'my-articles', 'my-pets', 'message-center']
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
                      href="#message-center"
                      active={activeTab === 'message-center'}
                      className="profile-nav-link"
                    >
                      <i className="bi bi-chat-dots-fill me-2"></i>
                      消息中心
                    </Nav.Link>
                  </>
                )}
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Main content */}
        <Col md={9}>
          {activeTab === 'info' && <ProfileInfo me={me} isOtherUserProfile={isOtherUserProfile} currentUser={currentUser} />}
          {!isOtherUserProfile && activeTab === 'favorite-pets' && <FavoritesList />}
          {!isOtherUserProfile && activeTab === 'favorite-articles' && <FavoriteArticlesList />}
          {!isOtherUserProfile && activeTab === 'my-articles' && <MyArticlesList />}
          {!isOtherUserProfile && activeTab === 'my-pets' && <MyPetsList />}
          {!isOtherUserProfile && activeTab === 'message-center' && <MessageCenter />}
        </Col>
      </Row>
    </Container>
  )
}

function ProfileInfo({ me, isOtherUserProfile = false, currentUser }: { me: ApiUserMe; isOtherUserProfile?: boolean; currentUser?: ApiUserMe | null }) {
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
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
          <h4 className="mb-0">个人信息</h4>
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
                    取消
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setIsEditing(true)}
                >
                  编辑个人信息
                </button>
              )}
            </div>
          )}
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

          {/* Pet Care Experience Info */}
          <Row className="info-row py-3 border-bottom align-items-center">
            <Col md={3}>
              <label className="text-muted fw-semibold">养宠物经验</label>
            </Col>
            <Col md={9}>
              {isEditing && !isOtherUserProfile ? (
                <Form.Check
                  type="checkbox"
                  checked={(editData as any).has_experience}
                  onChange={(e: any) => setEditData({...editData, has_experience: e.target.checked})}
                  label="有养宠物经验"
                />
              ) : (
                <span>{(userData as any)?.has_experience ? '有经验' : '无经验'}</span>
              )}
            </Col>
          </Row>

          <Row className="info-row py-3 border-bottom align-items-center">
            <Col md={3}>
              <label className="text-muted fw-semibold">居住环境</label>
            </Col>
            <Col md={9}>
              {isEditing && !isOtherUserProfile ? (
                <Form.Select
                  value={(editData as any).living_situation || ''}
                  onChange={(e: any) => setEditData({...editData, living_situation: e.target.value})}
                >
                  <option value="">选择居住环境</option>
                  <option value="apartment">公寓</option>
                  <option value="house">独栋房屋</option>
                  <option value="townhouse">联排别墅</option>
                  <option value="farm">农场</option>
                </Form.Select>
              ) : (
                <span>{getLivingSituationLabel((userData as any)?.living_situation)}</span>
              )}
            </Col>
          </Row>

          <Row className="info-row py-3 border-bottom align-items-center">
            <Col md={3}>
              <label className="text-muted fw-semibold">有无院子</label>
            </Col>
            <Col md={9}>
              {isEditing && !isOtherUserProfile ? (
                <Form.Check
                  type="checkbox"
                  checked={(editData as any).has_yard}
                  onChange={(e: any) => setEditData({...editData, has_yard: e.target.checked})}
                  label="有院子"
                />
              ) : (
                <span>{(userData as any)?.has_yard ? '有' : '无'}</span>
              )}
            </Col>
          </Row>

          {/* Friend Actions */}
          {isOtherUserProfile && (
            <>
              <hr className="my-4" />
              <Row className="friend-actions">
                <Col md={9} className="d-flex gap-2 flex-wrap">
                  {!friendshipStatus?.status ? (
                    <>
                      <Button
                        variant="primary"
                        onClick={handleAddFriend}
                        disabled={loadingFriendship}
                      >
                        {loadingFriendship ? '加载中…' : '添加好友'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowMessageModal(true)}
                      >
                        <i className="bi bi-chat-dots me-2"></i>
                        发送私信
                      </Button>
                    </>
                  ) : friendshipStatus.status === 'pending' ? (
                    <>
                      {friendshipStatus.from_user.id === currentUser?.id ? (
                        // 当前用户是申请发送者 - 显示灰色按钮和发送私信选项
                        <>
                          <Button variant="secondary" disabled>
                            已发送申请
                          </Button>
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowMessageModal(true)}
                          >
                            <i className="bi bi-chat-dots me-2"></i>
                            发送私信
                          </Button>
                        </>
                      ) : (
                        // 当前用户是申请接收者 - 显示接受/拒绝按钮和发送私信
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
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowMessageModal(true)}
                          >
                            <i className="bi bi-chat-dots me-2"></i>
                            发送私信
                          </Button>
                        </>
                      )}
                    </>
                  ) : friendshipStatus.status === 'accepted' ? (
                    <>
                      <Button
                        variant="success"
                        onClick={() => setShowMessageModal(true)}
                      >
                        <i className="bi bi-chat-dots me-2"></i>
                        发送私信
                      </Button>
                      <Button variant="secondary" disabled>
                        已成为好友
                      </Button>
                    </>
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
