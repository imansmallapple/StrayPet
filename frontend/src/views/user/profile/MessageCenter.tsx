import { useState, useEffect } from 'react'
import { Spinner, Alert, Tabs, Tab } from 'react-bootstrap'
import { blogApi } from '@/services/modules/blog'

type MessageType = 'replies' | 'notifications'

interface Message {
  id: number
  type: MessageType
  from_user?: { id: number; username: string; avatar?: string }
  title: string
  content: string
  created_at: string
  is_read?: boolean
  article_id?: number
  article_title?: string
}

export default function MessageCenter() {
  const [messageType, setMessageType] = useState<MessageType>('replies')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true)
      setError('')
      try {
        if (messageType === 'replies') {
          const { data } = await blogApi.getRepliesToMe({
            page: 1,
            page_size: 50,
          })
          const formattedMessages: Message[] = (data?.results || []).map((item: any) => ({
            id: item.id,
            type: 'replies' as MessageType,
            from_user: item.user || { id: 0, username: '未知用户' },
            title: item.parent_comment?.content || '原始评论已删除',
            content: item.content || '无内容',
            created_at: item.add_date || item.pub_date || new Date().toISOString(),
            is_read: false,
            article_id: item.article_id,
            article_title: item.article_title,
          }))
          setMessages(formattedMessages)
        } else {
          // 我的消息tab - 暂时不加载API，显示空状态
          setMessages([])
        }
      } catch (err: any) {
        console.error('Failed to load messages:', {
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          data: err?.response?.data,
          message: err?.message,
        })
        // 针对不同错误给出提示
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
    }

    loadMessages()
  }, [messageType])

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
        onSelect={(k) => setMessageType((k as MessageType) || 'replies')}
        className="mb-3"
      >
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

        <Tab eventKey="notifications" title="我的消息">
          <div className="message-content notification-cards-container">
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bell" style={{ fontSize: '3rem' }}></i>
              <div className="mt-3">敬请期待</div>
              <small className="text-muted mt-2 d-block">该功能即将上线</small>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  )
}
