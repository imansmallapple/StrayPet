#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.user.models import User, PrivateMessage

print('=== 数据库检查 ===')
print(f'用户总数: {User.objects.count()}')
print(f'消息总数: {PrivateMessage.objects.count()}')

# 获取所有消息
messages = PrivateMessage.objects.all().order_by('-created_at')[:5]
print(f'\n最近5条消息:')
for msg in messages:
    print(f'  From {msg.sender.username} to {msg.recipient.username}: {msg.content[:30]}...')

# 检查友谊关系
from apps.user.models import Friendship
print(f'\n友谊关系总数: {Friendship.objects.count()}')
print(f'已接受的友谊: {Friendship.objects.filter(status="accepted").count()}')
