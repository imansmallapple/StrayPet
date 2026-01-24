#!/usr/bin/env python
"""
完整的宠物地址修复脚本 - 不依赖 manage.py
"""
import os
import sys
import django

# 设置路径
backend_path = r'C:\Users\alf13\Documents\pyrepos\strayPet\backend'
sys.path.insert(0, backend_path)
os.chdir(backend_path)

# 配置 Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet, Shelter, Address, Country, Region, City

def main():
    print("=" * 60)
    print("🔧 宠物地址修复工具")
    print("=" * 60)
    
    # Step 1: 检查现有数据
    print("\n[1] 检查现有数据...")
    pets_count = Pet.objects.count()
    pets_with_addr = Pet.objects.filter(address__isnull=False).count()
    shelters_count = Shelter.objects.count()
    shelters_with_addr = Shelter.objects.filter(address__isnull=False).count()
    
    print(f"  - 宠物总数: {pets_count}")
    print(f"  - 宠物有地址: {pets_with_addr}")
    print(f"  - 收容所总数: {shelters_count}")
    print(f"  - 收容所有地址: {shelters_with_addr}")
    
    # Step 2: 创建基础数据
    print("\n[2] 创建或获取地理数据...")
    
    poland, _ = Country.objects.get_or_create(code='PL', defaults={'name': 'Poland'})
    print(f"  ✅ Poland: {poland.id}")
    
    regions_cities = {
        'Masovian': ['Warsaw'],
        'Lesser Poland': ['Krakow'],
        'Pomeranian': ['Gdansk'],
        'Lower Silesian': ['Wroclaw'],
        'Greater Poland': ['Poznan'],
    }
    
    cities = []
    for region_name, city_names in regions_cities.items():
        region, _ = Region.objects.get_or_create(
            country=poland,
            name=region_name
        )
        for city_name in city_names:
            city, _ = City.objects.get_or_create(
                region=region,
                name=city_name
            )
            cities.append(city)
            print(f"  ✅ {region_name} - {city_name}: {city.id}")
    
    # Step 3: 为收容所分配地址
    print("\n[3] 为收容所分配地址...")
    shelters = list(Shelter.objects.all())
    
    for idx, shelter in enumerate(shelters):
        try:
            if not shelter.address:
                city = cities[idx % len(cities)]
                addr, _ = Address.objects.get_or_create(
                    city=city,
                    region=city.region,
                    country=poland,
                    defaults={
                        'street': f'{shelter.name} Street',
                        'building_number': '1',
                        'postal_code': '00-000'
                    }
                )
                shelter.address = addr
                shelter.save()
                print(f"  ✅ {shelter.name}: {city.name}")
        except Exception as e:
            print(f"  ❌ {shelter.name}: {str(e)}")
    
    # Step 4: 为宠物分配地址
    print("\n[4] 为宠物分配地址...")
    pets = list(Pet.objects.all())
    updated = 0
    
    for idx, pet in enumerate(pets):
        try:
            if not pet.address:
                # 优先使用宠物关联的收容所的地址
                if pet.shelter and pet.shelter.address:
                    pet.address = pet.shelter.address
                else:
                    # 否则使用第一个有地址的收容所
                    shelter = Shelter.objects.filter(address__isnull=False).first()
                    if shelter:
                        pet.address = shelter.address
                        pet.shelter = shelter
                
                if pet.address:
                    pet.save(update_fields=['address', 'shelter'] if not pet.shelter else ['address'])
                    city_name = pet.address.city.name if pet.address.city else 'Unknown'
                    print(f"  ✅ {pet.name}: {city_name}")
                    updated += 1
        except Exception as e:
            print(f"  ❌ {pet.name}: {str(e)}")
    
    # Step 5: 验证结果
    print("\n[5] 验证结果...")
    pets_with_addr_now = Pet.objects.filter(address__isnull=False).count()
    print(f"  ✅ 宠物有地址: {pets_with_addr_now}/{pets_count}")
    print(f"  ✅ 本次更新: {updated} 个")
    
    # Step 6: 验证 city 字段
    print("\n[6] 验证 city 字段...")
    from apps.pet.serializers import PetListSerializer
    
    pets_sample = Pet.objects.all()[:3]
    for pet in pets_sample:
        serializer = PetListSerializer(pet)
        data = serializer.data
        city = data.get('city', 'N/A')
        print(f"  {pet.name}: city='{city}'")
    
    print("\n" + "=" * 60)
    print("✅ 修复完成！")
    print("=" * 60)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
