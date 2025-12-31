## 消息中心功能实现 - 私信消息显示

### 问题描述

消息中心的"我的消息"标签应该显示和其他用户的通信消息（私信），但之前错误地配置为显示系统通知。

### 解决方案

#### 1. 后端已有的功能

- ✅ `PrivateMessageViewSet` 已存在于 `apps/user/views.py`
- ✅ 路由已注册：`user_router.register('messages', views.PrivateMessageViewSet, basename='message')`
- ✅ API 端点: `GET /user/messages/` - 获取当前用户的所有私信（发送和接收）

#### 2. 前端修改

**文件: `frontend/src/services/modules/user.ts`**

- 添加 `PrivateMessage` 接口定义
  ```typescript
  export interface PrivateMessage {
    id: number;
    sender: UserProfile;
    recipient: UserProfile;
    content: string;
    is_read: boolean;
    created_at: string;
  }
  ```
- 添加私消息 API 方法：
  - `getPrivateMessages(page, pageSize)` - 获取私信列表
  - `sendPrivateMessage(recipientId, content)` - 发送私信
  - `deletePrivateMessage(messageId)` - 删除私信

**文件: `frontend/src/views/user/profile/MessageCenter.tsx`**

- 修改消息类型从 `'replies' | 'notifications'` 改为 `'replies' | 'messages'`
- 修改"我的消息"标签的数据加载逻辑：
  - 从 `userApi.getNotifications()` 改为 `userApi.getPrivateMessages()`
  - 正确映射私信数据：使用 `item.sender` 作为 `from_user`
- Tab eventKey 从 `'notifications'` 改为 `'messages'`
- 优化 UI 显示：
  - 使用更合适的图标 (`bi-chat-dots` 而不是 `bi-bell`)
  - 简化私信卡片 UI，移除不必要的字段
  - 添加"回复"按钮（TODO 实现回复功能）

### 功能流程

```
用户点击"我的消息"标签
    ↓
调用 userApi.getPrivateMessages(1, 50)
    ↓
后端 PrivateMessageViewSet 返回当前用户的所有私信
（包括发送的和接收的，按创建时间降序排列）
    ↓
前端格式化并显示私信列表
    ↓
用户可以查看私信内容、回复或删除
```

### 后续待实现

1. 点击"回复"按钮后，打开私信回复对话框
2. 添加标记已读功能（需要后端支持）
3. 支持搜索和过滤私信
4. 实现私信的实时更新（使用 WebSocket 或定时轮询）
5. 显示私信对方的头像

### 测试步骤

1. 登录用户账户
2. 导航到用户档案 > 消息中心
3. 点击"我的消息"标签
4. 应该看到和其他用户的私信列表
5. 点击"回复"按钮（当实现后）
