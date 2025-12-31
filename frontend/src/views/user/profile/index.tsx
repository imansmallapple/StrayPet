import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import { useEffect, useState } from 'react'
import { Container, Row, Col, Nav, Card, Spinner, Alert, Button, Modal } from 'react-bootstrap'
import { Link, useLocation, useParams } from 'react-router-dom'
import ProfileInfo from './ProfileInfo'
import MyArticlesList from './MyArticlesList'
import FavoriteArticlesList from './FavoriteArticlesList'
import MessageCenter from './MessageCenter'
import './index.scss'
import './profile.scss'

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
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRemoveClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmRemove = async () => {
    setRemoving(true)
    try {
      await adoptApi.unfavorite(pet.id)
      onRemove(pet.id)
      setShowConfirm(false)
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
    <>
      <Card className="pet-card h-100 border-0 shadow-sm hover-card">
        <div className="position-relative pet-image-wrapper">
          <button
            type="button"
            className="pet-card-remove-btn"
            onClick={handleRemoveClick}
            disabled={removing}
            aria-label="取消收藏"
            title="取消收藏"
          >
            <i className="bi bi-heart-fill"></i>
          </button>
          <Link to={`/adopt/${pet.id}`}>
            <Card.Img
              variant="top"
              src={pet.photo || '/images/pet-placeholder.jpg'}
              alt={pet.name}
              className="pet-card-image"
              style={{ height: 200, objectFit: 'cover' }}
            />
          </Link>
        </div>
        <Card.Body className="pet-card-body">
          <Link to={`/adopt/${pet.id}`} className="text-decoration-none text-dark">
            <Card.Title className="fs-5 fw-bold pet-name">{pet.name}</Card.Title>
            <Card.Text className="text-muted small">
              <i className="bi bi-geo-alt me-1"></i>
              {pet.address_display || pet.city || '位置未知'}
            </Card.Text>
            <Card.Text className="small pet-meta">
              <span className="badge bg-light text-dark me-2">{pet.species || '宠物'}</span>
              <span className="text-muted">{ageText()}</span>
            </Card.Text>
          </Link>
        </Card.Body>
      </Card>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-circle me-2"></i>
            确认操作
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">确定要取消收藏 <strong>{pet.name}</strong> 吗？</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={removing}>
            取消
          </Button>
          <Button variant="danger" onClick={handleConfirmRemove} disabled={removing}>
            {removing ? '处理中…' : '确认取消收藏'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
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
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRemoveClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmRemove = async () => {
    setRemoving(true)
    try {
      await adoptApi.remove(pet.id)
      onRemove(pet.id)
      setShowConfirm(false)
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
    return <span className={`badge bg-${status.variant} me-2 pet-status-badge`}>{status.text}</span>
  }

  return (
    <>
      <Card className="pet-card h-100 border-0 shadow-sm hover-card">
        <div className="position-relative pet-image-wrapper">
          <button
            type="button"
            className="pet-card-delete-btn"
            onClick={handleRemoveClick}
            disabled={removing}
            aria-label="删除宠物"
            title="删除宠物"
          >
            <i className="bi bi-trash-fill"></i>
          </button>
          <Link to={`/adopt/${pet.id}`}>
            <Card.Img
              variant="top"
              src={pet.photo || '/images/pet-placeholder.jpg'}
              alt={pet.name}
              className="pet-card-image"
              style={{ height: 200, objectFit: 'cover' }}
            />
            <span className="pet-status-badge-overlay">{statusBadge()}</span>
          </Link>
        </div>
        <Card.Body className="pet-card-body">
          <Link to={`/adopt/${pet.id}`} className="text-decoration-none text-dark">
            <Card.Title className="fs-5 fw-bold pet-name">{pet.name}</Card.Title>
            <Card.Text className="text-muted small">
              <i className="bi bi-geo-alt me-1"></i>
              {pet.address_display || pet.city || '位置未知'}
            </Card.Text>
            <Card.Text className="small pet-meta">
              <span className="badge bg-light text-dark me-2">{pet.species || '宠物'}</span>
              <span className="text-muted">{ageText()}</span>
            </Card.Text>
          </Link>
        </Card.Body>
      </Card>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2"></i>
            删除宠物
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-warning mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>警告：</strong>删除后无法恢复
          </div>
          <p className="mb-0">确定要删除 <strong className="text-danger">{pet.name}</strong> 吗？</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={removing}>
            取消
          </Button>
          <Button variant="danger" onClick={handleConfirmRemove} disabled={removing}>
            {removing ? '删除中…' : '确认删除'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
