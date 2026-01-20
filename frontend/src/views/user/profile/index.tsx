import { authApi, type UserMe as ApiUserMe } from '@/services/modules/auth'
import { adoptApi, type Pet } from '@/services/modules/adopt'
import { useEffect, useState } from 'react'
import { Container, Row, Col, Nav, Card, Spinner, Alert } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import MyArticlesList from './MyArticlesList'
import FavoriteArticlesList from './FavoriteArticlesList'
import MessageCenter from './MessageCenter'
import ProfileInfo from './ProfileInfo'
import FriendsList from './FriendsList'
import './index.scss'

type TabKey = 'info' | 'favorite-pets' | 'favorite-articles' | 'my-articles' | 'my-pets' | 'message-center' | 'friends'

export default function Profile() {
  const [me, setMe] = useState<ApiUserMe | null>(null)
  const location = useLocation()
  const hashTab = (location.hash.replace('#', '') as TabKey)
  const validTabs: TabKey[] = ['info', 'favorite-pets', 'favorite-articles', 'my-articles', 'my-pets', 'message-center', 'friends']
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
        
        // 处理avatar URL - 转换相对路径为绝对URL
        if (current.avatar && typeof current.avatar === 'string' && current.avatar.startsWith('/')) {
          current.avatar = `http://localhost:8000${current.avatar}`
        }
        
        setMe(current)
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load user information')
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
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      <Container className="py-4">
        {/* 顶部菜单栏 */}
        <div className="profile-header mb-4 pb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <h4 className="mb-0">My Account</h4>
          <Nav className="gap-3">
            <Nav.Link
              href="#info"
              active={activeTab === 'info'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-person-circle me-2"></i>
              Personal Info
            </Nav.Link>
            <Nav.Link
              href="#favorite-pets"
              active={activeTab === 'favorite-pets'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-star-fill me-2"></i>
              Favorite Pets
            </Nav.Link>
            <Nav.Link
              href="#favorite-articles"
              active={activeTab === 'favorite-articles'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-bookmark-star-fill me-2"></i>
              Favorite Articles
            </Nav.Link>
            <Nav.Link
              href="#my-articles"
              active={activeTab === 'my-articles'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-file-earmark-text me-2"></i>
              My Articles
            </Nav.Link>
            <Nav.Link
              href="#my-pets"
              active={activeTab === 'my-pets'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-heart-fill me-2"></i>
              My Pets
            </Nav.Link>
            <Nav.Link
              href="#friends"
              active={activeTab === 'friends'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-people-fill me-2"></i>
              My Friends
            </Nav.Link>
            <Nav.Link
              href="#message-center"
              active={activeTab === 'message-center'}
              className="nav-link"
              style={{ padding: 0 }}
            >
              <i className="bi bi-chat-dots-fill me-2"></i>
              Message Center
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
        {activeTab === 'friends' && <FriendsList />}
        {activeTab === 'message-center' && <MessageCenter />}
      </div>
      </Container>
    </div>
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
        setError(e?.response?.data?.detail || 'Failed to load favorites')
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
        <div className="mt-3">Loading...</div>
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
          <h5 className="mt-3 text-muted">No favorite pets yet</h5>
          <p className="text-muted">Visit the <Link to="/adopt">Adoption page</Link> to see more pets</p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div>
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-white border-bottom">
          <h4 className="mb-0">My Favorites ({favorites.length})</h4>
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
    e.stopPropagation()
    if (removing) return

    if (!window.confirm('Remove this pet from favorites?')) return

    setRemoving(true)
    try {
      await adoptApi.unfavorite(pet.id)
      onRemove(pet.id)
    } catch (err) {
      console.error('Remove favorite failed:', err)
      alert('Failed to remove from favorites')
      setRemoving(false)
    }
  }

  const ageText = () => {
    if (pet.age_years || pet.age_months) {
      const yy = pet.age_years ? `${pet.age_years} years` : ''
      const mm = pet.age_months ? `${pet.age_months} months` : ''
      return [yy, mm].filter(Boolean).join(' ')
    }
    return 'Age unknown'
  }

  return (
    <Card className="pet-card favorite-pet-card h-100 border-0 shadow-sm overflow-hidden position-relative">
      <button
        type="button"
        className="pet-card-fav-btn"
        onClick={handleRemove}
        disabled={removing}
        aria-label="Remove from favorites"
        title="Click to remove from favorites"
      >
        {removing ? (
          <span className="spinner-border spinner-border-sm"></span>
        ) : (
          <i className="bi bi-heart-fill"></i>
        )}
      </button>
      <div className="pet-card-image-wrapper">
        <Link to={`/adopt/${pet.id}`}>
          <Card.Img
            variant="top"
            src={pet.photo || '/images/pet-placeholder.jpg'}
            alt={pet.name}
            style={{ height: 200, objectFit: 'cover' }}
          />
        </Link>
      </div>
      <Card.Body className="pt-3">
        <Link to={`/adopt/${pet.id}`} className="text-decoration-none text-dark">
          <Card.Title className="fs-5 fw-bold mb-2">{pet.name}</Card.Title>
          <Card.Text className="text-muted small mb-2">
            <i className="bi bi-geo-alt me-1"></i>
            {pet.address_display || pet.city || 'Location unknown'}
          </Card.Text>
          <Card.Text className="small">
            <span className="badge bg-light text-dark me-2">{pet.species || 'Pet'}</span>
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
        setError(e?.response?.data?.detail || 'Failed to load my pets')
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
        <div className="mt-3">Loading...</div>
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
          <h5 className="mt-3 text-muted">No pets published yet</h5>
          <p className="text-muted">Visit the <Link to="/adopt">Adoption page</Link> to publish your pet</p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div>
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-white border-bottom">
          <h4 className="mb-0">My Pets ({pets.length})</h4>
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
    e.stopPropagation()
    if (removing) return
    
    if (!window.confirm('Are you sure you want to delete this pet? This will remove your published pet information.')) return

    setRemoving(true)
    try {
      await adoptApi.remove(pet.id)
      onRemove(pet.id)
    } catch (err) {
      console.error('Remove pet failed:', err)
      alert('Failed to delete pet')
      setRemoving(false)
    }
  }

  const ageText = () => {
    if (pet.age_years || pet.age_months) {
      const yy = pet.age_years ? `${pet.age_years} years` : ''
      const mm = pet.age_months ? `${pet.age_months} months` : ''
      return [yy, mm].filter(Boolean).join(' ')
    }
    return 'Age unknown'
  }

  const statusBadge = () => {
    const statusMap: Record<string, { text: string; variant: string }> = {
      AVAILABLE: { text: 'Available', variant: 'success' },
      PENDING: { text: 'Pending', variant: 'warning' },
      ADOPTED: { text: 'Adopted', variant: 'secondary' },
      LOST: { text: 'Lost', variant: 'danger' },
      DRAFT: { text: 'Draft', variant: 'light' },
      ARCHIVED: { text: 'Archived', variant: 'dark' }
    }
    const status = statusMap[pet.status || 'AVAILABLE'] || statusMap.AVAILABLE
    return <span className={`badge bg-${status.variant} me-2`}>{status.text}</span>
  }

  return (
    <Card className="pet-card my-pet-card h-100 border-0 shadow-sm overflow-hidden position-relative">
      <button
        type="button"
        className="pet-card-delete-btn"
        onClick={handleRemove}
        disabled={removing}
        aria-label="Delete pet"
        title="Delete pet"
      >
        {removing ? (
          <span className="spinner-border spinner-border-sm"></span>
        ) : (
          <i className="bi bi-trash3"></i>
        )}
      </button>
      <div className="pet-card-image-wrapper">
        <Link to={`/adopt/${pet.id}`}>
          <Card.Img
            variant="top"
            src={pet.photo || '/images/pet-placeholder.jpg'}
            alt={pet.name}
            style={{ height: 200, objectFit: 'cover' }}
          />
        </Link>
      </div>
      <Card.Body className="pt-3">
        <Link to={`/adopt/${pet.id}`} className="text-decoration-none text-dark">
          <Card.Title className="fs-5 fw-bold mb-2">{pet.name}</Card.Title>
          <Card.Text className="text-muted small mb-2">
            <i className="bi bi-geo-alt me-1"></i>
            {pet.address_display || pet.city || 'Location unknown'}
          </Card.Text>
          <Card.Text className="small">
            {statusBadge()}
            <span className="badge bg-light text-dark me-2">{pet.species || 'Pet'}</span>
            <span className="text-muted">{ageText()}</span>
          </Card.Text>
        </Link>
      </Card.Body>
    </Card>
  )
}
