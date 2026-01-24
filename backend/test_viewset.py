#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.test import RequestFactory
from apps.pet.views import PetViewSet
from apps.pet.models import Pet

# 创建一个模拟请求
factory = RequestFactory()
request = factory.get('/api/pets/?page=1')

# 创建 ViewSet 实例
viewset = PetViewSet()
viewset.request = request
viewset.format_kwarg = None
viewset.action = 'list'

# 获取 queryset
qs = viewset.get_queryset().filter(status__in=['available', 'pending'])
print(f"查询集中有 {qs.count()} 个宠物")

# 获取前两个宠物
pets = qs[:2]
for pet in pets:
    serializer = viewset.get_serializer(pet)
    data = serializer.data
    print(f"\n宠物: {data.get('name')}")
    print(f"  size: '{data.get('size')}'")
    print(f"  sex: {data.get('sex')}")
    print(f"  age_years: {data.get('age_years')}")
    print(f"  age_months: {data.get('age_months')}")
