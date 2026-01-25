#!/usr/bin/env python
"""
直接检查Lost API端点的完整响应
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.test import RequestFactory
from apps.pet import views

# 创建请求工厂
rf = RequestFactory()

# 获取Lost List的第一个记录
request = rf.get('/pet/lost/')
view = views.LostViewSet.as_view({'get': 'list'})
response = view(request)

print("=" * 80)
print("Lost API 列表响应 (前3条):")
print("=" * 80)

if response.status_code == 200:
    try:
        data = response.data
        if isinstance(data, dict) and 'results' in data:
            results = data['results'][:3]
            for item in results:
                print(json.dumps(item, indent=2, default=str))
                print("-" * 80)
    except Exception as e:
        print(f"错误: {e}")
else:
    print(f"状态码: {response.status_code}")
    print(response.data)
