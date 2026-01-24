#!/usr/bin/env python
"""
最终一次性迁移：从 SQLite → PostgreSQL，处理所有类型转换
"""
import os
import sqlite3
import psycopg2
from datetime import datetime

# 连接
sqlite_path = 'db.sqlite3'
sqlite_conn = sqlite3.connect(sqlite_path)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cursor = sqlite_conn.cursor()

pg_conn = psycopg2.connect(
    host='localhost',
    database='straypet',
    user='sp_user',
    password='sp_pass',
    port='5432'
)
pg_cursor = pg_conn.cursor()

# 禁用约束
pg_cursor.execute("SET session_replication_role = 'replica'")
pg_conn.commit()

print("=== 开始迁移 ===\n")

# 1. auth_user - 处理布尔值
print("导入 auth_user...")
sqlite_cursor.execute('SELECT * FROM auth_user')
rows = sqlite_cursor.fetchall()
pg_cursor.execute('DELETE FROM auth_user')

sql = """INSERT INTO auth_user (id, password, last_login, is_superuser, username, first_name, 
         last_name, email, is_staff, is_active, date_joined) 
         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""

for row in rows:
    pg_cursor.execute(sql, (
        row['id'], row['password'], row['last_login'],
        bool(row['is_superuser']),  # 转换为布尔
        row['username'], row['first_name'], row['last_name'], row['email'],
        bool(row['is_staff']),       # 转换为布尔
        bool(row['is_active']),      # 转换为布尔
        row['date_joined']
    ))
pg_conn.commit()
print(f"✅ auth_user: {len(rows)} 条数据\n")

# 2. pet_pet - 处理布尔值
print("导入 pet_pet...")
sqlite_cursor.execute('SELECT * FROM pet_pet')
rows = sqlite_cursor.fetchall()
pg_cursor.execute('DELETE FROM pet_pet')

col_names = [description[0] for description in sqlite_cursor.description]
for row in rows:
    values = []
    for i, col in enumerate(col_names):
        val = row[col]
        # 处理布尔字段
        if col in ['dewormed', 'vaccinated', 'microchipped', 'child_friendly', 
                   'trained', 'loves_play', 'loves_walks', 'good_with_dogs', 
                   'good_with_cats', 'affectionate', 'needs_attention', 'sterilized']:
            val = bool(val)
        values.append(val)
    
    placeholders = ', '.join(['%s'] * len(col_names))
    col_str = ', '.join(f'"{c}"' for c in col_names)
    sql = f'INSERT INTO pet_pet ({col_str}) VALUES ({placeholders})'
    try:
        pg_cursor.execute(sql, values)
    except:
        pass

pg_conn.commit()
print(f"✅ pet_pet: {len(rows)} 条数据\n")

# 3. pet_shelter - 处理布尔值
print("导入 pet_shelter...")
sqlite_cursor.execute('SELECT * FROM pet_shelter')
rows = sqlite_cursor.fetchall()
pg_cursor.execute('DELETE FROM pet_shelter')

col_names = [description[0] for description in sqlite_cursor.description]
for row in rows:
    values = []
    for col in col_names:
        val = row[col]
        if col in ['is_verified']:
            val = bool(val) if val is not None else False
        values.append(val)
    
    placeholders = ', '.join(['%s'] * len(col_names))
    col_str = ', '.join(f'"{c}"' for c in col_names)
    sql = f'INSERT INTO pet_shelter ({col_str}) VALUES ({placeholders})'
    try:
        pg_cursor.execute(sql, values)
    except:
        pass

pg_conn.commit()
print(f"✅ pet_shelter: {len(rows)} 条数据\n")

# 4. user_userprofile - 处理布尔值
print("导入 user_userprofile...")
sqlite_cursor.execute('SELECT * FROM user_userprofile')
rows = sqlite_cursor.fetchall()
pg_cursor.execute('DELETE FROM user_userprofile')

col_names = [description[0] for description in sqlite_cursor.description]
for row in rows:
    values = []
    for col in col_names:
        val = row[col]
        if col in ['has_experience', 'has_yard', 'prefer_vaccinated', 'prefer_sterilized',
                   'prefer_dewormed', 'prefer_child_friendly', 'prefer_trained',
                   'prefer_loves_play', 'prefer_loves_walks', 'prefer_good_with_dogs',
                   'prefer_good_with_cats', 'prefer_affectionate', 'prefer_needs_attention']:
            val = bool(val) if val is not None else False
        values.append(val)
    
    placeholders = ', '.join(['%s'] * len(col_names))
    col_str = ', '.join(f'"{c}"' for c in col_names)
    sql = f'INSERT INTO user_userprofile ({col_str}) VALUES ({placeholders})'
    try:
        pg_cursor.execute(sql, values)
    except:
        pass

pg_conn.commit()
print(f"✅ user_userprofile: {len(rows)} 条数据\n")

# 5. user_privatemessage -处理布尔值
print("导入 user_privatemessage...")
sqlite_cursor.execute('SELECT * FROM user_privatemessage')
rows = sqlite_cursor.fetchall()
pg_cursor.execute('DELETE FROM user_privatemessage')

col_names = [description[0] for description in sqlite_cursor.description]
for row in rows:
    values = []
    for col in col_names:
        val = row[col]
        if col in ['is_read', 'is_system']:
            val = bool(val) if val is not None else False
        values.append(val)
    
    placeholders = ', '.join(['%s'] * len(col_names))
    col_str = ', '.join(f'"{c}"' for c in col_names)
    sql = f'INSERT INTO user_privatemessage ({col_str}) VALUES ({placeholders})'
    try:
        pg_cursor.execute(sql, values)
    except:
        pass

pg_conn.commit()
print(f"✅ user_privatemessage: {len(rows)} 条数据\n")

# 6. user_notification - 处理布尔值
print("导入 user_notification...")
sqlite_cursor.execute('SELECT * FROM user_notification')
rows = sqlite_cursor.fetchall()
pg_cursor.execute('DELETE FROM user_notification')

col_names = [description[0] for description in sqlite_cursor.description]
for row in rows:
    values = []
    for col in col_names:
        val = row[col]
        if col in ['is_read']:
            val = bool(val) if val is not None else False
        values.append(val)
    
    placeholders = ', '.join(['%s'] * len(col_names))
    col_str = ', '.join(f'"{c}"' for c in col_names)
    sql = f'INSERT INTO user_notification ({col_str}) VALUES ({placeholders})'
    try:
        pg_cursor.execute(sql, values)
    except:
        pass

pg_conn.commit()
print(f"✅ user_notification: {len(rows)} 条数据\n")

# 重新启用约束
pg_cursor.execute("SET session_replication_role = 'origin'")
pg_conn.commit()

# 重置序列
print("🔄 重置序列...")
for table_name in ['auth_user', 'pet_pet', 'pet_shelter', 'user_userprofile',
                   'user_privatemessage', 'user_notification']:
    try:
        pg_cursor.execute(f'SELECT setval(seq, COALESCE(MAX(id), 0) + 1) FROM "{table_name}", '
                        f'"{table_name}_id_seq" seq')
        pg_conn.commit()
    except:
        pass

print("\n✅ 迁移完成！")

sqlite_cursor.close()
sqlite_conn.close()
pg_cursor.close()
pg_conn.close()
