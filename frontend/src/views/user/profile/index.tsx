import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import { useEffect, useState } from 'react'
import { Container, Row, Col, Nav, Card, Spinner, Alert } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import MyArticlesList from './MyArticlesList'
import FavoriteArticlesList from './FavoriteArticlesList'
import MessageCenter from './MessageCenter'
import ProfileInfo from './ProfileInfo'
import './index.scss'

type TabKey = 'info' | 'favorite-pets' | 'favorite-articles' | 'my-articles' | 'my-pets' | 'message-center'

export default function Profile() {
  const [me, setMe] = useState<ApiUserMe | null>(null)
  const location = useLocation()
  const hashTab = (location.hash.replace('#', '') as TabKey)
  const validTabs: TabKey[] = ['info', 'favorite-pets', 'favorite-articles', 'my-articles', 'my-pets', 'message-center']
  const activeTab: TabKey = validTabs.includes(hashTab) ? hashTab : 'info'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // 获取当前登录用户信息
        const { data: current } = await authApi.getProfile()
        if (!alive) return
        setMe(current)
      } catch (e: any) {
        setError(e?.response?.data?.detail || '加载用户信息失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])


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
    <Container className="py-4">
      {/* 顶部菜单栏 */}
      <div className="profile-header mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <h4 className="mb-0">我的账户</h4>
          <Nav className="gap-3">
            <Nav.Link
              href="#info"
              active={activeTab === 'info'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-person-circle me-2"></i>
              个人信息
            </Nav.Link>
            <Nav.Link
              href="#favorite-pets"
              active={activeTab === 'favorite-pets'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-star-fill me-2"></i>
              收藏的宠物
            </Nav.Link>
            <Nav.Link
              href="#favorite-articles"
              active={activeTab === 'favorite-articles'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-bookmark-star-fill me-2"></i>
              收藏的文章
            </Nav.Link>
            <Nav.Link
              href="#my-articles"
              active={activeTab === 'my-articles'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-file-earmark-text me-2"></i>
              我的文章
            </Nav.Link>
            <Nav.Link
              href="#my-pets"
              active={activeTab === 'my-pets'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-heart-fill me-2"></i>
              我的宠物
            </Nav.Link>
            <Nav.Link
              href="#message-center"
              active={activeTab === 'message-center'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-chat-dots-fill me-2"></i>
              消息中心
            </Nav.Link>
          </Nav>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="profile-content">
        {activeTab === 'info' && <ProfileInfo me={me} isOtherUserProfile={false} currentUser={me} />}
        {activeTab === 'favorite-pets' && <FavoritesList />}
        {activeTab === 'favorite-articles' && <FavoriteArticlesList />}
        {activeTab === 'my-articles' && <MyArticlesList />}
        {activeTab === 'my-pets' && <MyPetsList />}
        {activeTab === 'message-center' && <MessageCenter />}
      </div>
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
