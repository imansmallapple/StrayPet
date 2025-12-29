#!/usr/bin/env python
"""
测试脚本：测试好友申请和通知系统

使用方法：
1. 在Django容器中运行：docker-compose exec sp_web python test_friend_request.py
2. 或在Django shell中：python manage.py shell < test_friend_request.py
"""

import os
import sys
import django

# 添加Django项目到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import Friendship, Notification

# 清理测试数据
print("=" * 60)
print("清理之前的测试数据...")
print("=" * 60)

# 查找superadmin和frontend_user2
try:
    superadmin = User.objects.get(username='superadmin')
    print(f"✓ 找到用户: {superadmin.username} (ID: {superadmin.id})")
except User.DoesNotExist:
    print("✗ 找不到superadmin用户")
    exit(1)

try:
    frontend_user2 = User.objects.get(username='frontend_user2')
    print(f"✓ 找到用户: {frontend_user2.username} (ID: {frontend_user2.id})")
except User.DoesNotExist:
    print("✗ 找不到frontend_user2用户")
    exit(1)

# 删除之前的好友关系和通知
existing_friendship = Friendship.objects.filter(
    from_user=superadmin,
    to_user=frontend_user2
).first()

if existing_friendship:
    print(f"删除现有的好友关系: {existing_friendship}")
    # 删除相关的通知
    Notification.objects.filter(
        from_user=superadmin,
        user=frontend_user2,
        title__icontains='好友申请'
    ).delete()
    existing_friendship.delete()

print()
print("=" * 60)
print("创建新的好友申请...")
print("=" * 60)

# 创建好友申请
friendship = Friendship.objects.create(
    from_user=superadmin,
    to_user=frontend_user2,
    status='pending'
)
print(f"✓ 好友申请已创建: {friendship}")
print(f"  - from_user: {friendship.from_user.username}")
print(f"  - to_user: {friendship.to_user.username}")
print(f"  - status: {friendship.status}")
print(f"  - created_at: {friendship.created_at}")

print()
print("=" * 60)
print("检查是否生成了通知...")
print("=" * 60)

# 查询通知
notifications = Notification.objects.filter(
    user=frontend_user2,
    from_user=superadmin,
    notification_type='system'
)

print(f"找到 {notifications.count()} 条通知")
for notification in notifications:
    print(f"✓ 通知:")
    print(f"  - ID: {notification.id}")
    print(f"  - 标题: {notification.title}")
    print(f"  - 内容: {notification.content}")
    print(f"  - from_user: {notification.from_user.username if notification.from_user else 'None'}")
    print(f"  - 已读: {notification.is_read}")
    print(f"  - 创建时间: {notification.created_at}")

if notifications.count() == 0:
    print("✗ 没有找到通知！信号可能没有被触发")
    
    # 检查是否有其他包含'好友申请'的通知
    all_notifications = Notification.objects.filter(user=frontend_user2)
    print(f"\nfrontend_user2 的所有通知 ({all_notifications.count()}条):")
    for n in all_notifications[:5]:  # 只显示前5条
        print(f"  - {n.id}: {n.title} ({n.notification_type})")

print()
print("=" * 60)
print("通过API检查通知...")
print("=" * 60)

from apps.user.serializer import NotificationSerializer

# 序列化通知
for notification in Notification.objects.filter(user=frontend_user2).order_by('-created_at')[:5]:
    serializer = NotificationSerializer(notification)
    print(f"✓ 序列化的通知:")
    print(f"  {serializer.data}")

print()
print("=" * 60)
print("测试完成")
print("=" * 60)
