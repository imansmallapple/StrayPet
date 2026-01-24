#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User

# 创建测试客户端
client = Client()

# 发送 API 请求
response = client.get('/pet/?page=1&page_size=2')
print(f"状态码: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"\n返回的数据:")
    print(json.dumps(data, indent=2, default=str)[:2000])  # 前 2000 字符
    
    if data.get('results'):
        pet = data['results'][0]
        print(f"\n第一个宠物的关键字段:")
        print(f"  name: {pet.get('name')}")
        print(f"  size: {repr(pet.get('size'))}")
        print(f"  sex: {pet.get('sex')}")
        print(f"  age_years: {pet.get('age_years')}")
else:
    print(f"错误: {response.content}")
