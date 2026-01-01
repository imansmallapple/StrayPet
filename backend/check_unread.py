import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import Notification

user2 = User.objects.get(username='suAdmin')

# Get all unread notifications for suAdmin
unread_notifications = Notification.objects.filter(
    user=user2,
    is_read=False
).order_by('-created_at')

print(f"Total unread notifications for {user2.username}: {unread_notifications.count()}")
print()

for idx, notif in enumerate(unread_notifications, 1):
    print(f"{idx}. ID: {notif.id}")
    print(f"   From: {notif.from_user.username if notif.from_user else 'System'}")
    print(f"   Type: {notif.notification_type}")
    print(f"   Title: {notif.title}")
    print(f"   Content: {notif.content}")
    print(f"   Friendship ID: {notif.friendship_id}")
    print(f"   Created: {notif.created_at}")
    print()
