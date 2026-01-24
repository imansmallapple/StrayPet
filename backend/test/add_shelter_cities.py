#!/usr/bin/env python
"""
为收容所添加城市信息
波兰的地理结构：
- Masovian → Warsaw (华沙)
- Lesser Poland → Kraków (克拉科夫)
- Pomeranian → Gdańsk (格但斯克)
- Lower Silesian → Wrocław (弗罗茨瓦夫)
- Greater Poland → Poznań (波兹南)
- Łódź Voivodeship → Łódź (罗兹)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Shelter, Address, City, Region, Country

# 收容所到城市的映射
shelter_city_mapping = {
    'Warsaw Animal Rescue': ('Masovian', 'Warsaw'),
    'Krakow Pet Haven': ('Lesser Poland', 'Kraków'),
    'Gdansk Pet Rescue': ('Pomeranian', 'Gdańsk'),
    'Wroclaw Warmhearts': ('Lower Silesian', 'Wrocław'),
    'Poznan Animal Care': ('Greater Poland', 'Poznań'),
    'Lodz Pet Care': ('Lodz', 'Łódź'),
}

# 获取波兰国家
try:
    country_poland = Country.objects.filter(name='Poland').first()
    if not country_poland:
        print("❌ 找不到 Poland 国家")
        exit(1)
except Exception as e:
    print(f"❌ 错误: {e}")
    exit(1)

updated_count = 0

for shelter_name, (region_name, city_name) in shelter_city_mapping.items():
    try:
        shelter = Shelter.objects.get(name=shelter_name)
        
        # 获取或创建地区
        region = Region.objects.filter(name=region_name, country=country_poland).first()
        if not region:
            region = Region.objects.filter(name=region_name).first()
        
        if region and shelter.address:
            # 获取或创建城市
            city, created = City.objects.get_or_create(
                name=city_name,
                region=region
            )
            
            if created:
                print(f"  📍 创建城市: {city_name} ({region_name})")
            
            # 关联城市到地址
            shelter.address.city = city
            shelter.address.region = region
            shelter.address.country = country_poland
            shelter.address.save()
            updated_count += 1
            print(f"✅ {shelter_name}: 已关联城市 {city_name}")
        else:
            print(f"⚠️  {shelter_name}: 地区或地址缺失")
    
    except Shelter.DoesNotExist:
        print(f"⚠️  找不到收容所: {shelter_name}")
    except Exception as e:
        print(f"❌ {shelter_name} 错误: {e}")
        import traceback
        traceback.print_exc()

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
