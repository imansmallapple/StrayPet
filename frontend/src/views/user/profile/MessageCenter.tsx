import { useState, useEffect, useRef, useCallback } from 'react'
import { Spinner, Alert, Tabs, Tab, Container, Row, Col, Card, Button, Form, InputGroup, Badge } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'
import { blogApi } from '@/services/modules/blog'
import { notificationApi, type Notification } from '@/services/modules/notification'
import http from '@/services/http'
import './MessageCenter.scss'

type MessageType = 'replies' | 'private' | 'notifications'

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
  is_system?: boolean
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
  const [searchParams] = useSearchParams()
  const [messageType, setMessageType] = useState<MessageType>('private')
  const [messages, setMessages] = useState<Message[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
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
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null)
  const [closedConversations, setClosedConversations] = useState<Set<number>>(
    () => {
      const stored = localStorage.getItem('closedConversations')
      return new Set(stored ? JSON.parse(stored) : [])
    }
  )

  // 保存已关闭的对话到 localStorage
  const saveClosedConversations = (closed: Set<number>) => {
    localStorage.setItem('closedConversations', JSON.stringify(Array.from(closed)))
    setClosedConversations(closed)
  }

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
        
        // 仅在不是同一个人时记录，且不在已关闭列表中
        if (otherUserId !== currentUserId && !convMap.has(otherUserId) && !closedConversations.has(otherUserId)) {
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
  }, [closedConversations])

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
      alert('Please select a valid image file')
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
    if (messagesEndRef.current) {
      // 只在容器内滚动，不滚动整个页面
      const container = messagesEndRef.current.closest('[style*="overflow"]')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
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
        setError('Message interface not found')
      } else if (err?.response?.status === 401) {
        setError('Please log in again')
      } else {
        setError('Failed to load messages')
      }
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await notificationApi.getUnread()
      setNotifications(data || [])
    } catch (err: any) {
      console.error('Failed to load notifications:', err)
      setError('Failed to load notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (messageType === 'private') {
      loadConversations()
    } else if (messageType === 'replies') {
      loadReplies()
    } else if (messageType === 'notifications') {
      loadNotifications()
    }
  }, [messageType, loadConversations, loadReplies, loadNotifications])

  useEffect(() => {
    scrollToBottom()
  }, [privateMessages])

  // 处理 URL 参数，自动打开指定用户的对话
  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId && conversations.length > 0) {
      const targetUserId = Number(userId)
      const targetConversation = conversations.find(c => c.otherUser.id === targetUserId)
      if (targetConversation) {
        // 在 loadConversation 完成前先更新 selectedUser
        const updateAndLoad = async () => {
          const tempUser = targetConversation.otherUser
          await loadConversation(tempUser.id)
          setSelectedUser(tempUser)
        }
        updateAndLoad()
      }
    }
  }, [searchParams, conversations, loadConversation])

  // 翻译消息内容（从中文翻译成英文）
  const translateMessageContent = (content: string): string => {
    const translations: { [key: string]: string } = {
      '我们已成为好友，可以开始聊天了！': 'We are now friends, you can start chatting!',
    }
    return translations[content] || content
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Time unknown'
    
    const date = new Date(dateStr)
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return 'Time unknown'
    }
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US')
  }

  const handleAcceptFriendRequest = async (notificationId: number, friendshipId: number | undefined) => {
    if (!friendshipId) {
      alert('Invalid friend request')
      return
    }
    try {
      await notificationApi.markAsRead(notificationId)
      // Call the friendship API endpoint
      await http.post(`/user/friendships/${friendshipId}/accept/`)
      loadNotifications()
    } catch (error: any) {
      console.error('Failed to accept friend request:', error)
      alert('Failed to accept friend request')
    }
  }

  const handleRejectFriendRequest = async (notificationId: number, friendshipId: number | undefined) => {
    if (!friendshipId) {
      alert('Invalid friend request')
      return
    }
    try {
      await notificationApi.markAsRead(notificationId)
      // Call the friendship API endpoint
      await http.post(`/user/friendships/${friendshipId}/reject/`)
      loadNotifications()
    } catch (error: any) {
      console.error('Failed to reject friend request:', error)
      alert('Failed to reject friend request')
    }
  }

  return (
    <div className="message-center">
      <Tabs
        activeKey={messageType}
        onSelect={(k) => setMessageType((k as MessageType) || 'private')}
        className="mb-3"
      >
        <Tab eventKey="private" title="My Messages">
          <div className="message-content private-messages-container">
            <Container fluid className="py-3">
              <Row className="g-3" style={{ minHeight: '400px' }}>
                {/* 左侧对话列表 */}
                <Col md={4}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-white border-bottom">
                      <h5 className="mb-0">
                        <i className="bi bi-chat-dots-fill me-2"></i>
                        Message List
                      </h5>
                    </Card.Header>
                    <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '500px' }}>
                      {loading ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" variant="primary" size="sm" />
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="text-center text-muted py-4">
                          <p>No messages</p>
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
                              onMouseEnter={() => setHoveredUserId(conv.otherUser.id)}
                              onMouseLeave={() => setHoveredUserId(null)}
                              style={{ cursor: 'pointer', position: 'relative' }}
                            >
                              <div className="d-flex gap-2 align-items-start">
                                {hoveredUserId === conv.otherUser.id && (
                                  <button
                                    type="button"
                                    className="btn btn-sm p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // 添加到已关闭列表
                                      const newClosed = new Set(closedConversations)
                                      newClosed.add(conv.otherUser.id)
                                      saveClosedConversations(newClosed)
                                      // 从对话列表中移除该对话
                                      setConversations(conversations.filter(c => c.otherUser.id !== conv.otherUser.id))
                                      // 如果当前选中的是这个对话，清空选中
                                      if (selectedUser?.id === conv.otherUser.id) {
                                        setSelectedUser(null)
                                      }
                                    }}
                                    title="Close chat"
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: 'none',
                                      background: 'transparent',
                                      color: '#dc3545',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      marginTop: '2px',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                )}
                                {hoveredUserId !== conv.otherUser.id && (
                                  <div style={{ width: '20px', flexShrink: 0 }} />
                                )}
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
                                  <div className="d-flex justify-content-between align-items-start mb-1" style={{ gap: '8px' }}>
                                    <strong className="text-dark" style={{ whiteSpace: 'nowrap' }}>{conv.otherUser.username}</strong>
                                    <small className="text-muted" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{formatDate(conv.lastMessageTime || '')}</small>
                                  </div>
                                  <small className="text-muted d-block" style={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.4'
                                  }}>
                                    {translateMessageContent(conv.lastMessage || '')}
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
                      <Card.Body className="flex-grow-1 overflow-auto p-3" style={{ minHeight: '550px', backgroundColor: '#f8f9fa' }}>
                        <div className="d-flex flex-column gap-3">
                          {privateMessages
                            .reduce((acc, msg) => {
                              // 对于系统消息，如果内容相同则跳过（去除所有重复的系统消息）
                              if (msg.is_system) {
                                const isDuplicate = acc.some(m => m.is_system && m.content === msg.content)
                                if (isDuplicate) {
                                  return acc // 跳过重复的系统消息
                                }
                              }
                              return [...acc, msg]
                            }, [] as MessageItem[])
                            .map((msg) => {
                            const isOwn = msg.sender.id === getCurrentUserId()
                            const isSystem = msg.is_system
                            
                            // 系统消息显示为居中的灰色文本
                            if (isSystem) {
                              return (
                                <div
                                  key={msg.id}
                                  className="d-flex justify-content-center"
                                  style={{ alignItems: 'center' }}
                                >
                                  <div
                                    style={{
                                      padding: '8px 14px',
                                      borderRadius: '12px',
                                      backgroundColor: '#f0f0f0',
                                      color: '#999',
                                      fontSize: '0.85rem',
                                      textAlign: 'center',
                                      maxWidth: '75%',
                                      wordWrap: 'break-word',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    <p className="mb-1">{translateMessageContent(msg.content)}</p>
                                    <small style={{ fontSize: '0.7rem', color: '#bbb' }}>
                                      {formatDate(msg.created_at)}
                                    </small>
                                  </div>
                                </div>
                              )
                            }
                            
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
                                        borderRadius: '4px 18px 18px 18px',
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
                                        borderRadius: '18px 4px 18px 18px',
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
                      <Card.Footer className="bg-white border-top position-relative">
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
                          <div className="bg-light p-2 rounded border position-absolute" style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', bottom: '100%', left: 0, right: 0, zIndex: 1000, maxWidth: '100%', marginBottom: '8px' }}>
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
                            placeholder="Type message..."
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
                            title="Emoji"
                          >
                            <i className="bi bi-emoji-smile me-1"></i>
                            emoji
                          </Button>
                          
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            title="Image"
                          >
                            <i className="bi bi-image me-1"></i>
                            image
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
                            Send
                          </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  ) : (
                    <Card className="shadow-sm border-0">
                      <Card.Body className="text-center py-5 text-muted">
                        <i className="bi bi-chat" style={{ fontSize: '3rem' }}></i>
                        <div className="mt-3">Select a conversation to start chatting</div>
                      </Card.Body>
                    </Card>
                  )}
                </Col>
              </Row>
            </Container>
          </div>
        </Tab>

        <Tab eventKey="replies" title="Replies to Me">
          <div className="message-content reply-cards-container">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="mt-3">Loading...</div>
              </div>
            ) : error ? (
              <Alert variant="warning">{error}</Alert>
            ) : messages.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-chat-dots" style={{ fontSize: '3rem' }}></i>
                <div className="mt-3">No replies yet</div>
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

        <Tab eventKey="notifications" title="Notifications">
          <div className="message-content notifications-container">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="mt-3">Loading...</div>
              </div>
            ) : error ? (
              <Alert variant="warning">{error}</Alert>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-bell" style={{ fontSize: '3rem' }}></i>
                <div className="mt-3">No notifications</div>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notif) => (
                  <div key={notif.id} className="notification-item card mb-3">
                    <div className="card-body">
                      <div className="d-flex align-items-start gap-3">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <strong>{notif.from_user?.username || 'System'}</strong>
                            <Badge bg={notif.notification_type === 'friend_request' ? 'info' : 'warning'}>
                              {notif.notification_type === 'friend_request' ? 'Friend Request' : 
                               notif.notification_type === 'reply' ? 'Reply' : 'Notification'}
                            </Badge>
                            <small className="text-muted ms-auto">{formatDate(notif.created_at)}</small>
                          </div>
                          <p className="mb-3 text-muted">{notif.content || notif.title}</p>
                        </div>
                      </div>

                      {/* 好友申请特殊处理 */}
                      {notif.notification_type === 'friend_request' && (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => handleAcceptFriendRequest(notif.id, notif.friendship_id)}
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRejectFriendRequest(notif.id, notif.friendship_id)}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Reject
                          </button>
                        </div>
                      )}
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
