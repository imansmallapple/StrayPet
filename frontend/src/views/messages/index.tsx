import { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Card, Spinner, Button, Form, InputGroup } from 'react-bootstrap'
import http from '@/services/http'
import './index.scss'

interface User {
  id: number
  username: string
  avatar?: string
  email?: string
}

interface Conversation {
  otherUser: User
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

interface MessageItem {
  id: number
  sender: User
  recipient: User
  content: string
  created_at: string
  is_read: boolean
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 加载我的消息（私信对话列表）
  const loadConversations = async () => {
    setLoading(true)
    try {
      const { data } = await http.get('/user/messages/')
      // 分组用户对话
      const convMap = new Map<number, Conversation>()
      data.results?.forEach((msg: MessageItem) => {
        const otherUser = msg.sender.id === (window as any).currentUserId ? msg.recipient : msg.sender
        if (!convMap.has(otherUser.id)) {
          convMap.set(otherUser.id, {
            otherUser,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: msg.is_read ? 0 : 1
          })
        }
      })
      setConversations(Array.from(convMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      ))
    } catch (e: any) {
      console.error('加载对话列表失败', e?.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  // 加载与某用户的对话
  const loadConversation = async (userId: number) => {
    try {
      const { data } = await http.get('/user/messages/conversation/', {
        params: { user_id: userId }
      })
      setMessages(data.results || [])
      // 标记为已读
      data.results?.forEach((msg: MessageItem) => {
        if (!msg.is_read && msg.recipient.id === (window as any).currentUserId) {
          markMessageAsRead(msg.id)
        }
      })
    } catch (e) {
      console.error('加载对话失败', e)
    }
  }

  // 标记消息已读
  const markMessageAsRead = async (messageId: number) => {
    try {
      await http.post(`/user/messages/${messageId}/mark_as_read/`)
    } catch (e) {
      console.error('标记已读失败', e)
    }
  }

  // 发送消息
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedUser) return
    try {
      const { data } = await http.post('/user/messages/', {
        recipient_id: selectedUser.id,
        content: messageInput
      })
      setMessages([...messages, data])
      setMessageInput('')
      scrollToBottom()
    } catch (_e) {
      alert('发送失败')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <Container fluid className="messages-page py-3">
        <Row className="g-3 h-100" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {/* 左侧对话列表 */}
          <Col md={4} className="messages-conversations">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="bi bi-chat-dots-fill me-2"></i>
                  我的消息
                </h5>
              </Card.Header>
              <Card.Body className="p-0 overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" size="sm" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <p>暂无消息</p>
                  </div>
                ) : (
                  <div className="conversations-list">
                    {conversations.map(conv => (
                      <div
                        key={conv.otherUser.id}
                        className={`conversation-item p-3 border-bottom cursor-pointer ${
                          selectedUser?.id === conv.otherUser.id ? 'active' : ''
                        }`}
                        onClick={() => {
                          setSelectedUser(conv.otherUser)
                          loadConversation(conv.otherUser.id)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex gap-3">
                          <div className="conversation-avatar" style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: '#e9ecef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {conv.otherUser.avatar ? (
                              <img src={conv.otherUser.avatar} alt={conv.otherUser.username} style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }} />
                            ) : (
                              <i className="bi bi-person-circle" style={{ fontSize: '30px', color: '#999' }}></i>
                            )}
                          </div>
                          <div className="flex-grow-1 min-width-0">
                            <h6 className="mb-1 fw-bold">{conv.otherUser.username}</h6>
                            <small className="text-muted text-truncate d-block">
                              {conv.lastMessage || '暂无消息'}
                            </small>
                            <small className="text-muted">{new Date(conv.lastMessageTime || '').toLocaleDateString()}</small>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="badge bg-danger">{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* 右侧消息对话 */}
          <Col md={8} className="messages-chat">
            {selectedUser ? (
              <Card className="shadow-sm border-0 h-100 d-flex flex-column">
                {/* 对话头部 */}
                <Card.Header className="bg-white border-bottom">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} alt={selectedUser.username} style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }} />
                      ) : (
                        <i className="bi bi-person-circle" style={{ fontSize: '24px', color: '#999' }}></i>
                      )}
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">{selectedUser.username}</h6>
                      <small className="text-muted">{selectedUser.email}</small>
                    </div>
                  </div>
                </Card.Header>

                {/* 消息列表 */}
                <Card.Body className="flex-grow-1 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="messages-container">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`message-bubble mb-3 d-flex ${
                          msg.sender.id === (window as any).currentUserId ? 'justify-content-end' : 'justify-content-start'
                        }`}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            backgroundColor: msg.sender.id === (window as any).currentUserId ? '#0d6efd' : '#e9ecef',
                            color: msg.sender.id === (window as any).currentUserId ? 'white' : 'black',
                            wordBreak: 'break-word'
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </Card.Body>

                {/* 消息输入框 */}
                <Card.Footer className="bg-white border-top">
                  <InputGroup>
                    <Form.Control
                      placeholder="请输入消息内容"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      style={{ height: '44px' }}
                    />
                    <Button
                      variant="primary"
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <i className="bi bi-send me-1"></i>
                      发送
                    </Button>
                  </InputGroup>
                </Card.Footer>
              </Card>
            ) : (
              <Card className="shadow-sm border-0 h-100 d-flex align-items-center justify-content-center">
                <div className="text-center text-muted">
                  <i className="bi bi-chat-dots" style={{ fontSize: '4rem' }}></i>
                  <p className="mt-3">选择一个对话开始聊天</p>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    )

}
