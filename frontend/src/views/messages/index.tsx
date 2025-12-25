import { useState, useEffect } from 'react'
import { Container, Row, Col, Nav, Card, Spinner, Alert, Badge, Button } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'
import { authApi } from '@/services/modules/auth'
import './index.scss'

type MessageTab = 'replies' | 'mentions' | 'system'

interface Message {
  id: number
  notification_type: 'reply' | 'mention' | 'system'
  from_user?: {
    id: number
    username: string
  }
  title: string
  content: string
  is_read: boolean
  created_at: string
  related_article?: {
    id: number
    title: string
  }
}

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = (searchParams.get('tab') || 'replies') as MessageTab
  const [activeTab, setActiveTab] = useState<MessageTab>(tabParam)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [counts, setCounts] = useState({ replies: 0, mentions: 0, system: 0 })

  useEffect(() => {
    setSearchParams({ tab: activeTab })
    loadMessages(activeTab)
  }, [activeTab, setSearchParams])

  const loadMessages = async (tab: MessageTab) => {
    setLoading(true)
    setError('')
    try {
      // 映射前端 tab 到后端 notification_type
      let notificationType: 'reply' | 'mention' | 'system' = 'reply'
      if (tab === 'mentions') {
        notificationType = 'mention'
      } else if (tab === 'system') {
        notificationType = 'system'
      }
      
      const { data } = await authApi.getNotifications({
        notification_type: notificationType,
        page: 1,
        page_size: 20
      })
      setMessages(data.results || [])
      setCounts(prev => ({ ...prev, [tab]: data.count || 0 }))
    } catch (e: any) {
      setError(e?.response?.data?.detail || '加载消息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await authApi.markNotificationAsRead(messageId)
      setMessages(messages.map(m => m.id === messageId ? { ...m, is_read: true } : m))
    } catch (err) {
      console.error('Mark as read failed:', err)
    }
  }

  const handleDelete = async (messageId: number) => {
    if (!window.confirm('确定要删除这条消息吗？')) return
    try {
      await authApi.deleteNotification(messageId)
      setMessages(messages.filter(m => m.id !== messageId))
    } catch (err) {
      console.error('Delete failed:', err)
      alert('删除失败')
    }
  }

  const getTabLabel = (tab: MessageTab) => {
    const labels = {
      replies: '回复我的',
      mentions: '@我的',
      system: '系统通知'
    }
    return labels[tab]
  }

  const getTabIcon = (tab: MessageTab) => {
    const icons = {
      replies: 'chat-dots-fill',
      mentions: 'at',
      system: 'info-circle-fill'
    }
    return icons[tab]
  }

  return (
    <Container fluid className="messages-page py-4">
      <Row className="h-100">
        {/* 左侧导航 */}
        <Col md={3} className="messages-sidebar">
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Nav className="flex-column">
                {(['replies', 'mentions', 'system'] as MessageTab[]).map(tab => (
                  <Nav.Link
                    key={tab}
                    as="button"
                    type="button"
                    className={`messages-nav-link text-start ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    <i className={`bi bi-${getTabIcon(tab)} me-2`}></i>
                    {getTabLabel(tab)}
                    {counts[tab] > 0 && (
                      <Badge bg="danger" className="ms-2">
                        {counts[tab]}
                      </Badge>
                    )}
                  </Nav.Link>
                ))}
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* 右侧内容 */}
        <Col md={9}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-3">加载中…</div>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : messages.length === 0 ? (
            <Card className="shadow-sm text-center py-5 border-0">
              <Card.Body>
                <i className={`bi bi-${getTabIcon(activeTab)} text-muted`} style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3 text-muted">暂无消息</h5>
              </Card.Body>
            </Card>
          ) : (
            <div className="messages-list">
              {messages.map(message => (
                <Card
                  key={message.id}
                  className={`message-card shadow-sm border-0 mb-3 ${!message.is_read ? 'unread' : ''}`}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        {/* 消息头部 */}
                        <div className="message-header mb-2">
                          {message.from_user && (
                            <span className="message-user fw-bold text-primary">
                              {message.from_user.username}
                            </span>
                          )}
                          <span className="message-type text-muted ms-2">
                            {getTabLabel(message.notification_type as any)}
                          </span>
                          <span className="message-time text-muted ms-auto">
                            {new Date(message.created_at).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* 消息内容 */}
                        <div className="message-content mb-2">
                          {message.title && (
                            <div className="message-title fw-bold mb-2">{message.title}</div>
                          )}
                          {message.content && (
                            <div className="message-text">{message.content}</div>
                          )}
                        </div>

                        {/* 关联文章 */}
                        {message.related_article && (
                          <div className="message-related mt-2 p-2 bg-light rounded">
                            <small className="text-muted">
                              <i className="bi bi-file-earmark-text me-1"></i>
                              相关文章：{message.related_article.title}
                            </small>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="message-actions ms-3">
                        {!message.is_read && (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleMarkAsRead(message.id)}
                            className="me-2"
                          >
                            标记已读
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(message.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  )
}
