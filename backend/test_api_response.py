import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import Notification
from apps.user.serializer import NotificationSerializer
from rest_framework.test import APIRequestFactory

# Create a request object
factory = APIRequestFactory()
request = factory.get('/user/notifications/unread/')

user2 = User.objects.get(username='suAdmin')
request.user = user2

# Get unread notifications
unread_notifications = Notification.objects.filter(
    user=user2,
    is_read=False
).order_by('-created_at')

# Serialize them
serializer = NotificationSerializer(unread_notifications, many=True, context={'request': request})

print(f"API Response for /user/notifications/unread/:")
print(f"Total notifications: {len(serializer.data)}")
print()

import json
print(json.dumps(serializer.data, indent=2, ensure_ascii=False))
