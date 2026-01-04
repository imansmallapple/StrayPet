#!/usr/bin/env python3
import os
import sys
import django

sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User

print("=" * 60)
print("Django Admin Users (Staff/Superuser)")
print("=" * 60)

users = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
if users.exists():
    for u in users:
        print(f"\nUsername: {u.username}")
        print(f"  Email: {u.email}")
        print(f"  Is Staff: {u.is_staff}")
        print(f"  Is Superuser: {u.is_superuser}")
else:
    print("\n✗ No admin users found")
    print("\nAll users in database:")
    for u in User.objects.all():
        print(f"  - {u.username} (is_staff={u.is_staff}, is_superuser={u.is_superuser})")

print("\n" + "=" * 60)
