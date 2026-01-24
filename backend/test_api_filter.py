#!/usr/bin/env python
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.test import Client

print("=" * 80)
print("🔍 测试 API 端点城市过滤")
print("=" * 80)

client = Client()

# 测试 API
print("\n测试 GET /pet/?city=wr")
response = client.get('/pet/?city=wr')
print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.get('content-type')}")

if response.status_code == 200:
    data = response.json()
    print(f"结果数量: {len(data.get('results', []))}")
    for pet in data.get('results', []):
        print(f"  - {pet['name']} (city: {pet.get('city', 'N/A')})")
else:
    print(f"错误: {response.content}")

print("\n测试 GET /pet/?city=Wroclaw")
response = client.get('/pet/?city=Wroclaw')
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"结果数量: {len(data.get('results', []))}")
    for pet in data.get('results', []):
        print(f"  - {pet['name']} (city: {pet.get('city', 'N/A')})")
else:
    print(f"错误: {response.content}")

print("\n" + "=" * 80)
