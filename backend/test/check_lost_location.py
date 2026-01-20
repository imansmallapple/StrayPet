#!/usr/bin/env python
import sqlite3
import json

conn = sqlite3.connect('db.sqlite3')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# 查询 Lost 表的记录数量
cursor.execute('SELECT COUNT(*) FROM pet_lost')
total = cursor.fetchone()[0]
print(f'Lost 表总记录数: {total}\n')

if total == 0:
    print('Lost 表中没有记录')
    conn.close()
    exit()

# 查询 Lost 表的前 5 条记录及其 address 信息
cursor.execute('''
    SELECT 
        pl.id, 
        pl.pet_name, 
        pl.species,
        pl.address_id,
        pl.contact_phone,
        pl.contact_email,
        pa.street,
        pac.name as country_name,
        par.name as region_name,
        pc.name as city_name
    FROM pet_lost pl
    LEFT JOIN pet_address pa ON pl.address_id = pa.id
    LEFT JOIN pet_country pac ON pa.country_id = pac.id
    LEFT JOIN pet_region par ON pa.region_id = par.id
    LEFT JOIN pet_city pc ON pa.city_id = pc.id
    LIMIT 5
''')

columns = [description[0] for description in cursor.description]
rows = cursor.fetchall()

print('前 5 条 Lost Pet 记录的 location 信息:')
print('=' * 100)

for i, row in enumerate(rows, 1):
    print(f'\n记录 {i}:')
    print(f'  ID: {row["id"]}')
    print(f'  宠物名: {row["pet_name"]}')
    print(f'  物种: {row["species"]}')
    print(f'  address_id: {row["address_id"]}')
    print(f'  联系电话: {row["contact_phone"]}')
    print(f'  联系邮箱: {row["contact_email"]}')
    print(f'  Location 信息:')
    if row["address_id"]:
        print(f'    国家: {row["country_name"]}')
        print(f'    地区: {row["region_name"]}')
        print(f'    城市: {row["city_name"]}')
        print(f'    街道: {row["street"]}')
    else:
        print(f'    (无 address 数据)')

# 统计有 address 的记录
cursor.execute('SELECT COUNT(*) FROM pet_lost WHERE address_id IS NOT NULL')
with_address = cursor.fetchone()[0]
cursor.execute('SELECT COUNT(*) FROM pet_lost WHERE address_id IS NULL')
without_address = cursor.fetchone()[0]

print(f'\n\n统计信息:')
print(f'  有 address 的记录: {with_address} ({with_address*100/total:.1f}%)')
print(f'  无 address 的记录: {without_address} ({without_address*100/total:.1f}%)')

# 查询有地址的记录的地址分布
print(f'\n\n地址分布:')
cursor.execute('''
    SELECT 
        pac.name as country,
        COUNT(*) as count
    FROM pet_lost pl
    LEFT JOIN pet_address pa ON pl.address_id = pa.id
    LEFT JOIN pet_country pac ON pa.country_id = pac.id
    WHERE pl.address_id IS NOT NULL
    GROUP BY pac.name
''')
for row in cursor.fetchall():
    print(f'  {row["country"]}: {row["count"]} 条记录')

conn.close()
