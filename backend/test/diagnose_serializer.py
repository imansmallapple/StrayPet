#!/usr/bin/env python
"""
直接通过Django ORM检查和修复Lost Pet的坐标问题
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.serializers import LostSerializer
from apps.pet.models import Lost, Address
from decimal import Decimal

print("="*80)
print("🔍 通过LostSerializer诊断API返回的坐标")
print("="*80 + "\n")

# 已知的城市正确坐标
CORRECT_COORDS = {
    'Gdańsk': (54.352, 18.6466),
    'Poznań': (52.4064, 16.9252),
    'Wrocław': (51.1079, 17.0385),
    'Kraków': (50.0647, 19.945),
    'Szczecin': (53.4285, 14.5528),
    'Łódź': (51.7656, 19.4557),
    'Katowice': (50.2565, 19.0238),
}

lost_pets = Lost.objects.select_related('pet', 'address', 'address__city').all()[:10]

print(f"检查前10个宠物的序列化数据...\n")

swapped_list = []

for lost in lost_pets:
    # 序列化看看API会返回什么
    serializer = LostSerializer(lost)
    data = serializer.data
    
    pet_name = data.get('pet_name', 'Unknown')
    city_name = data.get('city', 'Unknown')
    api_lat = data.get('latitude')
    api_lng = data.get('longitude')
    
    print(f"ID: {lost.id:2d} | {pet_name:15s} | {city_name:15s}")
    print(f"        API返回: lat={api_lat}, lng={api_lng}")
    
    if city_name in CORRECT_COORDS:
        correct_lat, correct_lng = CORRECT_COORDS[city_name]
        print(f"        正确应该: lat={correct_lat}, lng={correct_lng}")
        
        # 检查是否匹配
        if api_lat is not None and api_lng is not None:
            if abs(float(api_lat) - correct_lat) < 0.01 and abs(float(api_lng) - correct_lng) < 0.01:
                print(f"        ✅ 正确")
            elif abs(float(api_lng) - correct_lat) < 0.01 and abs(float(api_lat) - correct_lng) < 0.01:
                print(f"        ❌ 被交换了! 应该: lat={correct_lng}, lng={correct_lat}")
                swapped_list.append({
                    'id': lost.id,
                    'pet_name': pet_name,
                    'city': city_name,
                    'address_id': lost.address.id,
                    'current_lat': api_lat,
                    'current_lng': api_lng,
                    'correct_lat': correct_lng,
                    'correct_lng': correct_lat,
                })
            else:
                print(f"        ⚠️  坐标不匹配")
    
    print()

print("\n" + "="*80)
if swapped_list:
    print(f"🚨 发现 {len(swapped_list)} 个宠物的坐标被交换了！")
    print("="*80)
    
    for item in swapped_list:
        print(f"\n修复 {item['pet_name']} (ID: {item['id']}) @ {item['city']}:")
        print(f"  当前(错误): lat={item['current_lat']}, lng={item['current_lng']}")
        print(f"  应该改为: lat={item['correct_lat']}, lng={item['correct_lng']}")
        
        addr = Address.objects.get(id=item['address_id'])
        addr.latitude = Decimal(str(item['correct_lat']))
        addr.longitude = Decimal(str(item['correct_lng']))
        
        # 更新location字段
        if addr.location:
            addr.location = {
                "type": "Point",
                "coordinates": [item['correct_lng'], item['correct_lat']]
            }
        
        addr.save()
        print(f"  ✅ 已修复并保存!")
    
    print("\n" + "="*80)
    print(f"✨ 完成! {len(swapped_list)} 个坐标已修复")
else:
    print("✅ 所有检查的宠物坐标都正确!")
print("="*80)
