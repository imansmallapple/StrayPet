import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
import json

User = get_user_model()
testuser = User.objects.get(username='testuser')
token = AccessToken.for_user(testuser)

print("=" * 60)
print("诊断：用户设置 token 后的行为")
print("=" * 60)

client = Client()

# 模拟用户设置了 token 后的请求
print("\n用 Authorization 头请求 /user/notifications/:")
response = client.get(
    '/user/notifications/',
    HTTP_AUTHORIZATION=f'Bearer {str(token)}'
)

print(f"状态码: {response.status_code}")
print(f"响应: {response.content.decode()[:500]}")

# 也检查看 OPTIONS 请求
print("\n\nOPTIONS 预检请求:")
response = client.options('/user/notifications/')
print(f"状态码: {response.status_code}")
print(f"响应: {response.content.decode()[:200]}")
