#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.holiday_family.models import HolidayFamilyApplication, HolidayFamilyPhoto

# 获取approved的应用
apps = HolidayFamilyApplication.objects.filter(status='approved')
for app in apps:
    print(f"User: {app.user.id} - {app.full_name}")
    photos = app.family_photos.all()
    print(f"  Photos count: {photos.count()}")
    for photo in photos:
        print(f"    - {photo.photo}")
    print()
