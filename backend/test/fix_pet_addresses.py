#!/usr/bin/env python
"""
直接修复：为所有宠物分配地址和城市
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet, Shelter, Address, Country, Region, City

# 第一步：确保有基础地理数据
print("[1] 确保有基础地理数据...")

# 获取或创建波兰
poland, _ = Country.objects.get_or_create(
    code='PL',
    defaults={'name': 'Poland'}
)
print(f"  ✅ Country: {poland.name}")

# 创建波兰城市（如果不存在）
major_cities = {
    'Warsaw': 'Masovian',
    'Krakow': 'Lesser Poland',
    'Gdansk': 'Pomeranian',
    'Wroclaw': 'Lower Silesian',
    'Poznan': 'Greater Poland',
}

regions_dict = {}
for region_name in set(major_cities.values()):
    region, _ = Region.objects.get_or_create(
        country=poland,
        name=region_name
    )
    regions_dict[region_name] = region
    print(f"  ✅ Region: {region_name}")

cities_dict = {}
for city_name, region_name in major_cities.items():
    region = regions_dict[region_name]
    city, _ = City.objects.get_or_create(
        region=region,
        name=city_name
    )
    cities_dict[city_name] = city
    print(f"  ✅ City: {city_name}")

# 第二步：给收容所分配地址和城市
print("\n[2] 为收容所分配地址...")
shelters = Shelter.objects.all()[:5]

for shelter in shelters:
    if not shelter.address:
        # 创建地址
        city = list(cities_dict.values())[shelters.values_list('id', flat=True).list().index(shelter.id) % len(cities_dict)]
        address, _ = Address.objects.get_or_create(
            city=city,
            region=city.region,
            country=poland,
            defaults={
                'street': f'{shelter.name} Street',
                'building_number': '1',
                'postal_code': '00-000'
            }
        )
        shelter.address = address
        shelter.save()
        print(f"  ✅ {shelter.name}: 分配地址至 {city.name}")
    else:
        print(f"  ✓ {shelter.name}: 已有地址")

# 第三步：给宠物分配地址
print("\n[3] 为宠物分配地址...")
pets = Pet.objects.all()

for pet in pets:
    if not pet.address:
        if pet.shelter and pet.shelter.address:
            pet.address = pet.shelter.address
        else:
            # 使用第一个有地址的收容所的地址
            shelter_with_address = Shelter.objects.filter(address__isnull=False).first()
            if shelter_with_address:
                pet.address = shelter_with_address.address
                pet.shelter = shelter_with_address
        
        if pet.address:
            pet.save(update_fields=['address', 'shelter'])
            city_name = pet.address.city.name if pet.address.city else 'Unknown'
            print(f"  ✅ {pet.name}: 分配地址 ({city_name})")

print("\n[4] 验证...")
pets_with_address = Pet.objects.filter(address__isnull=False)
print(f"✅ 成功：{pets_with_address.count()}/{pets.count()} 宠物有地址")

# 显示示例
print("\n[5] 示例:")
for pet in pets_with_address[:3]:
    city_name = pet.address.city.name if pet.address.city else 'No city'
    print(f"  {pet.name}: {city_name}")
