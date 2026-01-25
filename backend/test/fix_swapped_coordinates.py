#!/usr/bin/env python
"""
修复数据库中所有被交换的坐标
经过详细诊断后自动修复
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost, Address
from decimal import Decimal
import json

print("="*80)
print("🔧 坐标修复工具：自动检测并修复被交换的纬度经度")
print("="*80 + "\n")

# Lost pets with known correct cities and their coordinates
REFERENCE_COORDS = {
    'Gdańsk': (54.352, 18.6466),
    'Warszawa': (52.2297, 21.0122),
    'Kraków': (50.0647, 19.945),
    'Wrocław': (51.1079, 17.0385),
    'Poznań': (52.4064, 16.9252),
    'Łódź': (51.7656, 19.4557),
    'Szczecin': (53.4285, 14.5528),
    'Katowice': (50.2565, 19.0238),
    'Sopot': (54.4516, 18.5873),
}

def coords_almost_equal(coord1, coord2, tolerance=0.01):
    """检查两个坐标对是否基本相等"""
    lat1, lng1 = coord1
    lat2, lng2 = coord2
    return abs(float(lat1) - float(lat2)) < tolerance and abs(float(lng1) - float(lng2)) < tolerance

lost_pets = Lost.objects.select_related('pet', 'address', 'address__city').all()
print(f"检查 {lost_pets.count()} 个失落宠物...\n")

needs_fix = []

for pet in lost_pets:
    if not pet.address or not pet.address.city:
        continue
    
    city_name = pet.address.city.name
    if city_name not in REFERENCE_COORDS:
        continue
    
    pet_name = pet.pet.name if pet.pet else "Unknown"
    db_lat = float(pet.address.latitude)
    db_lng = float(pet.address.longitude)
    correct_lat, correct_lng = REFERENCE_COORDS[city_name]
    
    # Check if coordinates match
    if coords_almost_equal((db_lat, db_lng), (correct_lat, correct_lng)):
        print(f"✅ {pet_name:20s} @ {city_name:15s}: 坐标正确 (lat={db_lat:.4f}, lng={db_lng:.4f})")
    # Check if coordinates are swapped
    elif coords_almost_equal((db_lng, db_lat), (correct_lat, correct_lng)):
        print(f"❌ {pet_name:20s} @ {city_name:15s}: 坐标已交换！")
        print(f"   数据库: lat={db_lat:.4f}, lng={db_lng:.4f}")
        print(f"   正确的: lat={correct_lat:.4f}, lng={correct_lng:.4f}")
        needs_fix.append({
            'pet_id': pet.id,
            'pet_name': pet_name,
            'city': city_name,
            'address_id': pet.address.id,
            'current': (db_lat, db_lng),
            'correct': (correct_lat, correct_lng),
            'swapped_version': (db_lng, db_lat)
        })
    else:
        print(f"⚠️  {pet_name:20s} @ {city_name:15s}: 坐标不匹配")
        print(f"   数据库: lat={db_lat:.4f}, lng={db_lng:.4f}")
        print(f"   应该是: lat={correct_lat:.4f}, lng={correct_lng:.4f}")

print("\n" + "="*80)
if needs_fix:
    print(f"🚨 发现 {len(needs_fix)} 个被交换的坐标需要修复！\n")
    
    for item in needs_fix:
        print(f"修复 {item['pet_name']} (ID: {item['pet_id']}):")
        print(f"  地址ID: {item['address_id']}")
        print(f"  城市: {item['city']}")
        print(f"  修改前: lat={item['current'][0]}, lng={item['current'][1]}")
        
        addr = Address.objects.get(id=item['address_id'])
        addr.latitude = Decimal(str(item['swapped_version'][0]))
        addr.longitude = Decimal(str(item['swapped_version'][1]))
        
        # 同时更新location JSON字段（如果存在）
        if addr.location:
            addr.location = {
                "type": "Point",
                "coordinates": [item['swapped_version'][1], item['swapped_version'][0]]
            }
        
        addr.save()
        print(f"  修改后: lat={item['swapped_version'][0]}, lng={item['swapped_version'][1]}")
        print(f"  ✅ 已保存\n")
    
    print("="*80)
    print(f"✨ 所有 {len(needs_fix)} 个坐标已修复！")
else:
    print("✅ 所有坐标都正确，无需修复！")
print("="*80)
