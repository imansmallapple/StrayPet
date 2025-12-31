#!/usr/bin/env python
"""Test my_comments endpoint with avatar"""
import os, sys, django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

import requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User

user, _ = User.objects.get_or_create(username='testuser', defaults={'email': 'test@test.com'})
refresh = RefreshToken.for_user(user)
token = str(refresh.access_token)

headers = {'Authorization': f'Bearer {token}'}
resp = requests.get('http://localhost:8000/blog/my_comments/', headers=headers)
print('Status:', resp.status_code)
if resp.status_code == 200:
    data = resp.json()
    if data.get('results'):
        first = data['results'][0]
        print('User in comment:', first.get('user'))
    else:
        print('No comments found')
else:
    print('Error:', resp.text[:200])
