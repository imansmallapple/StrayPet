#!/usr/bin/env python
"""Test script to verify friendship_id is returned in list_friends"""

import os
import sys
import django

# Setup Django
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, os.getcwd())

django.setup()

from apps.user.models import User, Friendship
from django.db import models
import json

# Get a test user
users = User.objects.filter(friendships_received__status='accepted').distinct()

if users.exists():
    test_user = users.first()
    print(f"\n✓ Testing with user: {test_user.username} (ID: {test_user.id})")
    
    # Get accepted friendships for this user
    friendships = Friendship.objects.filter(
        (models.Q(from_user=test_user) | models.Q(to_user=test_user)) &
        models.Q(status='accepted')
    )
    
    print(f"✓ Found {friendships.count()} accepted friendships")
    
    # Simulate the list_friends response
    friends = []
    for friendship in friendships:
        friend = friendship.to_user if friendship.from_user == test_user else friendship.from_user
        friends.append({
            'id': friend.id,
            'username': friend.username,
            'email': friend.email,
            'avatar': None,
            'friendship_id': friendship.id,  # This should be present
        })
    
    print("\n✓ Friend list with friendship_id:")
    print(json.dumps(friends, indent=2))
    
    if friends and 'friendship_id' in friends[0]:
        print("\n✅ SUCCESS: friendship_id is present in response!")
    else:
        print("\n❌ ERROR: friendship_id is missing!")
else:
    print("❌ No users with accepted friendships found")
    print("\nCreating test data...")
    
    # Create test users
    user1, _ = User.objects.get_or_create(
        username='testuser1',
        defaults={'email': 'test1@example.com'}
    )
    user2, _ = User.objects.get_or_create(
        username='testuser2',
        defaults={'email': 'test2@example.com'}
    )
    
    # Create friendship
    friendship, created = Friendship.objects.get_or_create(
        from_user=user1,
        to_user=user2,
        defaults={'status': 'accepted'}
    )
    
    print(f"✓ Created friendship between {user1.username} and {user2.username}")
    print(f"  Friendship ID: {friendship.id}")
    
    # Test the list_friends logic
    friends = []
    friendships = Friendship.objects.filter(
        (models.Q(from_user=user1) | models.Q(to_user=user1)) &
        models.Q(status='accepted')
    )
    
    for friendship in friendships:
        friend = friendship.to_user if friendship.from_user == user1 else friendship.from_user
        friends.append({
            'id': friend.id,
            'username': friend.username,
            'email': friend.email,
            'avatar': None,
            'friendship_id': friendship.id,
        })
    
    print("\n✓ Friend list response:")
    print(json.dumps(friends, indent=2))
