# 我的消息功能重新实现总结

## 概述

已成功重新实现了 MessageCenter 中"我的消息"功能，现在用户可以查看系统通知。

## 实现详情

### 前端更改

#### 1. **更新 MessageCenter.tsx**

- **位置**: `frontend/src/views/user/profile/MessageCenter.tsx`
- **更改内容**:
  - 添加了对 `userApi.getNotifications()` 的调用
  - "我的消息"标签现在显示实际的通知列表
  - 每个通知卡片显示:
    - 发送者名称
    - 通知标题
    - 通知内容
    - 发送时间（格式化的相对时间）
    - 已读/未读状态（通过"新"badge 显示）
    - 标记为已读的按钮

#### 2. **更新 userApi 模块**

- **位置**: `frontend/src/services/modules/user.ts`
- **新增方法**:

  ```typescript
  // 获取通知列表（分页）
  getNotifications: (page = 1, pageSize = 10) =>
    http.get<PaginatedResponse<Notification>>('/user/notifications/', ...)

  // 获取未读通知数
  getUnreadCount: () => http.get<{ unread_count: number }>('/user/notifications/unread_count/', ...)

  // 获取所有未读通知
  getUnreadNotifications: () => http.get<Notification[]>('/user/notifications/unread/', ...)

  // 标记单个通知为已读
  markAsRead: (notificationId: number) =>
    http.post(`/user/notifications/${notificationId}/mark_as_read/`, {})

  // 标记所有通知为已读
  markAllAsRead: () => http.post('/user/notifications/mark_all_as_read/', {})

  // 删除通知
  deleteNotification: (notificationId: number) =>
    http.delete(`/user/notifications/${notificationId}/`)
  ```

### 后端更改

#### 1. **更新 NotificationsListView**

- **位置**: `backend/apps/user/views.py`
- **关键改动**:
  - 设置了正确的认证类：`authentication_classes = [JWTAuthentication]`
  - 设置了正确的权限类：`permission_classes = [permissions.IsAuthenticated]`
  - 实现了分页功能（使用 Django 的 Paginator）
  - 返回标准的 DRF 分页响应格式：`{count, next, previous, results}`

#### 2. **API 端点**

- **路由**: `/user/notifications/`
- **方法**: GET
- **认证**: JWT Token (需要在 Authorization header 中提供)
- **权限**: 仅限已认证用户
- **响应格式**:
  ```json
  {
    "count": 10,
    "next": "?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "notification_type": "reply",
        "title": "有人回复了你",
        "content": "这是一个很好的想法...",
        "from_user": {
          "id": 5,
          "username": "john_doe",
          "avatar": "..."
        },
        "is_read": false,
        "created_at": "2024-12-29T10:30:00Z",
        "read_at": null
      }
    ]
  }
  ```

## 功能特性

### 用户界面

1. **通知列表显示**:

   - 加载动画（加载中时）
   - 空状态提示（无通知时）
   - 错误提示（加载失败时）

2. **通知卡片**:

   - 显示发送者信息
   - 显示通知标题和内容
   - 显示发送时间（相对时间格式）
   - 未读标签（蓝色 badge）
   - 标记为已读按钮

3. **交互功能**:
   - 点击"标记已读"按钮后，立即更新 UI
   - 支持在两个标签页之间切换（回复/消息）

### API 功能

1. **获取通知列表**:

   - 支持分页（`page` 和 `page_size` 参数）
   - 返回当前用户的所有通知（按创建时间倒序）

2. **标记已读**:

   - 支持标记单个通知为已读
   - 支持批量标记所有通知为已读

3. **获取统计**:

   - 获取未读通知数
   - 获取所有未读通知列表

4. **删除通知**:
   - 支持删除单个通知

## 测试步骤

### 前置条件

1. 确保后端运行：`python manage.py runserver`
2. 确保前端开发服务器运行：`pnpm dev`
3. 确保已登录（有有效的 JWT token）

### 测试流程

1. **访问消息中心**:

   - 打开用户资料页面
   - 点击"我的消息"标签页

2. **查看通知列表**:

   - 如果有通知，应该看到通知列表
   - 如果没有通知，应该看到"暂无消息"提示

3. **标记已读**:

   - 未读通知应该显示"新"badge
   - 点击"标记已读"按钮
   - Badge 应该消失，按钮应该隐藏

4. **处理错误**:
   - 如果没有认证，应该看到"请重新登录"错误
   - 如果 token 过期，应该看到"请重新登录"错误

## 依赖关系

### 前端

- React Bootstrap (Spinner, Alert, Tabs, Tab)
- Axios (http client)
- TypeScript

### 后端

- Django REST Framework
- djangorestframework-simplejwt
- Django Paginator

## 已知限制与未来改进

### 当前限制

1. 通知创建由其他模块负责（需要在适当的地方创建 Notification 记录）
2. 暂不支持通知类别筛选
3. 暂不支持通知搜索

### 建议的改进

1. 添加通知类别筛选（系统、回复、提及等）
2. 添加通知搜索功能
3. 添加实时通知推送（WebSocket）
4. 添加邮件通知选项
5. 添加通知声音/桌面提醒

## 常见问题

### Q: 为什么看不到通知？

**A**: 可能的原因：

- 没有创建过通知记录
- JWT token 过期或无效
- 未正确认证

### Q: 如何创建测试通知？

**A**: 可以通过 Django admin 或编写一个测试脚本来创建通知：

```python
from django.contrib.auth import get_user_model
from apps.user.models import Notification

User = get_user_model()
user = User.objects.first()
Notification.objects.create(
    user=user,
    notification_type='system',
    title='测试通知',
    content='这是一个测试通知'
)
```

### Q: 如何批量标记所有通知为已读？

**A**: 在前端调用：

```typescript
await userApi.markAllAsRead();
```

## 相关文件列表

### 前端

- `frontend/src/views/user/profile/MessageCenter.tsx` - 消息中心组件
- `frontend/src/services/modules/user.ts` - 用户 API 服务

### 后端

- `backend/apps/user/views.py` - NotificationsListView
- `backend/apps/user/urls.py` - URL 路由配置
- `backend/apps/user/models.py` - Notification 模型
- `backend/apps/user/serializer.py` - NotificationSerializer

## 版本历史

### v1.0 (2024-12-29)

- 初始实现
- 支持获取通知列表
- 支持标记为已读
- 支持分页
- 实现了完整的前后端集成
