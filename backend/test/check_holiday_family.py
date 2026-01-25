#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.holiday_family.models import HolidayFamilyApplication
from apps.user.models import Notification

print("=== Holiday Family Applications ===")
apps = HolidayFamilyApplication.objects.all()
print(f"Total: {apps.count()}")
for app in apps:
    print(f"- {app.full_name} ({app.status}) - Created: {app.created_at}")

print("\n=== Notifications ===")
notifs = Notification.objects.all()
print(f"Total: {notifs.count()}")
print("\nBy Type:")
for ntype in notifs.values('notification_type').distinct():
    count = Notification.objects.filter(notification_type=ntype['notification_type']).count()
    print(f"  {ntype['notification_type']}: {count}")

print("\n=== Holiday Family Notifications ===")
hf_notifs = Notification.objects.filter(notification_type='holiday_family_apply')
print(f"Total: {hf_notifs.count()}")
for notif in hf_notifs:
    print(f"- To: {notif.user.username}, Title: {notif.title}")
