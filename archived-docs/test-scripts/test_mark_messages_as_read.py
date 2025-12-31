#!/usr/bin/env python
"""Test marking all private messages as read endpoint"""
import os
import sys
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, str(Path(__file__).parent / 'backend'))
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from django.test.utils import override_settings
from rest_framework_simplejwt.tokens import RefreshToken
from apps.user.models import PrivateMessage

User = get_user_model()

def get_token_for_user(user):
    """Get access token for user"""
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

def test_mark_all_private_messages_as_read():
    """Test the mark_as_read endpoint for private messages"""
    
    # Get existing test users
    testuser = User.objects.get(username='alf138')
    sender = User.objects.get(username='alf1385')
    
    # Create some unread messages from sender to testuser
    for i in range(3):
        PrivateMessage.objects.create(
            sender=sender,
            recipient=testuser,
            content=f'Test message {i+1}',
            is_read=False
        )
    
    # Verify unread messages exist
    unread_before = PrivateMessage.objects.filter(
        sender=sender,
        recipient=testuser,
        is_read=False
    ).count()
    print(f"✓ Created {unread_before} unread messages")
    
    # Test the endpoint
    client = Client()
    token = get_token_for_user(testuser)
    
    response = client.post(
        '/user/messages/mark_as_read/',
        data={'recipient_id': sender.id},
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    
    print(f"✓ Response status: {response.status_code}")
    print(f"✓ Response data: {response.json()}")
    
    # Verify messages are marked as read
    unread_after = PrivateMessage.objects.filter(
        sender=sender,
        recipient=testuser,
        is_read=False
    ).count()
    
    if unread_after == 0:
        print(f"✅ SUCCESS! All {unread_before} messages marked as read")
        return True
    else:
        print(f"❌ FAILED! {unread_after} messages still unread")
        return False

if __name__ == '__main__':
    success = test_mark_all_private_messages_as_read()
    sys.exit(0 if success else 1)
