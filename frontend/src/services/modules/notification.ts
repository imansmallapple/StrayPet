import http from '@/services/http'

export type Notification = {
  id: number
  notification_type: 'reply' | 'mention' | 'system'
  title: string
  content: string
  from_user?: {
    id: number
    username: string
  }
  comment_content?: string
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
