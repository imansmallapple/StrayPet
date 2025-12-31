import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import Notification

# Check all notifications for frontend_user2
frontend_user2 = User.objects.get(username='frontend_user2')
notifications = Notification.objects.filter(user=frontend_user2).order_by('-created_at')[:10]

print(f'Total notifications for frontend_user2: {Notification.objects.filter(user=frontend_user2).count()}')
print()
for notif in notifications:
    print(f'ID: {notif.id}')
    print(f'  Type: {notif.notification_type}')
    print(f'  Title: {notif.title}')
    print(f'  From: {notif.from_user.username if notif.from_user else "None"}')
    print(f'  Is Read: {notif.is_read}')
    print(f'  Created: {notif.created_at}')
    print()
