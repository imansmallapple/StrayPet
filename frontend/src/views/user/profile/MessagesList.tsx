import { useState, useEffect } from 'react'
import { Card, Spinner, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'

interface Conversation {
  user_id: number
  username: string
  avatar?: string
  last_message?: string
  last_message_time?: string
  unread_count: number
}

export default function MessagesList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setLoading(true)
    setError('')
    try {
      // 获取所有通知（不仅仅是系统通知）来调试
      const token = localStorage.getItem('access_token')
      const response = await fetch('/user/notifications/', {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
      })
      
      console.warn('Notifications API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.warn('Notifications data:', data)
        
        // 如果没有通知，显示空状态
        if (!data.results || data.results.length === 0) {
          console.warn('No notifications found')
          setConversations([])
          return
        }
        
        // 将通知转换为对话格式，过滤好友相关通知
        const conversationMap = new Map<number, Conversation>()
        data.results.forEach((notif: any) => {
          // 只显示包含"好友申请"的通知
          if (notif.title && notif.title.includes('好友申请')) {
            const userId = notif.from_user?.id
            if (userId && !conversationMap.has(userId)) {
              conversationMap.set(userId, {
                user_id: userId,
                username: notif.from_user?.username || '未知用户',
                avatar: notif.from_user?.avatar,
                last_message: notif.title,
                last_message_time: notif.created_at,
                unread_count: notif.is_read ? 0 : 1,
              })
            }
          }
        })
        
        console.warn('Filtered conversations:', Array.from(conversationMap.values()))
        setConversations(Array.from(conversationMap.values()))
      } else if (response.status === 401) {
        setError('请重新登录')
      } else {
        console.error('Failed to load notifications:', response.status, response.statusText)
        setError('暂无消息')
        setConversations([])
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError('暂无消息')
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
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
          <Alert variant="warning">{error}</Alert>
        </Card.Body>
      </Card>
    )
  }

  if (conversations.length === 0) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <i className="bi bi-chat-left-dots" style={{ fontSize: '3rem', color: '#ccc' }}></i>
          <div className="mt-3 text-muted">暂无消息</div>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-light border-bottom">
        <h5 className="mb-0">我的消息</h5>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="list-group list-group-flush">
          {conversations.map((conv) => (
            <Link
              key={conv.user_id}
              to={`/user/${conv.user_id}#info`}
              className="list-group-item list-group-item-action p-3 d-flex justify-content-between align-items-start"
            >
              <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="mb-0">{conv.username}</h6>
                  {conv.unread_count > 0 && (
                    <span className="badge bg-primary ms-2">{conv.unread_count}</span>
                  )}
                </div>
                <p className="mb-0 text-muted small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.last_message || '暂无消息'}
                </p>
              </div>
              <small className="text-muted ms-2">
                {conv.last_message_time && formatDate(conv.last_message_time)}
              </small>
            </Link>
          ))}
        </div>
      </Card.Body>
    </Card>
  )
}
