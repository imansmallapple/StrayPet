#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet
from apps.pet.serializers import PetListSerializer

# 获取第一个宠物
pet = Pet.objects.first()
if pet:
    serializer = PetListSerializer(pet)
    data = serializer.data
    print("API 返回的宠物数据（关键字段）:")
    print(f"  id: {data.get('id')}")
    print(f"  name: {data.get('name')}")
    print(f"  species: {data.get('species')}")
    print(f"  sex: {data.get('sex')}")
    print(f"  size: {data.get('size')}")
    print(f"  age_years: {data.get('age_years')}")
    print(f"  age_months: {data.get('age_months')}")
    print(f"  city: {data.get('city')}")
    print(f"\n完整数据:")
    print(json.dumps(data, indent=2, default=str))
else:
    print("No pets found")
