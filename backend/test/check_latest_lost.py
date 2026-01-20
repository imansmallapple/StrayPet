#!/usr/bin/env python
"""检查最新的 Lost 记录，看是否有 address 数据"""

import sqlite3
from datetime import datetime

conn = sqlite3.connect('db.sqlite3')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# 查询最新的 1 条记录 (ID=20, 这是用户刚提交的)
cursor.execute('''
    SELECT 
        pl.id, 
        pl.pet_name, 
        pl.address_id,
        pl.created_at,
        pa.id as addr_id,
        pa.street,
        pa.building_number,
        pa.postal_code,
        pac.id as country_id,
        pac.name as country_name,
        par.id as region_id,
        par.name as region_name,
        pc.id as city_id,
        pc.name as city_name
    FROM pet_lost pl
    LEFT JOIN pet_address pa ON pl.address_id = pa.id
    LEFT JOIN pet_country pac ON pa.country_id = pac.id
    LEFT JOIN pet_region par ON pa.region_id = par.id
    LEFT JOIN pet_city pc ON pa.city_id = pc.id
    WHERE pl.pet_name = 'loca'
    ORDER BY pl.created_at DESC
    LIMIT 1
''')

row = cursor.fetchone()

if row:
    print("最新创建的 'loca' Lost 记录:")
    print(f"  ID: {row['id']}")
    print(f"  宠物名: {row['pet_name']}")
    print(f"  创建时间: {row['created_at']}")
    print(f"  Address ID: {row['address_id']}")
    
    if row['address_id']:
        print("\n✓ 有 Address 数据:")
        print(f"  Address ID: {row['addr_id']}")
        print(f"  Country ID: {row['country_id']} -> {row['country_name']}")
        print(f"  Region ID: {row['region_id']} -> {row['region_name']}")
        print(f"  City ID: {row['city_id']} -> {row['city_name']}")
        print(f"  街道: {row['street']}")
        print(f"  邮编: {row['postal_code']}")
    else:
        print("\n✗ 没有 Address 数据 - address_id 为 NULL")
        print("\n这意味着后端没有正确处理 address_data")
else:
    print("找不到 pet_name='loca' 的记录")

conn.close()
