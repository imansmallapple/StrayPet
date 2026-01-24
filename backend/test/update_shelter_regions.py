#!/usr/bin/env python
"""
更新收容所地址的地区关联
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Shelter, Address, Region, Country

# 收容所到地区的映射
shelter_region_mapping = {
    'Warsaw Animal Rescue': 'Masovian',
    'Krakow Pet Haven': 'Lesser Poland',
    'Gdansk Pet Rescue': 'Pomeranian',
    'Wroclaw Warmhearts': 'Lower Silesian',
    'Poznan Animal Care': 'Greater Poland',
    'Lodz Pet Care': 'Lodz',
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

for shelter_name, region_name in shelter_region_mapping.items():
    try:
        shelter = Shelter.objects.get(name=shelter_name)
        
        # 获取地区对象
        region = Region.objects.filter(name=region_name, country=country_poland).first()
        if not region:
            # 如果特定国家的地区不存在，尝试不指定国家查找
            region = Region.objects.filter(name=region_name).first()
        
        if region and shelter.address:
            shelter.address.region = region
            shelter.address.save()
            updated_count += 1
            print(f"✅ {shelter_name}: 已关联地区 {region_name}")
        else:
            if not region:
                print(f"⚠️  {shelter_name}: 找不到地区 {region_name}")
            if not shelter.address:
                print(f"⚠️  {shelter_name}: 没有关联的地址")
    
    except Shelter.DoesNotExist:
        print(f"⚠️  找不到收容所: {shelter_name}")
    except Exception as e:
        print(f"❌ {shelter_name} 错误: {e}")

print(f"\n✅ 成功更新 {updated_count} 个收容所的地区信息")

# 验证
print("\n📍 更新后的地址信息:")
for shelter in Shelter.objects.all().order_by('name'):
    if shelter.address:
        region_name = shelter.address.region.name if shelter.address.region else "未指定"
        print(f"  {shelter.name}: {shelter.address.street} - {region_name}")
