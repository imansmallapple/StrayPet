#!/usr/bin/env python
"""
关联地址到正确的城市
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Shelter, Address, City

# 收容所到城市ID的映射（根据现有数据）
shelter_city_mapping = {
    'Warsaw Animal Rescue': 7,      # Warsaw (ID 7, Masovian)
    'Krakow Pet Haven': 8,          # Krakow (ID 8, Lesser Poland)
    'Gdansk Pet Rescue': 9,         # Gdansk (ID 9, Pomeranian)
    'Wroclaw Warmhearts': 10,       # Wroclaw (ID 10, Lower Silesian)
    'Poznan Animal Care': 11,       # Poznan (ID 11, Greater Poland)
    'Lodz Pet Care': 12,            # Lodz (ID 12, Lodz Voivodeship)
}

updated_count = 0

for shelter_name, city_id in shelter_city_mapping.items():
    try:
        shelter = Shelter.objects.get(name=shelter_name)
        city = City.objects.get(id=city_id)
        
        if shelter.address:
            shelter.address.city = city
            shelter.address.save()
            updated_count += 1
            print(f"✅ {shelter_name}: 已关联城市 {city.name}")
        else:
            print(f"⚠️  {shelter_name}: 没有关联的地址")
    
    except Shelter.DoesNotExist:
        print(f"⚠️  找不到收容所: {shelter_name}")
    except City.DoesNotExist:
        print(f"⚠️  找不到城市 ID: {city_id}")
    except Exception as e:
        print(f"❌ {shelter_name} 错误: {e}")

print(f"\n✅ 成功更新 {updated_count} 个收容所的城市信息")

# 验证
print("\n📍 更新后的完整地址信息:")
for shelter in Shelter.objects.all().order_by('name'):
    if shelter.address:
        city_name = shelter.address.city.name if shelter.address.city else "未指定"
        region_name = shelter.address.region.name if shelter.address.region else "未指定"
        addr_str = f"{shelter.address.street}"
        if shelter.address.building_number:
            addr_str += f" {shelter.address.building_number}"
        addr_str += f", {shelter.address.postal_code}, {city_name}, {region_name}, Poland"
        print(f"  {shelter.name}:")
        print(f"    {addr_str}")
