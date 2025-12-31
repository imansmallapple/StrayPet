#!/usr/bin/env python
import os
import sys
import django
import requests
import time

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User

# 生成全新 token
user = User.objects.get(username='testuser')
token = AccessToken.for_user(user)
token_str = str(token)

print(f"🆕 生成新 token")
print(f"👤 用户: {user.username}")
print(f"🔑 Token: {token_str[:50]}...")
print()

# 立即测试（没有延迟）
print(f"测试 API...")
try:
    response = requests.get(
        'http://127.0.0.1:8000/user/notifications/',
        headers={'Authorization': f'Bearer {token_str}'},
        timeout=5
    )
    
    print(f"📊 状态码: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ 成功！")
        data = response.json()
        print(f"数据: count={data.get('count')}")
    else:
        print(f"❌ 失败")
        print(f"错误: {response.json()}")
except Exception as e:
    print(f"❌ 异常: {e}")
