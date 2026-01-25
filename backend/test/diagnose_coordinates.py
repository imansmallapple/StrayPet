#!/usr/bin/env python
"""
诊断坐标：检查每个地址的坐标是否与城市实际位置匹配
使用已知的波兰主要城市坐标进行验证
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost, Address
from decimal import Decimal
import math

# 波兰主要城市的真实坐标 (经过验证)
REAL_COORDINATES = {
    'Gdańsk': {'lat': 54.352, 'lng': 18.6466},
    'Gdansk': {'lat': 54.352, 'lng': 18.6466},
    'Warszawa': {'lat': 52.2297, 'lng': 21.0122},
    'Warsaw': {'lat': 52.2297, 'lng': 21.0122},
    'Kraków': {'lat': 50.0647, 'lng': 19.945},
    'Krakow': {'lat': 50.0647, 'lng': 19.945},
    'Wrocław': {'lat': 51.1079, 'lng': 17.0385},
    'Wroclaw': {'lat': 51.1079, 'lng': 17.0385},
    'Poznań': {'lat': 52.4064, 'lng': 16.9252},
    'Poznan': {'lat': 52.4064, 'lng': 16.9252},
    'Łódź': {'lat': 51.7656, 'lng': 19.4557},
    'Lodz': {'lat': 51.7656, 'lng': 19.4557},
    'Szczecin': {'lat': 53.4285, 'lng': 14.5528},
    'Katowice': {'lat': 50.2565, 'lng': 19.0238},
    'Sopot': {'lat': 54.4516, 'lng': 18.5873},
    'Trójmiasto': {'lat': 54.352, 'lng': 18.6466},
}

def distance_between(lat1, lng1, lat2, lng2):
    """计算两点间的距离 (km)"""
    R = 6371
    
    lat1_rad = math.radians(float(lat1))
    lat2_rad = math.radians(float(lat2))
    delta_lat = math.radians(float(lat2 - lat1))
    delta_lng = math.radians(float(lng2 - lng1))
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

print("="*80)
print("🔍 坐标诊断：验证每个失落宠物的坐标与城市位置是否匹配")
print("="*80 + "\n")

lost_pets = Lost.objects.select_related('pet', 'address', 'address__city').all()
print(f"总共检查 {lost_pets.count()} 个失落宠物\n")

suspicious_count = 0
correct_count = 0

for pet in lost_pets:
    addr = pet.address
    if not addr or not addr.latitude or not addr.longitude:
        continue
    
    city_name = addr.city.name if addr.city else addr.city_name or "Unknown"
    pet_name = pet.pet.name if pet.pet else "Unknown"
    db_lat = float(addr.latitude)
    db_lng = float(addr.longitude)
    
    print(f"ID: {pet.id:2d} | 宠物: {pet_name:15s} | 城市: {city_name:15s}")
    print(f"         数据库坐标: lat={db_lat:8.4f}, lng={db_lng:8.4f}")
    
    if city_name in REAL_COORDINATES:
        real_coords = REAL_COORDINATES[city_name]
        real_lat = real_coords['lat']
        real_lng = real_coords['lng']
        
        dist_normal = distance_between(db_lat, db_lng, real_lat, real_lng)
        dist_swapped = distance_between(db_lng, db_lat, real_lat, real_lng)
        
        print(f"         实际城市坐标: lat={real_lat:8.4f}, lng={real_lng:8.4f}")
        print(f"         距离对比: 正常={dist_normal:.2f}km, 交换={dist_swapped:.2f}km")
        
        if dist_normal < 5:
            print(f"         ✅ 坐标正确（与实际城市位置匹配）")
            correct_count += 1
        elif dist_swapped < 5:
            print(f"         🚨 坐标已被交换！应该是: lat={db_lng}, lng={db_lat}")
            suspicious_count += 1
        else:
            print(f"         ⚠️  坐标与城市位置偏离较远，可能需要检查")
    
    print()

print("="*80)
print(f"📊 诊断结果:")
print(f"   ✅ 正确: {correct_count}")
print(f"   🚨 被交换: {suspicious_count}")
print("="*80)

if suspicious_count > 0:
    print("\n⚡ 检测到坐标被交换，现在进行修复...\n")
    
    for pet in lost_pets:
        addr = pet.address
        if not addr or not addr.latitude or not addr.longitude:
            continue
        
        city_name = addr.city.name if addr.city else addr.city_name or "Unknown"
        pet_name = pet.pet.name if pet.pet else "Unknown"
        db_lat = float(addr.latitude)
        db_lng = float(addr.longitude)
        
        if city_name not in REAL_COORDINATES:
            continue
        
        real_coords = REAL_COORDINATES[city_name]
        real_lat = real_coords['lat']
        real_lng = real_coords['lng']
        
        dist_swapped = distance_between(db_lng, db_lat, real_lat, real_lng)
        
        if dist_swapped < 5:
            print(f"修复 ID {pet.id} ({pet_name}) @ {city_name}:")
            print(f"  修改前: lat={db_lat}, lng={db_lng}")
            
            addr.latitude = Decimal(str(db_lng))
            addr.longitude = Decimal(str(db_lat))
            addr.save()
            
            print(f"  修改后: lat={db_lng}, lng={db_lat}")
            print(f"  ✅ 已保存\n")
