#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.test import Client

# 创建测试客户端
client = Client()

# 发送 API 请求获取 Luna 的详情（ID=2）
response = client.get('/pet/2/')
print(f"状态码: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"\nLuna 的详情数据:")
    print(f"  name: {data.get('name')}")
    print(f"  size: {repr(data.get('size'))}")
    print(f"  sex: {data.get('sex')}")
    print(f"  age_years: {data.get('age_years')}")
    print(f"  age_months: {data.get('age_months')}")
    
    print(f"\n完整数据（前 100 个字段）:")
    print(json.dumps(data, indent=2, default=str)[:3000])
else:
    print(f"错误: {response.content}")
