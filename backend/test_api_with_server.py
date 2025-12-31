#!/usr/bin/env python
import os
import sys
import django
import requests
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User

user = User.objects.get(username='testuser')
token = AccessToken.for_user(user)

print(f"⏱️  时间: {datetime.now()}")
print(f"👤 用户: {user.username} (ID={user.id})")
print(f"🔑 Token: {str(token)[:50]}...")

# 等一秒确保服务器启动
import time
time.sleep(1)

# 测试 API
try:
    response = requests.get(
        'http://localhost:8000/user/notifications/',
        headers={'Authorization': f'Bearer {str(token)}'},
        timeout=5
    )
    
    print(f"\n✅ 连接成功")
    print(f"📊 状态码: {response.status_code}")
    print(f"📄 响应类型: {response.headers.get('Content-Type', 'unknown')}")
    
    if response.status_code == 200:
        print(f"✅ API 工作正常")
        data = response.json()
        print(f"📦 返回数据: count={data.get('count')}, results={len(data.get('results', []))} items")
    else:
        print(f"❌ 错误代码: {response.status_code}")
        try:
            error_data = response.json()
            print(f"📋 错误详情: {error_data}")
        except:
            print(f"📋 响应体: {response.text}")
            
except requests.exceptions.ConnectionError as e:
    print(f"❌ 无法连接到服务器: {e}")
    print(f"   确保 Django 开发服务器正在 http://localhost:8000 运行")
except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()
