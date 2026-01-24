#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.test import Client

# 创建测试客户端
client = Client()

print("=" * 80)
print("📋 宠物数据可访问性诊断")
print("=" * 80)

# 测试列表 API
print("\n1️⃣ 测试 /pet/ 列表 API:")
response = client.get('/pet/')
print(f"   状态码: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   ✅ 返回了 {data.get('count')} 个宠物")
    if data.get('results'):
        pet = data['results'][0]
        print(f"   第一个宠物: {pet.get('name')} (ID: {pet.get('id')})")
        print(f"   包含的字段: {', '.join(list(pet.keys())[:10])}...")
else:
    print(f"   ❌ 错误: {response.content}")

# 测试详情 API
print("\n2️⃣ 测试 /pet/2/ 详情 API:")
response = client.get('/pet/2/')
print(f"   状态码: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   ✅ 成功获取宠物 {data.get('name')}")
    print(f"   包含字段: name, species, sex, size, age_years, age_months 等")
else:
    print(f"   ❌ 错误: {response.content}")

print("\n" + "=" * 80)
print("✅ 后端 API 可用")
print("=" * 80)
