// src/views/user/profile/FriendsList.tsx
import { useState, useEffect } from 'react'
import { Card, Row, Col, Alert, Spinner, Button, Dropdown } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'
import './FriendsList.scss'

interface Friend {
  id: number
  username: string
  avatar?: string
  email?: string
}

export default function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.warn('[FriendsList] Component mounted')
    let alive = true
    ;(async () => {
      try {
        console.warn('[FriendsList] Fetching friends...')
        const { data } = await authApi.getFriendsList()
        console.warn('[FriendsList] Friends data received:', data)
        if (!alive) return
        const friendsList = data.results || data || []
        console.warn('[FriendsList] Processed friends:', friendsList.length)
        friendsList.forEach((friend: Friend, idx: number) => {
          console.warn(`[FriendsList] Friend ${idx}:`, { id: friend.id, username: friend.username, avatar: friend.avatar })
        })
        setFriends(friendsList)
      } catch (e: any) {
        if (!alive) return
        console.error('[FriendsList] Error loading friends:', e)
        setError(e?.response?.data?.detail || '加载好友列表失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">加载中...</div>
        </Card.Body>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
        </Card.Body>
      </Card>
    )
  }

  if (friends.length === 0) {
    return (
      <Card className="shadow-sm text-center py-5">
        <Card.Body>
          <i className="bi bi-people text-muted" style={{ fontSize: '4rem' }}></i>
          <h5 className="mt-3 text-muted">还没有添加任何好友</h5>
          <p className="text-muted mb-3">去其他用户主页添加好友吧</p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h4 className="mb-0">
          <i className="bi bi-people-fill me-2"></i>
          我的好友 ({friends.length})
        </h4>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          {friends.map((friend) => (
            <Col key={friend.id} xs={12} md={6} lg={4}>
              <div className="friend-card p-3 border rounded-3 h-100 d-flex flex-column position-relative" style={{ backgroundColor: '#f8f9fa', transition: 'all 0.3s ease', overflow: 'visible' }}>
                {/* 三点菜单 */}
                <div className="position-absolute top-0 end-0 p-2">
                  <Dropdown>
                    <Dropdown.Toggle
                      variant="link"
                      className="text-dark p-0 border-0"
                      style={{ textDecoration: 'none', fontSize: '20px' }}
                      id={`dropdown-friend-${friend.id}`}
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="dropdown-menu-centered">
                      <Dropdown.Item>
                        <i className="bi bi-person-slash me-2"></i>
                        加入黑名单
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <i className="bi bi-bell-slash me-2"></i>
                        免打扰
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className="text-danger">
                        <i className="bi bi-trash me-2"></i>
                        删除好友
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                <div className="d-flex align-items-center mb-3 gap-3">
                  <div className="friend-avatar" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {friend.avatar ? (
                      <img 
                        src={friend.avatar} 
                        alt={friend.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="bi bi-person-circle" style={{ fontSize: '40px', color: '#999' }}></i>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 fw-bold">{friend.username}</h6>
                    <small className="text-muted d-block">{friend.email || '—'}</small>
                  </div>
                </div>
                <div className="mt-auto d-flex gap-2">
                  <Link 
                    to={`/user/${friend.id}`}
                    className="btn btn-sm btn-outline-primary flex-grow-1"
                  >
                    <i className="bi bi-person me-1"></i>
                    查看主页
                  </Link>
                  <Button 
                    variant="outline-secondary"
                    size="sm"
                    className="flex-grow-1"
                  >
                    <i className="bi bi-chat-dots me-1"></i>
                    私信
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  )
}
