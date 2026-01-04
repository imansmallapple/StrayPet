#!/usr/bin/env python3
import os
import sys
import django

sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User

print("=" * 60)
print("frontend_user5 Account Information")
print("=" * 60)

try:
    user = User.objects.get(username='frontend_user5')
    print(f"\n✓ User found!")
    print(f"   Username: {user.username}")
    print(f"   Email: {user.email}")
    print(f"   Is Active: {user.is_active}")
    print(f"\n⚠️  Note: Passwords are hashed and cannot be retrieved.")
    print(f"   Setting a new password for this user...\n")
    
    # Set a new password
    new_password = 'frontend_user5_pass123'
    user.set_password(new_password)
    user.save()
    
    print(f"✓ New Password Set:")
    print(f"   Username: frontend_user5")
    print(f"   Password: {new_password}")
    
except User.DoesNotExist:
    print(f"\n✗ User 'frontend_user5' not found in database")
    print(f"\nAll users in database:")
    for u in User.objects.all():
        print(f"  - {u.username}")

print("\n" + "=" * 60)
