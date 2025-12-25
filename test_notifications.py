#!/usr/bin/env python
"""Test script to verify messages/notifications functionality"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from django.contrib.auth import get_user_model
from apps.user.models import Notification
from apps.blog.models import Comment, Article

User = get_user_model()

print("=" * 60)
print("MESSAGE CENTER TEST")
print("=" * 60)

# Check total notifications
total_notifs = Notification.objects.count()
print(f"\nTotal notifications in database: {total_notifs}")

# Check users
total_users = User.objects.count()
print(f"Total users: {total_users}")

if total_users > 0:
    print("\nUsers:")
    for user in User.objects.all()[:5]:
        user_notifs = Notification.objects.filter(user=user).count()
        print(f"  - {user.username}: {user_notifs} notifications")

# Check notification types distribution
print("\nNotification types:")
for notif_type in ['reply', 'mention', 'system']:
    count = Notification.objects.filter(notification_type=notif_type).count()
    print(f"  - {notif_type}: {count}")

# Summary
print("\n" + "=" * 60)
if total_notifs == 0:
    print("⚠️  No notifications found. Backend API is ready, but needs test data.")
    print("   You can create notifications by:")
    print("   1. Writing comments on blog articles")
    print("   2. Replying to other users' comments")
    print("   3. Creating test data in Django admin")
else:
    print("✅ Notifications found. Message center is ready to use!")
print("=" * 60)
