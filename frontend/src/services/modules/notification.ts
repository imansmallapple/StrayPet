import http from '@/services/http'

export type Notification = {
  id: number
  notification_type: 'reply' | 'mention' | 'friend_request' | 'system'
  title: string
  content: string
  from_user?: {
    id: number
    username: string
  }
  comment_content?: string
  friendship_id?: number
  is_read: boolean
  created_at: string
  read_at?: string
}

export const notificationApi = {
  // 获取所有通知
  getNotifications: (page = 1, pageSize = 20) =>
    http.get('/user/notifications/', { params: { page, page_size: pageSize } }),

  // 获取未读通知数
  getUnreadCount: () =>
    http.get('/user/notifications/unread_count/'),

  // 获取所有未读通知
  getUnread: () =>
    http.get('/user/notifications/unread/'),

  // 标记单个通知为已读
  markAsRead: (notificationId: number) =>
    http.post(`/user/notifications/${notificationId}/mark_as_read/`),

  // 标记所有通知为已读
  markAllAsRead: () =>
    http.post('/user/notifications/mark_all_as_read/'),

  // 删除通知
  deleteNotification: (notificationId: number) =>
    http.delete(`/user/notifications/${notificationId}/`),
}

// 好友关系相关 API
export const friendshipApi = {
  // 接受好友请求
  acceptFriendRequest: (friendshipId: number) =>
    http.post(`/user/friendships/${friendshipId}/accept/`),

  // 拒绝好友请求
  rejectFriendRequest: (friendshipId: number) =>
    http.post(`/user/friendships/${friendshipId}/reject/`),
}
