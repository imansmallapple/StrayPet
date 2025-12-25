# Message Center Quick Start Guide

## 🎯 What's New

A complete message/notification center has been implemented for the strayPet platform. Users can now receive, view, and manage notifications for:

- **回复我的** (Replies to my comments)
- **@我的** (Mentions in comments)
- **系统通知** (System notifications)

---

## 🚀 Access the Feature

### Local Development

```
Frontend URL: http://localhost:5174/messages
Backend API: http://localhost:8000/api/user/notifications/
```

### What You'll See

- Clean, modern message center interface
- Three notification tabs with icons
- Message count badges showing unread notifications
- Individual message cards with sender info and timestamp
- Buttons to mark as read or delete messages

---

## 📝 How to Use

### Viewing Messages

1. Navigate to `/messages` in your browser
2. Click any tab: **Replies**, **Mentions**, or **System**
3. Messages load automatically (you'll see a spinner while loading)
4. Each message shows:
   - Who sent it
   - What type of notification
   - When it was sent
   - The message content

### Managing Messages

- **Mark as Read**: Click "标记已读" button (removes blue highlight)
- **Delete**: Click "删除" button to remove message
- **Tab Switching**: Click tab buttons to filter by type

### Empty State

When there are no notifications for a tab, you'll see:

```
[Empty icon]
暂无消息
(No messages)
```

---

## 🔧 Current Status

### ✅ What's Ready

- Frontend component (fully styled and functional)
- Backend API endpoints (secure with JWT auth)
- Router integration (accessible at `/messages`)
- Full TypeScript type safety
- Error handling and loading states
- Responsive mobile design

### ⏳ Next Phase

Notifications will be created when:

1. Users write comments on blog articles
2. Other users reply to those comments
3. Users are mentioned (@username) in comments
4. System generates system notifications

For now, you can test by:

1. Creating test data via Django admin
2. Or writing code to generate test notifications

---

## 🧪 Creating Test Data

### Via Django Admin

1. Go to `http://localhost:8080` (Adminer)
2. Create User accounts (or use existing ones)
3. Create Notification records with:
   - user: The recipient user
   - notification_type: Choose 'reply', 'mention', or 'system'
   - from_user: Who sent the notification
   - title: "Someone replied to your comment"
   - content: "Great article!"
   - is_read: false

### Via Docker Shell

```bash
docker-compose exec web python manage.py shell
# Then create notifications using Django ORM
```

### Test Notification Example

```python
from django.contrib.auth import get_user_model
from apps.user.models import Notification

User = get_user_model()

# Get two users
sender = User.objects.get(username='john')
recipient = User.objects.get(username='jane')

# Create a test notification
Notification.objects.create(
    user=recipient,
    from_user=sender,
    notification_type='reply',
    title='Someone replied to your comment',
    content='I totally agree! Great point.',
    is_read=False
)
```

After creating test data, refresh the message center page and you should see notifications appear!

---

## 🔐 Security Notes

- All API endpoints require JWT authentication
- Users only see their own notifications
- Notifications are filtered server-side
- Delete and mark-as-read require proper authentication

---

## 📱 Responsive Design

The message center works on:

- **Desktop**: Two-column layout (sidebar + content)
- **Tablet**: Responsive column sizing
- **Mobile**: Single column, stacked layout

---

## 🐛 Troubleshooting

### Messages not loading?

1. Make sure you're logged in (JWT token valid)
2. Check browser console for errors
3. Verify backend is running: `http://localhost:8000/api/user/notifications/`

### Backend API returns 401?

- You're not authenticated
- Log in first, then try again

### Backend API returns 404?

- The endpoint might not be registered
- Check that migrations are applied
- Run: `docker-compose exec web python manage.py migrate`

### Frontend page blank/error?

1. Check browser console (F12)
2. Verify Vite dev server is running
3. Try refreshing the page
4. Check network tab for API errors

---

## 📚 Documentation

Three detailed documentation files have been created:

1. **MESSAGE_CENTER_IMPLEMENTATION.md**

   - Technical architecture
   - API endpoint specifications
   - Database schema
   - Code organization

2. **MESSAGE_CENTER_VERIFICATION.md**

   - Complete feature checklist
   - Testing procedures
   - Configuration verification
   - Deployment readiness

3. **MESSAGE_CENTER_COMPLETE.md**
   - High-level overview
   - Feature summary
   - Implementation status
   - Next steps

---

## 🎨 Component Structure

```
Messages (Main Component)
├── Left Sidebar
│   ├── Nav Links (Replies, Mentions, System)
│   └── Unread Badges
├── Right Content
│   ├── Loading Spinner (while loading)
│   ├── Error Alert (if error)
│   ├── Empty State (if no messages)
│   └── Message Cards
│       ├── Message Header (From user, Type, Time)
│       ├── Message Content
│       ├── Related Article (if applicable)
│       └── Action Buttons (Mark Read, Delete)
```

---

## 🔗 Related Files

- **Frontend Component**: `frontend/src/views/messages/index.tsx`
- **Styling**: `frontend/src/views/messages/index.scss`
- **API Methods**: `frontend/src/services/modules/auth.ts`
- **Router Config**: `frontend/src/router/index.tsx`
- **Backend ViewSet**: `backend/apps/user/views.py`
- **Model**: `backend/apps/user/models.py`

---

## 📖 API Endpoints Reference

### Get Notifications

```
GET /api/user/notifications/?notification_type=reply&page=1
```

### Mark as Read

```
POST /api/user/notifications/{id}/mark_as_read/
```

### Delete Notification

```
DELETE /api/user/notifications/{id}/
```

### Get Unread Count

```
GET /api/user/notifications/unread_count/
```

All endpoints require `Authorization: Bearer {JWT_TOKEN}`

---

## 🎉 You're All Set!

The message center is fully implemented and ready to use. Visit `/messages` to see it in action!

For any issues or questions, refer to the detailed documentation files or check the component source code.

**Happy messaging! 📬**
