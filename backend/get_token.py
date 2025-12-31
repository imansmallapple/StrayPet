#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User

user = User.objects.get(username='testuser')
token = AccessToken.for_user(user)
print(str(token))
