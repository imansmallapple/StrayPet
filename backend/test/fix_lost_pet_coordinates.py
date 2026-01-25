#!/usr/bin/env python
"""
修复 lost pet 坐标超出波兰国界的问题
波兰的地理范围：
  - 纬度: 49.00°N ~ 54.84°N
  - 经度: 14.12°E ~ 24.15°E
  
用法:
  python fix_lost_pet_coordinates.py                    # 检查并修复 lost pet 坐标
  python fix_lost_pet_coordinates.py --check-all        # 检查所有地址坐标
  python fix_lost_pet_coordinates.py --fix-all          # 修复所有超出范围的坐标
"""
import os
import sys
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost, Address
from django.db.models import Q

# 波兰的地理边界（WGS84）
POLAND_LAT_MIN = Decimal('49.00')
POLAND_LAT_MAX = Decimal('54.84')
POLAND_LNG_MIN = Decimal('14.12')
POLAND_LNG_MAX = Decimal('24.15')

# 波兰主要城市坐标（用于修正超出范围的坐标）
POLAND_CITIES = {
    'Warsaw': {'lat': Decimal('52.2297'), 'lng': Decimal('21.0122')},
    'Krakow': {'lat': Decimal('50.0647'), 'lng': Decimal('19.9450')},
    'Gdansk': {'lat': Decimal('54.3520'), 'lng': Decimal('18.6466')},
    'Wroclaw': {'lat': Decimal('51.1079'), 'lng': Decimal('17.0385')},
    'Poznań': {'lat': Decimal('52.4064'), 'lng': Decimal('16.9252')},
    'Łódź': {'lat': Decimal('51.7656'), 'lng': Decimal('19.4557')},
    'Katowice': {'lat': Decimal('50.2647'), 'lng': Decimal('19.0238')},
    'Szczecin': {'lat': Decimal('53.4285'), 'lng': Decimal('14.5528')},
    'Białystok': {'lat': Decimal('53.1325'), 'lng': Decimal('23.1688')},
    'Gdynia': {'lat': Decimal('54.4808'), 'lng': Decimal('18.5305')},
}

def is_coordinate_in_poland(lat, lng):
    """检查坐标是否在波兰范围内"""
    if lat is None or lng is None:
        return False
    
    return (POLAND_LAT_MIN <= lat <= POLAND_LAT_MAX and 
            POLAND_LNG_MIN <= lng <= POLAND_LNG_MAX)

def find_nearest_city(lat, lng):
    """找到离坐标最近的波兰城市"""
    if lat is None or lng is None:
        return 'Warsaw'  # 默认华沙
    
    min_distance = float('inf')
    nearest_city = 'Warsaw'
    
    for city_name, coords in POLAND_CITIES.items():
        # 简单的欧几里得距离计算
        distance = ((lat - coords['lat']) ** 2 + (lng - coords['lng']) ** 2) ** 0.5
        if distance < min_distance:
            min_distance = distance
            nearest_city = city_name
    
    return nearest_city

def clamp_coordinate(lat, lng):
    """将坐标限制在波兰范围内"""
    clamped_lat = max(POLAND_LAT_MIN, min(POLAND_LAT_MAX, lat))
    clamped_lng = max(POLAND_LNG_MIN, min(POLAND_LNG_MAX, lng))
    return clamped_lat, clamped_lng

def check_all_coordinates():
    """检查所有带坐标的地址（包括 lost 和其他）"""
    print("🔍 正在扫描所有地址坐标...\n")
    
    addresses = Address.objects.filter(Q(latitude__isnull=False) | Q(longitude__isnull=False))
    total = addresses.count()
    invalid = []
    
    for address in addresses:
        lat = address.latitude
        lng = address.longitude
        
        if lat is None or lng is None:
            continue
        
        if not is_coordinate_in_poland(lat, lng):
            invalid.append({
                'id': address.id,
                'city': address.city.name if address.city else 'Unknown',
                'lat': lat,
                'lng': lng,
                'pets_count': address.pets.count() + address.lost_set.count()
            })
    
    if invalid:
        print(f"❌ 发现 {len(invalid)} 个超出波兰范围的坐标:\n")
        for addr in invalid:
            print(f"   地址 #{addr['id']} ({addr['city']})")
            print(f"      坐标: ({addr['lat']}, {addr['lng']})")
            print(f"      相关宠物数: {addr['pets_count']}\n")
    else:
        print(f"✅ 所有地址坐标都在波兰范围内！")
    
    print("\n" + "="*60)
    print(f"📊 检查统计:")
    print(f"   总地址数: {total}")
    print(f"   有坐标的地址: {len(invalid)} 超出范围, {total - len(invalid)} 有效")
    print("="*60)

def fix_all_coordinates():
    """修复所有超出范围的坐标"""
    print("🔧 开始修复所有超出范围的坐标...\n")
    
    addresses = Address.objects.filter(Q(latitude__isnull=False) | Q(longitude__isnull=False))
    fixed_count = 0
    
    for address in addresses:
        lat = address.latitude
        lng = address.longitude
        
        if lat is None or lng is None:
            continue
        
        if not is_coordinate_in_poland(lat, lng):
            print(f"❌ 地址 #{address.id} ({address.city.name if address.city else 'Unknown'})")
            print(f"   原坐标: ({lat}, {lng})")
            
            # 修正坐标
            clamped_lat, clamped_lng = clamp_coordinate(lat, lng)
            address.latitude = clamped_lat
            address.longitude = clamped_lng
            address.location = {'lat': float(clamped_lat), 'lng': float(clamped_lng)}
            address.save()
            
            print(f"   ✅ 已修正为: ({clamped_lat}, {clamped_lng})\n")
            fixed_count += 1
    
    print("\n" + "="*60)
    print(f"📊 修复统计: 已修正 {fixed_count} 个地址坐标")
    print("="*60)


def fix_lost_pets():
    """修复所有 lost pet 的坐标"""
    print("🔍 正在扫描 lost pet 坐标...\n")
    
    lost_pets = Lost.objects.all()
    total = lost_pets.count()
    fixed = 0
    invalid = 0
    
    for lost_pet in lost_pets:
        if not lost_pet.address:
            print(f"⚠️  Lost pet #{lost_pet.id} ({lost_pet.pet_name}) 没有地址")
            invalid += 1
            continue
        
        address = lost_pet.address
        lat = address.latitude
        lng = address.longitude
        
        if lat is None or lng is None:
            print(f"⚠️  Lost pet #{lost_pet.id} ({lost_pet.pet_name}) 坐标为空")
            invalid += 1
            continue
        
        # 检查坐标是否有效
        if not is_coordinate_in_poland(lat, lng):
            print(f"❌ Lost pet #{lost_pet.id} ({lost_pet.pet_name})")
            print(f"   位置: {address.city.name if address.city else 'Unknown'}")
            print(f"   原坐标: ({lat}, {lng})")
            
            # 修正坐标
            clamped_lat, clamped_lng = clamp_coordinate(lat, lng)
            
            # 检查 clamp 后是否改变
            if clamped_lat != lat or clamped_lng != lng:
                address.latitude = clamped_lat
                address.longitude = clamped_lng
                address.location = {'lat': float(clamped_lat), 'lng': float(clamped_lng)}
                address.save()
                
                print(f"   ✅ 已修正为: ({clamped_lat}, {clamped_lng})")
                print(f"   距离: {find_nearest_city(clamped_lat, clamped_lng)}\n")
                fixed += 1
            else:
                print(f"   ⚠️  坐标已在波兰范围内 (Clamped to {clamped_lat}, {clamped_lng})\n")
        else:
            # 坐标有效
            print(f"✅ Lost pet #{lost_pet.id} ({lost_pet.pet_name}) 坐标有效: ({lat}, {lng})")
    
    print("\n" + "="*60)
    print(f"📊 修复统计:")
    print(f"   总数: {total}")
    print(f"   已修正: {fixed}")
    print(f"   无效/跳过: {invalid}")
    print(f"   有效: {total - fixed - invalid}")
    print("="*60)

if __name__ == '__main__':
    if '--check-all' in sys.argv:
        check_all_coordinates()
    elif '--fix-all' in sys.argv:
        fix_all_coordinates()
    else:
        fix_lost_pets()
