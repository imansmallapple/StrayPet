#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from django.core.cache import cache
import json

# Clear any existing code
cache.delete('alf138540fun1@gmail.com')

# Set a test code
test_code = 'IgYX'
cache.set('alf138540fun1@gmail.com', test_code, 60 * 5)

# Test registration with that code
client = Client()

print("Testing registration with email: alf138540fun1@gmail.com")
print(f"Test code in cache: {cache.get('alf138540fun1@gmail.com')}")

response = client.post(
    '/user/register/',
    {
        'username': 'testuser999',
        'email': 'alf138540fun1@gmail.com',
        'password': 'TestPass123!',
        'password1': 'TestPass123!',
        'code': 'IgYX'
    },
    content_type='application/json'
)

print(f"\nStatus: {response.status_code}")
print(f"Response: {response.json()}")
