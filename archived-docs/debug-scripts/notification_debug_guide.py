#!/usr/bin/env python
"""
================================================================================
通知 API 端点诊断和配置指南
================================================================================

🔍 问题分析：
- 前端期望调用多个 notification 相关端点
- 但后端 NotificationViewSet 没有在路由中注册
- 只有 notifications_view（纯 Django View）被注册

📋 当前状态：
✅ 已注册: /user/notifications/  (notifications_view - 纯 Django)
❌ 未注册: NotificationViewSet 及其所有 action（unread_count, unread, mark_as_read 等）

🎯 解决方案：
需要在 urls.py 中注册 NotificationViewSet

================================================================================
"""

import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken

# 为 testuser 生成新 token
from datetime import timedelta
user = User.objects.get(username='testuser')
access_token = AccessToken.for_user(user)
refresh_token = AccessToken.for_user(user)
refresh_token.set_exp(lifetime=timedelta(days=7))  # 7 天有效期

access_str = str(access_token)
refresh_str = str(refresh_token)

print("""
================================================================================
📲 步骤 1: 在浏览器 Console 中设置新 tokens
================================================================================

复制以下命令到浏览器 DevTools Console：
""")

print(f"""localStorage.setItem('accessToken', '{access_str}');
localStorage.setItem('refreshToken', '{refresh_str}');
console.log('✅ Tokens 已设置！');
location.reload();
""")

print("""
================================================================================
📍 步骤 2: 检查实际调用的 API 端点
================================================================================

1. 打开浏览器 DevTools (F12)
2. 点击「Network」标签页
3. 设置 token 后刷新页面
4. 导航到用户档案 > 消息中心 > 「我的消息」标签
5. 在 Network 面板中查找 notifications 相关的请求
6. 记下：
   - 请求 URL
   - 响应状态码
   - 响应头中的 Content-Type
   - 响应体的错误信息

这会帮助我们识别：
- 是否是 /user/notifications/ 被调用
- 是否是 DRF ViewSet（返回 403）还是纯 Django View（返回 JSON）

================================================================================
⚠️ 重要：配置 NotificationViewSet 的下一步
================================================================================

需要在 backend/apps/user/urls.py 中添加以下代码：

    user_router.register('notifications', views.NotificationViewSet, basename='notification')

放在现有的 register() 调用之后，例如：

    user_router.register('register', views.RegisterViewSet, basename='register')
    user_router.register('userinfo', views.UserInfoViewSet, basename='userinfo')
    user_router.register('list', views.UserListViewSet, basename='user-list')
    user_router.register('avatars', views.AvatarViewSet, basename='avatar')
    user_router.register('friendships', views.FriendshipViewSet, basename='friendship')
    user_router.register('messages', views.PrivateMessageViewSet, basename='message')
    user_router.register('notifications', views.NotificationViewSet, basename='notification')  ← 新增此行
    user_router.register('', views.UserOpsViewSet, basename='user')  ← 必须保持在最后

================================================================================
""")
