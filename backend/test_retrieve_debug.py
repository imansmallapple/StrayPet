#!/usr/bin/env python
"""Debug API request to check serializer context"""
import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
django.setup()

# Simulate a request using Django's test client
from django.test import RequestFactory
from apps.pet.views import PetViewSet
from django.contrib.auth.models import AnonymousUser

factory = RequestFactory()

# Create a GET request like the API would receive
request = factory.get('/pet/16/')
request.user = AnonymousUser()

# Create the view and call retrieve directly
view = PetViewSet.as_view({'get': 'retrieve'})
response = view(request, pk=16)

print(f"Response status: {response.status_code}")
print(f"Response data:\n{json.dumps(response.data, indent=2, ensure_ascii=False, default=str)}")
