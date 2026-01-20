import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import Notification

user2 = User.objects.get(username='suAdmin')

# Get all friend request notifications for suAdmin
user2_notifications = Notification.objects.filter(
    user=user2,
    notification_type='friend_request'
).order_by('-created_at')

print(f"Total friend request notifications for {user2.username}: {user2_notifications.count()}")
print()

for idx, notif in enumerate(user2_notifications, 1):
    print(f"{idx}. ID: {notif.id}")
    print(f"   From: {notif.from_user.username}")
    print(f"   Type: {notif.notification_type}")
    print(f"   Title: {notif.title}")
    print(f"   Friendship ID: {notif.friendship_id}")
    print(f"   Created: {notif.created_at}")
    print()

# Keep only the most recent one
if user2_notifications.count() > 1:
    notifications_to_delete = user2_notifications[1:]  # All except the first (most recent)
    delete_count = notifications_to_delete.count()
    notifications_to_delete.delete()
    print(f"✓ Deleted {delete_count} duplicate notification(s)")
    print(f"✓ Kept 1 latest notification")
else:
    print("✓ No duplicates found")
