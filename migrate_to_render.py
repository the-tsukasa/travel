#!/usr/bin/env python3
"""
数据库迁移脚本：从本地 MySQL/MariaDB 迁移到 Render PostgreSQL
数据量：约 174 条记录，0.39 MB
"""

import mysql.connector
import psycopg2
from datetime import datetime
import sys

# 本地 MySQL 连接配置
MYSQL_CONFIG = {
    'host': 'localhost',
    'database': 'travel_db',
    'user': 'root',
    'password': '1234'
}

# Render PostgreSQL 连接配置
PG_CONFIG = {
    'host': 'dpg-d52l21d6ubrc73a0o1o0-a.singapore-postgres.render.com',
    'database': 'travel_db_uxr3',
    'user': 'travel_user',
    'password': 'bOCLTK0bSB5q5bfyYUG2ZfWTg7NEXJg1',
    'sslmode': 'require'
}

def connect_databases():
    """连接两个数据库"""
    try:
        mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
        print("✅ 已连接到本地 MySQL 数据库")
    except Exception as e:
        print(f"❌ MySQL 连接失败: {e}")
        sys.exit(1)
    
    try:
        pg_conn = psycopg2.connect(**PG_CONFIG)
        print("✅ 已连接到 Render PostgreSQL 数据库")
    except Exception as e:
        print(f"❌ PostgreSQL 连接失败: {e}")
        mysql_conn.close()
        sys.exit(1)
    
    return mysql_conn, pg_conn

def migrate_users(mysql_cursor, pg_cursor):
    """迁移用户表"""
    print("\n📦 迁移 users 表...")
    mysql_cursor.execute("SELECT * FROM users ORDER BY id")
    users = mysql_cursor.fetchall()
    
    count = 0
    for user in users:
        try:
            pg_cursor.execute("""
                INSERT INTO users (id, username, password, email, role, first_name, last_name,
                                  location, avatar_url, bio, address, birthday, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    username = EXCLUDED.username,
                    email = EXCLUDED.email,
                    role = EXCLUDED.role
            """, (
                user['id'], user['username'], user['password'], user['email'],
                user.get('role', 'USER'), user.get('first_name'), user.get('last_name'),
                user.get('location'), user.get('avatar_url'), user.get('bio'),
                user.get('address'), user.get('birthday'), user.get('created_at')
            ))
            count += 1
        except Exception as e:
            print(f"  ⚠️ 跳过用户 {user.get('id', 'N/A')} ({user.get('username', 'N/A')}): {e}")
            # 继续处理下一条记录
    
    print(f"  ✅ 已迁移 {count}/{len(users)} 个用户")

def migrate_spots(mysql_cursor, pg_cursor):
    """迁移景点表"""
    print("\n📦 迁移 spots 表...")
    mysql_cursor.execute("SELECT * FROM spots ORDER BY id")
    spots = mysql_cursor.fetchall()
    
    count = 0
    for spot in spots:
        try:
            # 只迁移实体类中定义的列：id, name, description, location, image_url, likes, favorites, created_at
            pg_cursor.execute("""
                INSERT INTO spots (id, name, description, location, image_url, likes, favorites, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    location = EXCLUDED.location,
                    image_url = EXCLUDED.image_url
            """, (
                spot['id'], spot['name'], spot.get('description'), spot.get('location'),
                spot.get('image_url'), spot.get('likes', 0), spot.get('favorites', 0),
                spot.get('created_at')
            ))
            count += 1
        except Exception as e:
            print(f"  ⚠️ 跳过景点 {spot['id']} ({spot.get('name', 'N/A')}): {e}")
            # 继续处理下一条，不中断事务
    
    print(f"  ✅ 已迁移 {count}/{len(spots)} 个景点")

def migrate_notes(mysql_cursor, pg_cursor):
    """迁移笔记表"""
    print("\n📦 迁移 notes 表...")
    mysql_cursor.execute("SELECT * FROM notes ORDER BY id")
    notes = mysql_cursor.fetchall()
    
    count = 0
    for note in notes:
        try:
            # 确保 image_url 不超过 255 字符（如果数据库有长度限制）
            image_url = note.get('image_url')
            if image_url and len(image_url) > 255:
                image_url = image_url[:255]
                print(f"  ⚠️ 笔记 {note.get('id', 'N/A')} 的 image_url 过长，已截断")
            
            # MySQL 中 is_approved 可能是 0/1 (integer)，需要转换为 boolean
            is_approved = note.get('is_approved', False)
            if isinstance(is_approved, int):
                is_approved = bool(is_approved)
            elif isinstance(is_approved, str):
                is_approved = is_approved.lower() in ('true', '1', 'yes')
            
            pg_cursor.execute("""
                INSERT INTO notes (id, user_id, title, content, location, image_url,
                                  status, is_approved, submitted_at, reviewed_at, reviewed_by,
                                  reject_reason, likes_count, favorites_count, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    content = EXCLUDED.content
            """, (
                note['id'], note['user_id'], note['title'], note.get('content'),
                note.get('location'), image_url, note.get('status', 'DRAFT'),
                is_approved, note.get('submitted_at'), note.get('reviewed_at'),
                note.get('reviewed_by'), note.get('reject_reason'), note.get('likes_count', 0),
                note.get('favorites_count', 0), note.get('created_at'), note.get('updated_at')
            ))
            count += 1
        except Exception as e:
            print(f"  ⚠️ 跳过笔记 {note.get('id', 'N/A')} ({note.get('title', 'N/A')}): {e}")
            # 继续处理下一条记录
    
    print(f"  ✅ 已迁移 {count}/{len(notes)} 条笔记")

def migrate_likes(mysql_cursor, pg_cursor):
    """迁移点赞表"""
    print("\n📦 迁移 likes 表...")
    mysql_cursor.execute("SELECT * FROM likes ORDER BY id")
    likes = mysql_cursor.fetchall()
    
    count = 0
    for like in likes:
        try:
            pg_cursor.execute("""
                INSERT INTO likes (id, user_id, notes_id, created_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                like['id'], like['user_id'], like['notes_id'], like.get('created_at')
            ))
            count += 1
        except Exception as e:
            print(f"  ⚠️ 跳过点赞 {like.get('id', 'N/A')}: {e}")
            # 继续处理下一条记录
    
    print(f"  ✅ 已迁移 {count}/{len(likes)} 条点赞记录")

def migrate_favorites(mysql_cursor, pg_cursor):
    """迁移收藏表"""
    print("\n📦 迁移 favorites 表...")
    mysql_cursor.execute("SELECT * FROM favorites ORDER BY id")
    favorites = mysql_cursor.fetchall()
    
    count = 0
    for fav in favorites:
        try:
            pg_cursor.execute("""
                INSERT INTO favorites (id, user_id, notes_id, created_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                fav['id'], fav['user_id'], fav['notes_id'], fav.get('created_at')
            ))
            count += 1
        except Exception as e:
            print(f"  ⚠️ 跳过收藏 {fav.get('id', 'N/A')}: {e}")
            # 继续处理下一条记录
    
    print(f"  ✅ 已迁移 {count}/{len(favorites)} 条收藏记录")

def migrate_notifications(mysql_cursor, pg_cursor):
    """迁移通知表"""
    print("\n📦 迁移 notifications 表...")
    mysql_cursor.execute("SELECT * FROM notifications ORDER BY id")
    notifications = mysql_cursor.fetchall()
    
    count = 0
    for notif in notifications:
        try:
            # MySQL 中 is_read 可能是 0/1 (integer)，需要转换为 boolean
            is_read = notif.get('is_read', False)
            if isinstance(is_read, int):
                is_read = bool(is_read)
            elif isinstance(is_read, str):
                is_read = is_read.lower() in ('true', '1', 'yes')
            
            pg_cursor.execute("""
                INSERT INTO notifications (id, user_id, type, title, content, related_id,
                                          is_read, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                notif['id'], notif['user_id'], notif['type'], notif['title'],
                notif.get('content'), notif.get('related_id'), is_read,
                notif.get('created_at')
            ))
            count += 1
        except Exception as e:
            print(f"  ⚠️ 跳过通知 {notif.get('id', 'N/A')}: {e}")
            # 继续处理下一条记录
    
    print(f"  ✅ 已迁移 {count}/{len(notifications)} 条通知")

def main():
    """主函数"""
    print("=" * 50)
    print("🚀 开始数据库迁移")
    print("=" * 50)
    print(f"📅 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 预计迁移: ~174 条记录")
    print("=" * 50)
    
    # 连接数据库
    mysql_conn, pg_conn = connect_databases()
    mysql_cursor = mysql_conn.cursor(dictionary=True)
    pg_cursor = pg_conn.cursor()
    
    # 设置自动提交为 False，但每个表迁移后单独提交
    pg_conn.autocommit = False
    
    migration_functions = [
        ("users", migrate_users),
        ("spots", migrate_spots),
        ("notes", migrate_notes),
        ("likes", migrate_likes),
        ("favorites", migrate_favorites),
        ("notifications", migrate_notifications),
    ]
    
    success_count = 0
    failed_tables = []
    
    for table_name, migrate_func in migration_functions:
        try:
            # 开始新的事务
            pg_conn.rollback()  # 确保从干净状态开始
            migrate_func(mysql_cursor, pg_cursor)
            # 每个表迁移后立即提交
            pg_conn.commit()
            success_count += 1
        except Exception as e:
            print(f"\n❌ 表 {table_name} 迁移失败: {e}")
            pg_conn.rollback()  # 回滚当前表的错误
            failed_tables.append(table_name)
            # 继续迁移其他表
    
    print("\n" + "=" * 50)
    if success_count == len(migration_functions):
        print("✅ 所有表迁移完成！")
    else:
        print(f"⚠️ 迁移部分完成：{success_count}/{len(migration_functions)} 个表成功")
        if failed_tables:
            print(f"❌ 失败的表: {', '.join(failed_tables)}")
    print("=" * 50)
    
    mysql_cursor.close()
    pg_cursor.close()
    mysql_conn.close()
    pg_conn.close()
    print("\n🔌 数据库连接已关闭")

if __name__ == '__main__':
    main()

