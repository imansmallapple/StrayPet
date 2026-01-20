#!/usr/bin/env python
"""
测试 LostSerializer 是否正确处理 address_data
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.serializers import LostSerializer
from django.contrib.auth import get_user_model
import json

User = get_user_model()

# 获取或创建一个用户
user, _ = User.objects.get_or_create(
    username='testuser',
    defaults={'email': 'test@example.com'}
)

# 模拟 FormData 发送的数据 (多部分表单数据)
test_data = {
    'pet_name': 'test_location_dog',
    'species': 'dog',
    'sex': 'male',
    'lost_time': '2026-01-20T14:07:00.000Z',
    'description': 'Test dog',
    'reward': None,
    'photo': None,
    'contact_phone': '',
    'contact_email': '',
    'address_data': json.dumps({
        'country': 'Poland',
        'region': 'Masovian',
        'city': 'Warsaw',
        'street': 'ul. Nowy Swiat',
        'building_number': None,
        'postal_code': '02-231'
    })
}

print("=" * 100)
print("Testing LostSerializer.create() with address_data")
print("=" * 100)
print(f"\nInput data:")
for k, v in test_data.items():
    print(f"  {k}: {v}")

serializer = LostSerializer(data=test_data)

if serializer.is_valid():
    print(f"\n✓ Serializer validation passed")
    print(f"  Validated data keys: {serializer.validated_data.keys()}")
    
    # 创建对象
    lost_obj = serializer.save(reporter=user)
    
    print(f"\n✓ Lost object created: ID={lost_obj.id}")
    print(f"  pet_name: {lost_obj.pet_name}")
    print(f"  address_id: {lost_obj.address_id}")
    
    if lost_obj.address_id:
        print(f"\n✓ Address was successfully created!")
        print(f"  Address ID: {lost_obj.address.id}")
        print(f"  Street: {lost_obj.address.street}")
        print(f"  City: {lost_obj.address.city.name if lost_obj.address.city else None}")
        print(f"  Region: {lost_obj.address.region.name if lost_obj.address.region else None}")
        print(f"  Country: {lost_obj.address.country.name if lost_obj.address.country else None}")
    else:
        print(f"\n✗ Address was NOT created - address_id is NULL")
else:
    print(f"\n✗ Serializer validation failed:")
    print(f"  Errors: {serializer.errors}")
