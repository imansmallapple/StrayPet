#!/usr/bin/env python
"""
恢复收容所数据到 PostgreSQL
（从迁移前的日志数据中重构）
"""
import os
import django
import psycopg2

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Address, Shelter, Country, Region, City

# 连接 PostgreSQL
pg_conn = psycopg2.connect(
    host='db',  # Docker 容器内使用 db
    database='straypet',
    user='sp_user',
    password='sp_pass',
    port='5432'
)
pg_cursor = pg_conn.cursor()

# 手动插入收容所数据（完整信息 + 地址）
shelters_data = [
    {
        'name': 'Warsaw Animal Rescue',
        'description': 'Leading animal rescue organization in Warsaw dedicated to saving stray and abandoned animals.',
        'email': 'contact@warsaw-animal-rescue.pl',
        'phone': '+48 22 1234567',
        'website': 'https://warsaw-animal-rescue.pl',
        'capacity': 150,
        'current_animals': 85,
        'founded_year': 2010,
        'is_verified': True,
        'is_active': True,
        'facebook_url': 'https://facebook.com/warsawanimalrescue',
        'instagram_url': 'https://instagram.com/warsawanimalrescue',
        'twitter_url': 'https://twitter.com/warsawanimalrescue',
        'address': {
            'street': 'Emilii Plater',
            'building_number': '45',
            'postal_code': '00-133',
            'city': 'Warsaw',
            'region': 'Masovian',
            'country': 'Poland',
            'latitude': 52.2297,
            'longitude': 21.0122,
        }
    },
    {
        'name': 'Krakow Pet Haven',
        'description': 'Established pet shelter in Krakow providing safe haven for lost and abandoned pets.',
        'email': 'info@krakow-pet-haven.com',
        'phone': '+48 12 9876543',
        'website': 'https://krakow-pet-haven.com',
        'capacity': 200,
        'current_animals': 120,
        'founded_year': 2012,
        'is_verified': True,
        'is_active': True,
        'facebook_url': 'https://facebook.com/krakowpethaven',
        'instagram_url': 'https://instagram.com/krakowpethaven',
        'twitter_url': 'https://twitter.com/krakowpethaven',
        'address': {
            'street': 'ul. Rakowicka',
            'building_number': '60',
            'postal_code': '31-510',
            'city': 'Kraków',
            'region': 'Lesser Poland',
            'country': 'Poland',
            'latitude': 50.0647,
            'longitude': 19.9450,
        }
    },
    {
        'name': 'Gdansk Pet Rescue',
        'description': 'Coastal city animal sanctuary focused on rescuing and rehabilitating street animals.',
        'email': 'help@gdansk-pet-rescue.pl',
        'phone': '+48 58 5432109',
        'website': 'https://gdansk-pet-rescue.pl',
        'capacity': 120,
        'current_animals': 65,
        'founded_year': 2015,
        'is_verified': False,
        'is_active': True,
        'facebook_url': 'https://facebook.com/gdanskpetrescue',
        'instagram_url': 'https://instagram.com/gdanskpetrescue',
        'twitter_url': '',
        'address': {
            'street': 'ul. Kartuska',
            'building_number': '114A',
            'postal_code': '80-113',
            'city': 'Gdańsk',
            'region': 'Pomeranian',
            'country': 'Poland',
            'latitude': 54.4520,
            'longitude': 18.6330,
        }
    },
    {
        'name': 'Wroclaw Warmhearts',
        'description': 'Compassionate animal care facility serving the Wroclaw region with adoption services.',
        'email': 'warmhearts@wroclaw-shelter.org',
        'phone': '+48 71 3216549',
        'website': 'https://wroclaw-warmhearts.org',
        'capacity': 180,
        'current_animals': 95,
        'founded_year': 2013,
        'is_verified': True,
        'is_active': True,
        'facebook_url': 'https://facebook.com/wroclawwarmhearts',
        'instagram_url': 'https://instagram.com/wroclawwarmhearts',
        'twitter_url': 'https://twitter.com/wroclawwarmhearts',
        'address': {
            'street': 'ul. Strzegomska',
            'building_number': '55',
            'postal_code': '50-410',
            'city': 'Wrocław',
            'region': 'Lower Silesia',
            'country': 'Poland',
            'latitude': 51.1079,
            'longitude': 17.0573,
        }
    },
    {
        'name': 'Poznan Animal Care',
        'description': 'Professional animal shelter in Poznan dedicated to animal welfare and rescue operations.',
        'email': 'care@poznan-animal-care.org',
        'phone': '+48 61 8765432',
        'website': 'https://poznan-animal-care.org',
        'capacity': 100,
        'current_animals': 45,
        'founded_year': 2014,
        'is_verified': True,
        'is_active': True,
        'facebook_url': 'https://facebook.com/poznananimalcare',
        'instagram_url': 'https://instagram.com/poznananimalcare',
        'twitter_url': 'https://twitter.com/poznananimalcare',
        'address': {
            'street': 'ul. Ostrów Tumski',
            'building_number': '27A',
            'postal_code': '61-809',
            'city': 'Poznań',
            'region': 'Greater Poland',
            'country': 'Poland',
            'latitude': 52.4102,
            'longitude': 16.9255,
        }
    },
    {
        'name': 'Lodz Pet Care',
        'description': 'Multi-functional animal care center providing rescue, rehabilitation and adoption services.',
        'email': 'support@lodz-pet-care.com',
        'phone': '+48 42 6543210',
        'website': 'https://lodz-pet-care.com',
        'capacity': 150,
        'current_animals': 78,
        'founded_year': 2011,
        'is_verified': True,
        'is_active': True,
        'facebook_url': 'https://facebook.com/lodzpetcare',
        'instagram_url': 'https://instagram.com/lodzpetcare',
        'twitter_url': 'https://twitter.com/lodzpetcare',
        'address': {
            'street': 'ul. Piotrkowska',
            'building_number': '88',
            'postal_code': '90-265',
            'city': 'Łódź',
            'region': 'Łódź Voivodeship',
            'country': 'Poland',
            'latitude': 51.7693,
            'longitude': 19.4549,
        }
    },
]

# 先清空现有数据
try:
    Shelter.objects.all().delete()
    Address.objects.all().delete()
    print("✅ 已清空现有收容所和地址数据")
except Exception as e:
    print(f"⚠️  清空失败: {e}")

# 获取波兰国家对象
try:
    countries = Country.objects.filter(name='Poland')
    if countries.exists():
        country_poland = countries.first()
        print(f"✅ 找到国家: {country_poland.name} (ID: {country_poland.id})")
    else:
        print("❌ 错误: 找不到 Poland 国家，请先创建")
        exit(1)
except Exception as e:
    print(f"❌ 错误: {e}")
    exit(1)

# 创建收容所及其地址
created_count = 0
try:
    for shelter_data in shelters_data:
        addr_info = shelter_data.pop('address')
        
        # 获取地区和城市
        try:
            region = Region.objects.get(name=addr_info['region'], country=country_poland)
        except:
            print(f"⚠️  找不到地区: {addr_info['region']}")
            region = None
        
        try:
            city = City.objects.get(name=addr_info['city'], region=region) if region else None
        except:
            print(f"⚠️  找不到城市: {addr_info['city']}")
            city = None
        
        # 创建地址
        address = Address.objects.create(
            country=country_poland,
            region=region,
            city=city,
            street=addr_info['street'],
            building_number=addr_info['building_number'],
            postal_code=addr_info['postal_code'],
            latitude=addr_info['latitude'],
            longitude=addr_info['longitude'],
        )
        
        # 创建收容所
        shelter = Shelter.objects.create(
            address=address,
            **shelter_data
        )
        created_count += 1
        print(f"✅ 创建: {shelter.name}")
    
    print(f"\n✅ 成功创建 {created_count} 个收容所")
    
    # 验证
    total_shelters = Shelter.objects.count()
    total_addresses = Address.objects.count()
    print(f"✅ 数据库中现在有 {total_shelters} 个收容所")
    print(f"✅ 数据库中现在有 {total_addresses} 个地址")
    
except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()

pg_cursor.close()
pg_conn.close()
