#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet, Address, City, Region, Country

# 波兰其他城市的坐标和信息
cities_data = [
    {'name': 'Kraków', 'lat': 50.0647, 'lng': 19.9450},
    {'name': 'Poznań', 'lat': 52.4064, 'lng': 16.9252},
    {'name': 'Gdańsk', 'lat': 54.3520, 'lng': 18.6466},
    {'name': 'Łódź', 'lat': 51.7656, 'lng': 19.4557},
    {'name': 'Wrocław', 'lat': 51.1079, 'lng': 17.0385},
    {'name': 'Katowice', 'lat': 50.2647, 'lng': 19.0238},
    {'name': 'Szczecin', 'lat': 53.4285, 'lng': 14.5528},
    {'name': 'Białystok', 'lat': 53.1325, 'lng': 23.1688},
]

# 获取波兰国家和地区
try:
    country = Country.objects.filter(name='Poland').first()
    if not country:
        print("❌ Poland国家不存在")
        exit(1)
except Exception as e:
    print(f"❌ 获取国家错误: {e}")
    exit(1)

# 获取或创建城市对象
city_objects = {}
for city_data in cities_data:
    try:
        # 尝试从现有城市获取
        # 先尝试获取该地区（假设所有城市都在波兰）
        regions = Region.objects.filter(country=country)
        if not regions.exists():
            print(f"❌ 波兰没有地区数据")
            exit(1)
        
        region = regions.first()  # 使用第一个地区
        # 尝试获取现有城市，不存在则创建
        city_obj = City.objects.filter(name=city_data['name'], region=region).first()
        if not city_obj:
            city_obj = City.objects.create(name=city_data['name'], region=region)
            print(f"✓ 创建城市: {city_data['name']}")
        else:
            print(f"✓ 找到城市: {city_data['name']}")
        city_objects[city_data['name']] = city_obj
    except Exception as e:
        print(f"❌ 城市 {city_data['name']} 错误: {e}")

# 更新宠物地址
pets = Pet.objects.all()
for i, pet in enumerate(pets):
    city_data = cities_data[i % len(cities_data)]
    city_obj = city_objects.get(city_data['name'])
    
    if not city_obj:
        print(f"⚠️ 跳过 {pet.name}，因为城市对象不存在")
        continue
    
    if pet.address:
        # 更新现有地址
        pet.address.city = city_obj
        pet.address.latitude = city_data['lat']
        pet.address.longitude = city_data['lng']
        pet.address.location = {'lat': city_data['lat'], 'lng': city_data['lng']}
        pet.address.save()
        print(f"✓ 更新 {pet.name} -> {city_data['name']} ({city_data['lat']}, {city_data['lng']})")
    else:
        # 创建新地址
        address = Address.objects.create(
            city=city_obj,
            country=country,
            region=city_obj.region,
            latitude=city_data['lat'],
            longitude=city_data['lng'],
            location={'lat': city_data['lat'], 'lng': city_data['lng']}
        )
        pet.address = address
        pet.save()
        print(f"✓ 创建 {pet.name} -> {city_data['name']} ({city_data['lat']}, {city_data['lng']})")

print("\n✓ 所有宠物地址已更新！")
