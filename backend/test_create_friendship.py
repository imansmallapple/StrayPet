import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import Friendship, Notification

user1 = User.objects.get(username='frontend_user5')
user2 = User.objects.get(username='suAdmin')

# Delete existing friendship and notifications
Friendship.objects.filter(from_user=user1, to_user=user2).delete()
Notification.objects.filter(user=user2, from_user=user1, notification_type='friend_request').delete()

print("✓ Cleaned up existing friendship and notifications")

# Now create a new friendship via the API-like approach
friendship = Friendship.objects.create(
    from_user=user1,
    to_user=user2,
    status='pending'
)

# Create notification (this should happen in the view, but let's test it here)
notification = Notification.objects.create(
    user=user2,
    notification_type='friend_request',
    from_user=user1,
    friendship=friendship,
    title=f'{user1.username} 发送了好友申请',
    content=f'{user1.username} 想要加你为好友'
)

print(f"✓ Created new friendship (id: {friendship.id})")
print(f"✓ Created new notification (id: {notification.id})")
print(f"  - To user: {notification.user.username}")
print(f"  - From user: {notification.from_user.username}")
print(f"  - Type: {notification.notification_type}")
print(f"  - Friendship ID: {notification.friendship_id}")

# Verify
user2_notifications = Notification.objects.filter(user=user2, notification_type='friend_request')
print(f"\n✓ Total friend request notifications for {user2.username}: {user2_notifications.count()}")
