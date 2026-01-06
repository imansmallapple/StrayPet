// src/views/user/profile/FriendsList.tsx
import { useState, useEffect } from 'react'
import { Card, Row, Col, Alert, Spinner, Button, Dropdown, Modal } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'
import http from '@/services/http'
import './FriendsList.scss'

interface Friend {
  id: number
  friendship_id: number
  username: string
  avatar?: string
  email?: string
}

interface DeleteConfirmState {
  show: boolean
  friendId?: number
  friendshipId?: number
  friendUsername?: string
}

export default function FriendsList() {
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ show: false })
  const [deleting, setDeleting] = useState(false)
  const [showDeleteToast, setShowDeleteToast] = useState(false)
  const [deleteToastUsername, setDeleteToastUsername] = useState('')

  const handleMessage = (friendId: number, _friendUsername: string) => {
    // 清除该用户在已关闭列表中的记录
    const stored = localStorage.getItem('closedConversations')
    if (stored) {
      try {
        const closed = new Set(JSON.parse(stored) as number[])
        closed.delete(friendId)
        localStorage.setItem('closedConversations', JSON.stringify(Array.from(closed)))
      } catch (e) {
        console.error('清除已关闭对话失败:', e)
      }
    }
    // 导航到消息中心并打开与该好友的对话
    navigate(`/user/profile?user=${friendId}#message-center`)
  }

  const openDeleteConfirm = (friendId: number, friendshipId: number, friendUsername: string) => {
    setDeleteConfirm({ show: true, friendId, friendshipId, friendUsername })
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ show: false })
  }

  const handleDeleteFriend = async () => {
    if (!deleteConfirm.friendId || !deleteConfirm.friendshipId) return
    
    const friendNameToShow = deleteConfirm.friendUsername || 'Friend'
    setDeleting(true)
    try {
      await http.delete(`/user/friendships/${deleteConfirm.friendshipId}/`)
      
      // 从列表中移除该好友
      setFriends(friends.filter(f => f.id !== deleteConfirm.friendId))
      
      // 显示成功提示气泡
      setDeleteToastUsername(friendNameToShow)
      setShowDeleteToast(true)
      
      // 关闭确认框（在设置完toast状态后）
      closeDeleteConfirm()
      
    } catch (err: any) {
      alert(`Failed to delete friend: ${err?.response?.data?.detail || err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const loadFriends = async () => {
    setLoading(true)
    try {
      const { data } = await authApi.getFriendsList()
      const friendsList = data.results || data || []
      setFriends(friendsList)
      setError('')
    } catch (e: any) {
      console.error('[FriendsList] Error loading friends:', e)
      setError(e?.response?.data?.detail || 'Failed to load friends list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFriends()
    
    // 监听好友关系更新事件
    const handleFriendshipUpdate = () => {
      loadFriends()
    }
    
    window.addEventListener('friendship:updated', handleFriendshipUpdate)
    return () => {
      window.removeEventListener('friendship:updated', handleFriendshipUpdate)
    }
  }, [])

  useEffect(() => {
    if (showDeleteToast) {
      const timer = setTimeout(() => {
        setShowDeleteToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [showDeleteToast])

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">Loading...</div>
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
          <h5 className="mt-3 text-muted">No friends added yet</h5>
          <p className="text-muted mb-3">Visit other users' profiles to add friends</p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <h4 className="mb-0">
            <i className="bi bi-people-fill me-2"></i>
            My Friends ({friends.length})
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
                        <Dropdown.Item onClick={() => {/* 黑名单功能待实现 */}}>
                          <i className="bi bi-person-slash me-2"></i>
                          Block
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => {/* 免打扰功能待实现 */}}>
                          <i className="bi bi-bell-slash me-2"></i>
                          Mute
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          className="text-danger"
                          onClick={() => openDeleteConfirm(friend.id, friend.friendship_id, friend.username)}
                        >
                          <i className="bi bi-trash me-2"></i>
                          Delete Friend
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
                    {deleteConfirm.friendId !== friend.id && (
                      <>
                        <Link 
                          to={`/user/profile/${friend.id}`}
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                        >
                          <i className="bi bi-person me-1"></i>
                          Profile
                        </Link>
                        <Button 
                          variant="outline-secondary"
                          size="sm"
                          className="flex-grow-1"
                          onClick={() => handleMessage(friend.id, friend.username)}
                        >
                          <i className="bi bi-chat-dots me-1"></i>
                          Message
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* 删除好友确认 Modal */}
      <Modal show={deleteConfirm.show} onHide={closeDeleteConfirm} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Delete Friend
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Are you sure you want to delete <strong>{deleteConfirm.friendUsername}</strong> from your friends list?
          </p>
          <p className="text-muted small mt-2">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={closeDeleteConfirm} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteFriend}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 删除成功提示 Toast */}
      {showDeleteToast && (
        <div style={{ 
          position: 'fixed', 
          top: '100px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: '#efe', 
          border: '2px solid #cfc',
          color: '#3c3',
          padding: '15px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          animation: 'slideDown 0.3s ease forwards',
          minWidth: '320px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <i className="bi bi-check-circle"></i>
          <span>{deleteToastUsername ? `${deleteToastUsername} has been removed from your friends list` : 'Friend removed successfully'}</span>
        </div>
      )}
    </>
  )
}
