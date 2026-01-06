import { useState, useEffect } from 'react'
import { Badge, Dropdown, Alert, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { notificationApi, friendshipApi, type Notification } from '@/services/modules/notification'
import './NotificationBell.scss'

// 格式化时间
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    // 否则显示 MM-DD HH:mm 格式
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/, /, ' ')
  } catch {
    return dateString
  }
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // 获取未读通知数
  const { refresh: refreshUnreadCount } = useRequest(
    async () => {
      const response = await notificationApi.getUnreadCount()
      return response.data
    },
    {
      onSuccess: (res: any) => {
        setUnreadCount(res.unread_count || 0)
      },
      pollingInterval: 30000, // 每30秒轮询一次
    }
  )

  // 获取未读通知列表
  const { data: unreadData, loading: unreadLoading, refresh: refreshUnread } = useRequest(
    async () => {
      const response = await notificationApi.getUnread()
      return response.data
    },
    {
      ready: showNotifications,
    }
  )

  const unreadNotifications = (unreadData as Notification[]) || []

  // 标记通知为已读
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationApi.markAsRead(notificationId)
      refreshUnread()
      refreshUnreadCount()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // 接受好友请求
  const handleAcceptFriend = async (notificationId: number, friendshipId: number | undefined) => {
    if (!friendshipId) {
      console.error('Missing friendship_id')
      return
    }
    try {
      await friendshipApi.acceptFriendRequest(friendshipId)
      // 标记通知为已读
      await notificationApi.markAsRead(notificationId)
      refreshUnread()
      refreshUnreadCount()
      // 触发事件通知其他组件刷新好友列表
      window.dispatchEvent(new Event('friendship:updated'))
      // 显示成功提示
      setToastMessage('Friend request accepted!')
      setShowToast(true)
    } catch (error) {
      console.error('Failed to accept friend request:', error)
    }
  }

  // 拒绝好友请求
  const handleRejectFriend = async (notificationId: number, friendshipId: number | undefined) => {
    if (!friendshipId) {
      console.error('Missing friendship_id')
      return
    }
    try {
      await friendshipApi.rejectFriendRequest(friendshipId)
      // 标记通知为已读
      await notificationApi.markAsRead(notificationId)
      refreshUnread()
      refreshUnreadCount()
    } catch (error) {
      console.error('Failed to reject friend request:', error)
    }
  }

  // 处理toast自动关闭
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [showToast])

  // 标记所有为已读
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      refreshUnread()
      refreshUnreadCount()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  return (
    <Dropdown className="notification-bell" show={showNotifications} onToggle={setShowNotifications}>
      <Dropdown.Toggle variant="link" className="notification-toggle" id="notification-dropdown">
        <i className="bi bi-bell me-2"></i>
        {unreadCount > 0 && <Badge bg="danger" className="notification-badge">{unreadCount}</Badge>}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-menu">
        <div className="notification-header">
          <h6 className="mb-0">Notifications ({unreadCount})</h6>
          {unreadCount > 0 && (
            <small
              className="text-muted cursor-pointer"
              onClick={handleMarkAllAsRead}
              style={{ cursor: 'pointer' }}
            >
              Mark all as read
            </small>
          )}
        </div>

        <Dropdown.Divider />

        {unreadLoading ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
          </div>
        ) : unreadNotifications.length === 0 ? (
          <Alert variant="info" className="mb-0 mx-2 mt-2">
            No message
          </Alert>
        ) : (
          <div className="notification-list">
            {unreadNotifications.map((notification: Notification) => (
              <div key={notification.id} className="notification-item">
                <div className="notification-content">
                  <div className="notification-title">
                    {notification.from_user && (
                      <strong
                        style={{ cursor: 'pointer', color: '#667eea' }}
                        onClick={() => {
                          if (notification.from_user?.id) {
                            navigate(`/user/profile/${notification.from_user.id}`)
                            setShowNotifications(false)
                          }
                        }}
                        title="View user profile"
                      >
                        {notification.from_user.username}
                      </strong>
                    )}
                    <span className="notification-type ms-2">
                      {notification.notification_type === 'reply' && 'replied to you'}
                      {notification.notification_type === 'friend_request' && 'sent a friend request'}
                      {notification.notification_type === 'mention' && 'mentioned you'}
                    </span>
                  </div>
                  <div className="notification-text">{notification.comment_content || notification.content}</div>
                  <small className="text-muted">{formatDate(notification.created_at)}</small>
                </div>

                {/* 根据通知类型显示不同的操作按钮 */}
                {notification.notification_type === 'friend_request' ? (
                  <div className="notification-actions">
                    <button
                      type="button"
                      className="notification-action-btn accept-btn"
                      onClick={() => handleAcceptFriend(notification.id, notification.friendship_id)}
                      title="Accept"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="notification-action-btn reject-btn"
                      onClick={() => handleRejectFriend(notification.id, notification.friendship_id)}
                      title="Reject"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="notification-action"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Dropdown.Menu>

      {/* 成功提示气泡 */}
      {showToast && (
        <div style={{ 
          position: 'fixed', 
          top: '100px', 
          left: '50%', 
          marginLeft: '-150px',
          zIndex: 10000,
          backgroundColor: '#efe', 
          border: '1px solid #cfc',
          color: '#3c3',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          animation: 'slideDown 0.3s ease',
          minWidth: '300px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <i className="bi bi-check-circle me-2"></i>
          {toastMessage}
        </div>
      )}
    </Dropdown>
  )
}
