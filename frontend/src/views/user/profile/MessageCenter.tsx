import { useState, useEffect, useRef, useCallback } from 'react'
import { Spinner, Alert, Tabs, Tab, Container, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap'
import { blogApi } from '@/services/modules/blog'
import http from '@/services/http'
import './MessageCenter.scss'

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 获取当前用户ID
  const getCurrentUserId = () => {
    try {
      // 尝试两个可能的 localStorage 键名
      const userInfo = localStorage.getItem('user') || localStorage.getItem('user_info')
      const parsed = JSON.parse(userInfo || '{}')
      const userId = parsed?.id
      console.warn('DEBUG: 获取用户信息, user:', localStorage.getItem('user'), 'parsed:', parsed, 'userId:', userId)
      return userId || null
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return null
    }
  }

  // 加载私信对话列表
  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const currentUserId = getCurrentUserId()
      console.warn('当前用户ID:', currentUserId)
      
      const { data } = await http.get('/user/messages/')
      const convMap = new Map<number, Conversation>()
      
      data.results?.forEach((msg: MessageItem) => {
        // 确定另一方用户（不是当前用户）
        const otherUserId = msg.sender.id === currentUserId ? msg.recipient.id : msg.sender.id
        const otherUser = msg.sender.id === currentUserId ? msg.recipient : msg.sender
        
        console.warn(`消息: sender=${msg.sender.id}, recipient=${msg.recipient.id}, otherUserId=${otherUserId}, currentUserId=${currentUserId}`)
        
        // 仅在不是同一个人时记录
        if (otherUserId !== currentUserId && !convMap.has(otherUserId)) {
          console.warn(`添加对话: ${otherUser.username}`)
          convMap.set(otherUserId, {
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
  const loadConversation = useCallback(async (userId: number) => {
    try {
      const { data } = await http.get('/user/messages/conversation/', {
        params: { user_id: userId }
      })
      // 按时间正序排列消息（旧的在前，新的在后）
      const sortedMessages = (data.results || data || []).sort((a: MessageItem, b: MessageItem) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setPrivateMessages(sortedMessages)
      // 标记为已读
      sortedMessages?.forEach((msg: MessageItem) => {
        if (!msg.is_read && msg.recipient.id === getCurrentUserId()) {
          markMessageAsRead(msg.id)
        }
      })
    } catch (e) {
      console.error('加载对话失败', e)
    }
  }, [])

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
    if ((!messageInput.trim() && !selectedImage) || !selectedUser) return
    try {
      await http.post('/user/messages/', {
        recipient_id: selectedUser.id,
        content: messageInput
      })
      // 直接刷新对话，确保两端消息同步
      await loadConversation(selectedUser.id)
      setMessageInput('')
      setSelectedImage(null)
      setImagePreview(null)
      setShowEmojiPicker(false)
      scrollToBottom()
    } catch (_e) {
      alert('发送失败')
    }
  }

  // 插入emoji
  const insertEmoji = (emoji: string) => {
    setMessageInput(messageInput + emoji)
    setShowEmojiPicker(false)
  }

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      alert('请选择有效的图片文件')
    }
  }

  // 清除图片
  const clearImagePreview = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 常用emoji表情
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😙', '👍', '👎', '❤️', '💔', '💕', '💖', '🎉', '🎊', '🎈', '✨']

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
                      <Card.Body className="flex-grow-1 overflow-auto p-3" style={{ minHeight: '300px', backgroundColor: '#f8f9fa' }}>
                        <div className="d-flex flex-column gap-3">
                          {privateMessages.map((msg) => {
                            const isOwn = msg.sender.id === getCurrentUserId()
                            return (
                              <div
                                key={msg.id}
                                className={`d-flex ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}
                                style={{ alignItems: 'flex-end' }}
                              >
                                {/* 左边：接收者消息（别人发送的）*/}
                                {!isOwn && (
                                  <div className="d-flex gap-2 align-items-flex-end" style={{ maxWidth: '75%' }}>
                                    {/* 发送者头像 */}
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        minWidth: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#e9ecef',
                                        backgroundImage: msg.sender.avatar ? `url(${msg.sender.avatar})` : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        flexShrink: 0
                                      }}
                                    />
                                    {/* 接收者消息气泡（白色）*/}
                                    <div
                                      style={{
                                        padding: '10px 14px',
                                        borderRadius: '18px 18px 18px 4px',
                                        backgroundColor: 'white',
                                        color: '#333',
                                        wordWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        border: '1px solid #e0e0e0'
                                      }}
                                    >
                                      <p className="mb-2">{msg.content}</p>
                                      <small className="d-block text-muted" style={{ fontSize: '0.75rem' }}>
                                        {formatDate(msg.created_at)}
                                      </small>
                                    </div>
                                  </div>
                                )}

                                {/* 右边：发送者消息（自己发送的）*/}
                                {isOwn && (
                                  <div className="d-flex gap-2 align-items-flex-end flex-row-reverse" style={{ maxWidth: '75%' }}>
                                    {/* 当前用户头像 */}
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        minWidth: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#e9ecef',
                                        backgroundImage: msg.sender.avatar ? `url(${msg.sender.avatar})` : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        flexShrink: 0
                                      }}
                                    />
                                    {/* 发送者消息气泡（蓝色）*/}
                                    <div
                                      style={{
                                        padding: '10px 14px',
                                        borderRadius: '18px 18px 4px 18px',
                                        backgroundColor: '#0d6efd',
                                        color: 'white',
                                        wordWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        boxShadow: '0 1px 2px rgba(13, 110, 253, 0.2)'
                                      }}
                                    >
                                      <p className="mb-2">{msg.content}</p>
                                      <small className="d-block" style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        {formatDate(msg.created_at)}
                                      </small>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      </Card.Body>
                      <Card.Footer className="bg-white border-top">
                        <div className="mb-3">
                          {imagePreview && (
                            <div className="position-relative d-inline-block mb-2">
                              <img src={imagePreview} alt="preview" style={{ maxHeight: '100px', borderRadius: '4px' }} />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0"
                                onClick={clearImagePreview}
                                style={{ transform: 'translate(5px, -5px)' }}
                              >
                                <i className="bi bi-x"></i>
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Emoji选择器 */}
                        {showEmojiPicker && (
                          <div className="bg-light p-2 mb-2 rounded border" style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                            {emojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => insertEmoji(emoji)}
                                style={{
                                  border: 'none',
                                  backgroundColor: 'white',
                                  cursor: 'pointer',
                                  fontSize: '1.2rem',
                                  padding: '4px',
                                  borderRadius: '4px'
                                }}
                                className="hover-bg-primary"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        <InputGroup>
                          <Form.Control
                            placeholder="输入消息..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                              }
                            }}
                            style={{
                              minHeight: '60px',
                              resize: 'none',
                              maxHeight: '120px',
                              overflow: 'auto',
                              fontFamily: 'inherit',
                              userSelect: 'text'
                            }}
                            as="textarea"
                          />
                        </InputGroup>
                        
                        <div className="d-flex gap-2 mt-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="表情"
                          >
                            <i className="bi bi-emoji-smile me-1"></i>
                            表情
                          </Button>
                          
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            title="图片"
                          >
                            <i className="bi bi-image me-1"></i>
                            图片
                          </Button>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            style={{ display: 'none' }}
                          />
                          
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={sendMessage}
                            disabled={!messageInput.trim() && !selectedImage}
                            className="ms-auto"
                          >
                            <i className="bi bi-send me-1"></i>
                            发送
                          </Button>
                        </div>
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
