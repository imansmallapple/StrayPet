#!/usr/bin/env python
import os
import sys
import django
import requests

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User

user = User.objects.get(username='testuser')
token = AccessToken.for_user(user)

print(f"新生成的 token: {str(token)[:50]}...")

# 测试 API
response = requests.get(
    'http://localhost:8000/user/notifications/',
    headers={'Authorization': f'Bearer {str(token)}'}
)

print(f"\n状态码: {response.status_code}")
if response.status_code == 200:
    print(f"✅ API 工作正常")
    print(f"响应: {response.json()}")
else:
    print(f"❌ 错误: {response.text}")
