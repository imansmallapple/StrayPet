#!/usr/bin/env python
"""
使用 Django TestCase 测试通知 API
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.test import Client
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User

# 创建客户端
client = Client()

# 获取 testuser 并生成 token
user = User.objects.get(username='testuser')
token = AccessToken.for_user(user)
token_str = str(token)

print(f"👤 用户: {user.username} (ID={user.id})")
print(f"🔑 Token: {token_str[:50]}...")
print()

# 测试 API
url = '/user/notifications/'
headers = {'HTTP_AUTHORIZATION': f'Bearer {token_str}'}

print(f"📍 测试 URL: {url}")
print(f"🔐 使用 Authorization header")
print()

response = client.get(url, **headers)

print(f"📊 状态码: {response.status_code}")
print(f"📄 Content-Type: {response.get('Content-Type', 'unknown')}")

if response.status_code == 200:
    print(f"✅ API 工作正常")
    import json
    try:
        data = json.loads(response.content)
        print(f"📦 数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
    except:
        print(f"📋 响应: {response.content}")
else:
    print(f"❌ 错误代码: {response.status_code}")
    print(f"📋 响应: {response.content.decode('utf-8')}")
