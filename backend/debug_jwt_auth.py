#!/usr/bin/env python
"""
调试 JWT 认证问题
"""
import os
import sys
import django
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import User

# 生成 token
user = User.objects.get(username='testuser')
token = AccessToken.for_user(user)
token_str = str(token)

print(f"👤 用户: {user.username} (ID={user.id})")
print(f"🔑 生成的 Token: {token_str[:50]}...")
print(f"📋 Token 载荷: {token}")
print()

# 创建模拟请求
factory = APIRequestFactory()
request = factory.get('/user/notifications/', HTTP_AUTHORIZATION=f'Bearer {token_str}')
drf_request = Request(request)

# 尝试认证
auth = JWTAuthentication()
try:
    result = auth.authenticate(drf_request)
    if result:
        user_auth, token_auth = result
        print(f"✅ 认证成功!")
        print(f"   用户: {user_auth}")
        print(f"   Token: {token_auth}")
    else:
        print(f"⚠️  认证返回 None")
except Exception as e:
    print(f"❌ 认证失败: {e}")
    import traceback
    traceback.print_exc()
