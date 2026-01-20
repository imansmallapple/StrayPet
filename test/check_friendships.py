#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import Friendship

# 列出所有好友关系
print("=" * 60)
print("所有好友关系：")
print("=" * 60)

friendships = Friendship.objects.all()
for friendship in friendships:
    print(f"ID: {friendship.id}")
    print(f"  From: {friendship.from_user.username} (ID: {friendship.from_user.id})")
    print(f"  To: {friendship.to_user.username} (ID: {friendship.to_user.id})")
    print(f"  Status: {friendship.status}")
    print(f"  Created: {friendship.created_at}")
    print()

# 检查特定用户的好友
print("=" * 60)
print("检查当前用户的好友关系：")
print("=" * 60)

try:
    user = User.objects.get(username='u4')
    print(f"\n用户: {user.username} (ID: {user.id})")
    
    # 作为from_user的关系
    from_friendships = Friendship.objects.filter(from_user=user)
    print(f"\n作为发送者的好友申请 ({from_friendships.count()}个):")
    for f in from_friendships:
        print(f"  -> {f.to_user.username} (status: {f.status})")
    
    # 作为to_user的关系
    to_friendships = Friendship.objects.filter(to_user=user)
    print(f"\n作为接收者的好友申请 ({to_friendships.count()}个):")
    for f in to_friendships:
        print(f"  <- {f.from_user.username} (status: {f.status})")
    
    # 已接受的好友
    accepted = Friendship.objects.filter(
        Q(from_user=user) | Q(to_user=user),
        status='accepted'
    )
    print(f"\n已接受的好友 ({accepted.count()}个):")
    for f in accepted:
        friend = f.to_user if f.from_user == user else f.from_user
        print(f"  • {friend.username} (friendship_id: {f.id})")
    
except User.DoesNotExist:
    print("用户 u4 不存在")

from django.db.models import Q
