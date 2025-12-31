import { useState, useEffect, useRef, useCallback } from 'react'
import { Spinner, Alert, Tabs, Tab, Container, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap'
import { blogApi } from '@/services/modules/blog'
import http from '@/services/http'

type MessageType = 'replies' | 'private'

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

interface Message {
  id: number
  type: 'replies'
  from_user?: { id: number; username: string; avatar?: string }
  title: string
  content: string
  created_at: string
  is_read?: boolean
  article_id?: number
  article_title?: string
}

export default function MessageCenter() {
  const [messageType, setMessageType] = useState<MessageType>('private')
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [privateMessages, setPrivateMessages] = useState<MessageItem[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 获取当前用户ID
  const getCurrentUserId = () => {
    return JSON.parse(localStorage.getItem('user_info') || '{}')?.id
  }

  // 加载私信对话列表
  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await http.get('/user/messages/')
      const convMap = new Map<number, Conversation>()
      data.results?.forEach((msg: MessageItem) => {
        const currentUserId = getCurrentUserId()
        const otherUser = msg.sender.id === currentUserId ? msg.recipient : msg.sender
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
  }, [])

  // 加载与某用户的对话
  const loadConversation = async (userId: number) => {
    try {
      const { data } = await http.get('/user/messages/conversation/', {
        params: { user_id: userId }
      })
      setPrivateMessages(data.results || [])
      // 标记为已读
      data.results?.forEach((msg: MessageItem) => {
        if (!msg.is_read && msg.recipient.id === getCurrentUserId()) {
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

  // 发送私信
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedUser) return
    try {
      const { data } = await http.post('/user/messages/', {
        recipient_id: selectedUser.id,
        content: messageInput
      })
      setPrivateMessages([...privateMessages, data])
      setMessageInput('')
      scrollToBottom()
    } catch (_e) {
      alert('发送失败')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadReplies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await blogApi.getRepliesToMe({
        page: 1,
        page_size: 50,
      })
      const formattedMessages: Message[] = (data?.results || []).map((item: any) => ({
        id: item.id,
        type: 'replies' as const,
        from_user: item.user || { id: 0, username: '未知用户' },
        title: item.parent_comment?.content || '原始评论已删除',
        content: item.content || '无内容',
        created_at: item.add_date || item.pub_date || new Date().toISOString(),
        is_read: false,
        article_id: item.article_id,
        article_title: item.article_title,
      }))
      setMessages(formattedMessages)
    } catch (err: any) {
      console.error('Failed to load messages:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message,
      })
      if (err?.response?.status === 404) {
        setError('消息接口不存在')
      } else if (err?.response?.status === 401) {
        setError('请重新登录')
      } else {
        setError('加载消息失败')
      }
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (messageType === 'private') {
      loadConversations()
    } else if (messageType === 'replies') {
      loadReplies()
    }
  }, [messageType, loadConversations, loadReplies])

  useEffect(() => {
    scrollToBottom()
  }, [privateMessages])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '时间未知'
    
    const date = new Date(dateStr)
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '时间未知'
    }
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="message-center">
      <Tabs
        activeKey={messageType}
        onSelect={(k) => setMessageType((k as MessageType) || 'private')}
        className="mb-3"
      >
        <Tab eventKey="private" title="我的消息">
          <div className="message-content private-messages-container">
            <Container fluid className="py-3">
              <Row className="g-3" style={{ minHeight: '400px' }}>
                {/* 左侧对话列表 */}
                <Col md={4}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-white border-bottom">
                      <h5 className="mb-0">
                        <i className="bi bi-chat-dots-fill me-2"></i>
                        消息列表
                      </h5>
                    </Card.Header>
                    <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '500px' }}>
                      {loading ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" variant="primary" size="sm" />
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="text-center text-muted py-4">
                          <p>暂无消息</p>
                        </div>
                      ) : (
                        <div>
                          {conversations.map(conv => (
                            <div
                              key={conv.otherUser.id}
                              className={`p-3 border-bottom cursor-pointer ${
                                selectedUser?.id === conv.otherUser.id ? 'bg-light' : ''
                              }`}
                              onClick={() => {
                                setSelectedUser(conv.otherUser)
                                loadConversation(conv.otherUser.id)
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex gap-2 align-items-start">
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: '#e9ecef',
                                    backgroundImage: conv.otherUser.avatar ? `url(${conv.otherUser.avatar})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    flexShrink: 0
                                  }}
                                />
                                <div className="flex-grow-1 min-w-0">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <strong className="text-dark">{conv.otherUser.username}</strong>
                                    <small className="text-muted">{formatDate(conv.lastMessageTime || '')}</small>
                                  </div>
                                  <small className="text-muted text-truncate d-block">
                                    {conv.lastMessage}
                                  </small>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* 右侧聊天界面 */}
                <Col md={8}>
                  {selectedUser ? (
                    <Card className="shadow-sm border-0 h-100 d-flex flex-column">
                      <Card.Header className="bg-white border-bottom">
                        <h5 className="mb-0">{selectedUser.username}</h5>
                      </Card.Header>
                      <Card.Body className="flex-grow-1 overflow-auto p-3" style={{ minHeight: '300px' }}>
                        <div>
                          {privateMessages.map((msg) => {
                            const isOwn = msg.sender.id === getCurrentUserId()
                            return (
                              <div
                                key={msg.id}
                                className={`d-flex mb-3 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}
                              >
                                <div
                                  className={`${isOwn ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                                  style={{
                                    maxWidth: '70%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  <p className="mb-1">{msg.content}</p>
                                  <small className={isOwn ? 'text-white-50' : 'text-muted'}>
                                    {formatDate(msg.created_at)}
                                  </small>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      </Card.Body>
                      <Card.Footer className="bg-white border-top">
                        <InputGroup>
                          <Form.Control
                            placeholder="输入消息..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                sendMessage()
                              }
                            }}
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
                    <Card className="shadow-sm border-0">
                      <Card.Body className="text-center py-5 text-muted">
                        <i className="bi bi-chat" style={{ fontSize: '3rem' }}></i>
                        <div className="mt-3">选择一个对话开始聊天</div>
                      </Card.Body>
                    </Card>
                  )}
                </Col>
              </Row>
            </Container>
          </div>
        </Tab>

        <Tab eventKey="replies" title="回复我的">
          <div className="message-content reply-cards-container">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="mt-3">加载中...</div>
              </div>
            ) : error ? (
              <Alert variant="warning">{error}</Alert>
            ) : messages.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-chat-left" style={{ fontSize: '3rem' }}></i>
                <div className="mt-3">暂无回复</div>
              </div>
            ) : (
              <div className="reply-cards">
                {messages.map((msg) => (
                  <div key={msg.id} className="reply-card">
                    <div className="card-header">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <strong>{msg.from_user?.username || '未知用户'}回复了我</strong>
                        <small className="text-muted">{formatDate(msg.created_at)}</small>
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="reply-content mb-3">{msg.content}</p>
                      {msg.title && msg.title !== '原始评论已删除' && (
                        <div className="original-comment mb-3 p-3 bg-light rounded border-start border-primary">
                          <small className="text-muted d-block mb-1">
                            <i className="bi bi-chat-left-quote me-1"></i>回复于评论
                          </small>
                          <small className="text-dark">{msg.title}</small>
                        </div>
                      )}
                      {msg.article_title && (
                        <small className="text-muted d-block mb-0">
                          <i className="bi bi-file-text me-1"></i>在文章：<span className="text-primary">{msg.article_title}</span>
                        </small>
                      )}
                    </div>
                    <div className="card-footer">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          // TODO: 回复
                        }}
                      >
                        <i className="bi bi-reply me-1"></i>
                        回复
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  )
}
