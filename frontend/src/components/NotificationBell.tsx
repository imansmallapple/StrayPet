import { useState } from 'react'
import { Badge, Dropdown, Alert, Spinner } from 'react-bootstrap'
import { useRequest } from 'ahooks'
import { notificationApi, friendshipApi, type Notification } from '@/services/modules/notification'
import './NotificationBell.scss'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

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

  if (unreadCount === 0) {
    return null
  }

  return (
    <Dropdown className="notification-bell" show={showNotifications} onToggle={setShowNotifications}>
      <Dropdown.Toggle variant="link" className="notification-toggle" id="notification-dropdown">
        <i className="bi bi-bell me-2"></i>
        {unreadCount > 0 && <Badge bg="danger" className="notification-badge">{unreadCount}</Badge>}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-menu">
        <div className="notification-header">
          <h6 className="mb-0">通知 ({unreadCount})</h6>
          {unreadCount > 0 && (
            <small
              className="text-muted cursor-pointer"
              onClick={handleMarkAllAsRead}
              style={{ cursor: 'pointer' }}
            >
              全部标记为已读
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
            暂无未读通知
          </Alert>
        ) : (
          <div className="notification-list">
            {unreadNotifications.map((notification: Notification) => (
              <div key={notification.id} className="notification-item">
                <div className="notification-content">
                  <div className="notification-title">
                    {notification.from_user && (
                      <strong>{notification.from_user.username}</strong>
                    )}
                    <span className="notification-type ms-2">
                      {notification.notification_type === 'reply' && '回复了你'}
                      {notification.notification_type === 'friend_request' && '发送了好友申请'}
                      {notification.notification_type === 'mention' && '提到了你'}
                    </span>
                  </div>
                  <div className="notification-text">{notification.comment_content || notification.content}</div>
                  <small className="text-muted">{notification.created_at}</small>
                </div>

                {/* 根据通知类型显示不同的操作按钮 */}
                {notification.notification_type === 'friend_request' ? (
                  <div className="notification-actions">
                    <button
                      type="button"
                      className="notification-action-btn accept-btn"
                      onClick={() => handleAcceptFriend(notification.id, notification.friendship_id)}
                      title="同意"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="notification-action-btn reject-btn"
                      onClick={() => handleRejectFriend(notification.id, notification.friendship_id)}
                      title="拒绝"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="notification-action"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="标记为已读"
                  >
                    ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}
