#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.models import UserProfile
from django.db import connection

# Check raw data in userprofile table
print("Checking UserProfile table directly:")
with connection.cursor() as cursor:
    cursor.execute("SELECT id, user_id FROM user_userprofile;")
    rows = cursor.fetchall()
    for row in rows:
        print(f"  profile_id={row[0]}, user_id={row[1]}")

print("\nChecking User table:")
with connection.cursor() as cursor:
    cursor.execute("SELECT id, username FROM auth_user;")
    rows = cursor.fetchall()
    for row in rows:
        print(f"  user_id={row[0]}, username={row[1]}")

# Now check which users have associated profiles
print("\nUser-Profile mapping:")
users = User.objects.all()
for user in users:
    profile = UserProfile.objects.filter(user_id=user.id).first()
    print(f"  {user.username} (id={user.id}): profile={profile}")

# Create missing profiles for users without them
print("\nCreating missing profiles...")
for user in users:
    profile = UserProfile.objects.filter(user_id=user.id).first()
    if not profile:
        UserProfile.objects.create(user=user)
        print(f"  Created profile for {user.username}")
    else:
        print(f"  {user.username} already has profile")

print("\nDone!")



