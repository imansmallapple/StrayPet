# 我的消息功能 - 快速参考指南

## 🎯 功能描述

"我的消息"是消息中心的第二个标签，显示系统发送给用户的各种通知，包括：

- 系统通知
- 有人提到你
- 其他应用通知

## 📍 文件位置

### 前端

```
frontend/src/views/user/profile/MessageCenter.tsx    # 主要组件
frontend/src/services/modules/user.ts                # API 服务
```

### 后端

```
backend/apps/user/views.py                           # NotificationsListView
backend/apps/user/urls.py                            # 路由配置
backend/apps/user/models.py                          # Notification 模型
backend/apps/user/serializer.py                      # 序列化器
```

## 🔧 核心 API

### 前端调用

```typescript
// 获取通知列表
const { data } = await userApi.getNotifications(page, pageSize);
// 返回: { count, next, previous, results: [...] }

// 标记为已读
await userApi.markAsRead(notificationId);

// 标记全部为已读
await userApi.markAllAsRead();

// 获取未读计数
const { data } = await userApi.getUnreadCount();
// 返回: { unread_count: 5 }
```

### 后端 API

```
GET /user/notifications/?page=1&page_size=10
```

认证: JWT Token
响应:

```json
{
  "count": 10,
  "next": "?page=2",
  "previous": null,
  "results": [...]
}
```

## 🎨 UI 组件

### MessageCenter 组件结构

```
<MessageCenter>
  ├── <Tabs>
  │   ├── <Tab eventKey="replies"> "回复我的"
  │   └── <Tab eventKey="notifications"> "我的消息"
  │       ├── 加载状态: Spinner
  │       ├── 错误状态: Alert
  │       ├── 空状态: 暂无消息
  │       └── 通知列表
  │           └── NotificationCard (重复)
  │               ├── 发送者
  │               ├── 标题
  │               ├── 内容
  │               ├── 时间
  │               ├── 新 Badge
  │               └── 标记已读按钮
```

## 📊 数据流

```
用户打开消息中心
    ↓
选择"我的消息"标签
    ↓
触发 useEffect，调用 userApi.getNotifications()
    ↓
后端 NotificationsListView.get() 处理请求
    ↓
查询数据库获取当前用户的通知
    ↓
返回分页数据
    ↓
前端格式化数据并渲染通知卡片
    ↓
用户看到通知列表

用户点击"标记已读"
    ↓
调用 userApi.markAsRead(id)
    ↓
后端更新通知的 is_read 字段
    ↓
前端更新 UI（移除 Badge，隐藏按钮）
```

## 🔐 认证和权限

```python
# 认证方式
authentication_classes = [JWTAuthentication]

# 权限要求
permission_classes = [permissions.IsAuthenticated]

# 数据过滤
只返回当前用户 (request.user) 的通知
```

## 📈 性能优化

| 优化项   | 当前状态            | 建议                   |
| -------- | ------------------- | ---------------------- |
| 分页     | ✅ 实现             | -                      |
| 缓存     | ❌ 未实现           | 考虑缓存未读计数       |
| 批量操作 | ✅ mark_all_as_read | -                      |
| 懒加载   | ❌ 未实现           | 如果通知很多，考虑实现 |
| 搜索     | ❌ 未实现           | 将来可添加             |

## 🧪 测试命令

```bash
# 查看现有通知
python backend/test_notifications_api.py list

# 创建测试通知
python backend/test_notifications_api.py create

# 测试 API 端点（使用 curl）
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/user/notifications/
```

## 🐛 常见问题

| 问题     | 原因         | 解决方案                |
| -------- | ------------ | ----------------------- |
| 404 错误 | 路由未注册   | 检查 urls.py 配置       |
| 401 错误 | 无有效 token | 重新登录                |
| 403 错误 | 权限不足     | 检查 permission_classes |
| 空列表   | 数据库无数据 | 创建测试通知            |
| 加载慢   | 数据库查询慢 | 添加索引或分页          |

## 💡 实现要点

1. **认证**: 必须使用 JWT Token
2. **权限**: 只有已认证用户才能访问
3. **数据隔离**: 每个用户只能看到自己的通知
4. **分页**: 返回分页数据，避免一次性加载所有数据
5. **排序**: 按创建时间倒序显示最新的通知
6. **状态管理**: 前端跟踪 loading 和 error 状态

## 🔄 更新通知列表

要使用户看到最新的通知，可以：

```typescript
// 手动刷新
const refreshNotifications = async () => {
  const { data } = await userApi.getNotifications();
  setMessages(formatMessages(data.results));
};

// 定时刷新（不建议）
// useEffect(() => {
//   const interval = setInterval(refreshNotifications, 5000)
//   return () => clearInterval(interval)
// }, [])

// 实时推送（WebSocket）- 未来改进
```

## 📋 检查清单

部署前确保：

- [ ] 前端无 TypeScript 错误
- [ ] 后端无 Python 语法错误
- [ ] 数据库迁移已运行
- [ ] JWT 认证已配置
- [ ] CORS 已配置
- [ ] Notification 表有数据
- [ ] 后端服务器已启动
- [ ] 可以登录并获得 token

## 🔗 相关资源

- [完整实现指南](./MESSAGE_IMPLEMENTATION_COMPLETE.md)
- [验收清单](./NOTIFICATION_FEATURE_CHECKLIST.md)
- [Django REST Framework 文档](https://www.django-rest-framework.org/)
- [React Bootstrap 文档](https://react-bootstrap.github.io/)

---

**最后更新**: 2024-12-29
**快速参考版本**: v1.0
