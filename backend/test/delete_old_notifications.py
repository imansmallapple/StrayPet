import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import Notification

user2 = User.objects.get(username='suAdmin')

# Delete the system type notifications (the old ones)
old_notifications = Notification.objects.filter(
    user=user2,
    notification_type='system'
)

print(f"Found {old_notifications.count()} old 'system' type notifications")
delete_count = old_notifications.count()
old_notifications.delete()
print(f"✓ Deleted {delete_count} old notification(s)")

# Verify
remaining = Notification.objects.filter(user=user2, is_read=False)
print(f"\n✓ Remaining unread notifications: {remaining.count()}")
for notif in remaining:
    print(f"  - {notif.get_notification_type_display()}: {notif.title}")
