#!/usr/bin/env python
import sqlite3
from datetime import datetime

conn = sqlite3.connect('db.sqlite3')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# 查询最近的 Lost 记录，按创建时间倒序
print('最近创建的 Lost 记录（按创建时间倒序）:')
print('=' * 120)

cursor.execute('''
    SELECT 
        pl.id, 
        pl.pet_name, 
        pl.species,
        pl.address_id,
        pl.contact_phone,
        pl.contact_email,
        pl.lost_time,
        pl.created_at,
        pl.updated_at,
        pa.id as addr_id,
        pa.street,
        pa.building_number,
        pa.postal_code,
        pac.name as country_name,
        par.name as region_name,
        pc.name as city_name,
        pa.latitude,
        pa.longitude
    FROM pet_lost pl
    LEFT JOIN pet_address pa ON pl.address_id = pa.id
    LEFT JOIN pet_country pac ON pa.country_id = pac.id
    LEFT JOIN pet_region par ON pa.region_id = par.id
    LEFT JOIN pet_city pc ON pa.city_id = pc.id
    ORDER BY pl.created_at DESC
    LIMIT 10
''')

rows = cursor.fetchall()

for i, row in enumerate(rows, 1):
    print(f'\n【记录 {i}】')
    print(f'  ID: {row["id"]}')
    print(f'  宠物名: {row["pet_name"] or "(空)"}')
    print(f'  物种: {row["species"]}')
    print(f'  创建时间: {row["created_at"]}')
    print(f'  更新时间: {row["updated_at"]}')
    print(f'  contact_phone: {row["contact_phone"] or "(空)"}')
    print(f'  contact_email: {row["contact_email"] or "(空)"}')
    print(f'  Address ID: {row["address_id"]}')
    
    if row["address_id"]:
        print(f'  ✓ 有 Address 数据:')
        print(f'    - 国家: {row["country_name"]}')
        print(f'    - 地区: {row["region_name"]}')
        print(f'    - 城市: {row["city_name"]}')
        print(f'    - 街道: {row["street"]}')
        print(f'    - 建筑号: {row["building_number"]}')
        print(f'    - 邮编: {row["postal_code"]}')
        print(f'    - 坐标: ({row["latitude"]}, {row["longitude"]})')
    else:
        print(f'  ✗ 没有 Address 数据')

# 查看是否有pending或未完全处理的地址数据
print('\n\n' + '=' * 120)
print('\n检查 Address 表中的所有记录:')
print('=' * 120)

cursor.execute('''
    SELECT 
        pa.id,
        pa.street,
        pa.building_number,
        pac.name as country,
        par.name as region,
        pc.name as city,
        COUNT(DISTINCT pl.id) as lost_count,
        COUNT(DISTINCT pd.id) as donation_count
    FROM pet_address pa
    LEFT JOIN pet_lost pl ON pa.id = pl.address_id
    LEFT JOIN pet_donation pd ON pa.id = pd.address_id
    GROUP BY pa.id
    ORDER BY pa.id DESC
    LIMIT 10
''')

for row in cursor.fetchall():
    print(f'\nAddress ID: {row["id"]}')
    print(f'  位置: {row["country"]} {row["region"]} {row["city"]} {row["street"]}')
    print(f'  关联 Lost 记录: {row["lost_count"]}')
    print(f'  关联 Donation 记录: {row["donation_count"]}')

conn.close()
