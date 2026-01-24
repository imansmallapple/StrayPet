#!/usr/bin/env python
"""
直接从 SQLite 复制数据到 PostgreSQL（改进版本：禁用约束）
"""
import os
import django
import sqlite3
import psycopg2
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

# SQLite 连接
sqlite_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
sqlite_conn = sqlite3.connect(sqlite_path)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cursor = sqlite_conn.cursor()

# PostgreSQL 连接
pg_conn = psycopg2.connect(
    host=os.environ.get('POSTGRES_HOST', 'localhost'),
    database=os.environ.get('POSTGRES_DB', 'straypet'),
    user=os.environ.get('POSTGRES_USER', 'sp_user'),
    password=os.environ.get('POSTGRES_PASSWORD', 'sp_pass'),
    port=os.environ.get('POSTGRES_PORT', '5432')
)
pg_cursor = pg_conn.cursor()

# 禁用约束
pg_cursor.execute("SET session_replication_role = 'replica'")
pg_conn.commit()

# 获取所有表
sqlite_cursor.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
)
tables = [row[0] for row in sqlite_cursor.fetchall()]
print(f"找到 {len(tables)} 个表")

# 表的导入顺序（解决外键约束）
order = [
    'django_migrations', 'django_content_type', 'auth_permission', 
    'auth_group', 'auth_user', 'auth_group_permissions', 'auth_user_groups',
    'auth_user_user_permissions', 'django_admin_log', 'django_session',
    'pet_country', 'pet_region', 'pet_city', 'pet_address', 'pet_shelter',
    'pet_pet', 'pet_petphoto', 'pet_petfavorite', 'pet_adoption', 
    'pet_donation', 'pet_donationphoto', 'pet_lost', 'pet_ticket',
    'blog_category', 'blog_tag', 'blog_article', 'blog_article_tags',
    'blog_favoritearticle', 'comment_comment', 'user_userprofile',
    'user_notification', 'user_privatemessage', 'user_friendship',
    'user_viewstatistics'
]

imported_tables = set()

# 按顺序导入
for table_name in order:
    if table_name not in tables:
        continue
        
    try:
        sqlite_cursor.execute(f'SELECT * FROM "{table_name}"')
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"⏭️  {table_name}: 无数据")
            imported_tables.add(table_name)
            continue
        
        # 获取列名
        columns = [description[0] for description in sqlite_cursor.description]
        column_str = ', '.join(f'"{col}"' for col in columns)
        values_str = ', '.join(['%s'] * len(columns))
        
        # 清空表
        pg_cursor.execute(f'DELETE FROM "{table_name}"')
        
        # 插入数据
        insert_sql = f'INSERT INTO "{table_name}" ({column_str}) VALUES ({values_str})'
        success_count = 0
        for row in rows:
            try:
                pg_cursor.execute(insert_sql, row)
                success_count += 1
            except Exception as e:
                # 继续，不中止
                pass
        
        print(f"✅ {table_name}: {success_count}/{len(rows)} 条数据")
        pg_conn.commit()
        imported_tables.add(table_name)
        
    except Exception as e:
        print(f"❌ {table_name}: {str(e)[:80]}")
        pg_conn.rollback()

# 导入剩余表
for table_name in tables:
    if table_name in imported_tables:
        continue
    try:
        sqlite_cursor.execute(f'SELECT * FROM "{table_name}"')
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            continue
        
        columns = [description[0] for description in sqlite_cursor.description]
        column_str = ', '.join(f'"{col}"' for col in columns)
        values_str = ', '.join(['%s'] * len(columns))
        
        pg_cursor.execute(f'DELETE FROM "{table_name}"')
        
        insert_sql = f'INSERT INTO "{table_name}" ({column_str}) VALUES ({values_str})'
        success_count = 0
        for row in rows:
            try:
                pg_cursor.execute(insert_sql, row)
                success_count += 1
            except:
                pass
        
        if success_count > 0:
            print(f"✅ {table_name}: {success_count}/{len(rows)} 条数据")
            pg_conn.commit()
    except:
        pass

# 重新启用约束
pg_cursor.execute("SET session_replication_role = 'origin'")

# 重置序列
print("\n🔄 重置序列...")
pg_cursor.execute("""
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
""")
for table_info in pg_cursor.fetchall():
    table_name = table_info[0]
    pg_cursor.execute(f"""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND column_default LIKE 'nextval%'
    """)
    for col_info in pg_cursor.fetchall():
        col_name = col_info[0]
        seq_name = f"{table_name}_{col_name}_seq"
        try:
            pg_cursor.execute(f"SELECT setval('{seq_name}', COALESCE(MAX(\"{col_name}\"), 0) + 1) FROM \"{table_name}\"")
            pg_conn.commit()
        except:
            pass

print("✅ 迁移完成！")

sqlite_cursor.close()
sqlite_conn.close()
pg_cursor.close()
pg_conn.close()
