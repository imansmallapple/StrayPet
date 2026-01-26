import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, '/app')
django.setup()

from django.contrib.auth import get_user_model
from apps.holiday_family.models import HolidayFamilyApplication
from apps.user.models import Notification

User = get_user_model()

print("=== Admin Users ===")
admins = User.objects.filter(is_staff=True)
print(f"Total: {admins.count()}")
for admin in admins:
    print(f"- {admin.username} (is_staff={admin.is_staff}, is_superuser={admin.is_superuser})")

print("\n=== Holiday Family Applications ===")
apps = HolidayFamilyApplication.objects.all()
print(f"Total: {apps.count()}")
for app in apps:
    print(f"- {app.full_name} ({app.status})")

print("\n=== All Notification Types ===")
notif_types = Notification.objects.values_list('notification_type', flat=True).distinct()
for ntype in notif_types:
    count = Notification.objects.filter(notification_type=ntype).count()
    print(f"  {ntype}: {count}")

print("\n=== Holiday Family Notifications ===")
hf_notifs = Notification.objects.filter(notification_type='holiday_family_apply')
print(f"Total: {hf_notifs.count()}")
for notif in hf_notifs:
    print(f"- To: {notif.user.username}, From: {notif.from_user.username if notif.from_user else 'None'}")
    print(f"  Title: {notif.title}")

