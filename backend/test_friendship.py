"""
Test script to verify friend request notification functionality
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import Friendship, Notification

# Get test users
try:
    # Try to get frontend_user5 and suAdmin
    user1 = User.objects.get(username='frontend_user5')
    user2 = User.objects.get(username='suAdmin')
    
    print(f"✓ Found user1: {user1.username} (id: {user1.id})")
    print(f"✓ Found user2: {user2.username} (id: {user2.id})")
    
    # Check if friendship exists
    existing_friendship = Friendship.objects.filter(
        from_user=user1, to_user=user2
    ).first()
    
    if existing_friendship:
        print(f"\n✓ Existing friendship found: status={existing_friendship.status}")
    else:
        print(f"\n✗ No existing friendship found")
    
    # List all friendships for these users
    user1_friendships = Friendship.objects.filter(from_user=user1)
    user2_friendships = Friendship.objects.filter(to_user=user2)
    
    print(f"\nFriendships initiated by {user1.username}: {user1_friendships.count()}")
    print(f"Friendship requests received by {user2.username}: {user2_friendships.count()}")
    
    # Check for friend request notifications
    user2_notifications = Notification.objects.filter(
        user=user2,
        notification_type='friend_request'
    )
    
    print(f"\nFriend request notifications for {user2.username}: {user2_notifications.count()}")
    for notif in user2_notifications:
        print(f"  - From {notif.from_user.username}: {notif.title} (friendship_id: {notif.friendship_id})")
        
except User.DoesNotExist as e:
    print(f"✗ User not found: {e}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
