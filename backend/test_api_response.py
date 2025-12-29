import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import Client
import json

# Get the test client
client = Client()

# Get frontend_user2 JWT token (we'll need to login first)
frontend_user2 = User.objects.get(username='frontend_user2')

# We need to get the token by logging in or checking the database
# For now, let's check what the API would return using the viewset

from apps.user.views import NotificationViewSet
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.authentication import JWTAuthentication

factory = APIRequestFactory()
request = factory.get('/user/notifications/')
request.user = frontend_user2

# Create view instance
view = NotificationViewSet.as_view({'get': 'list'})

# Make the request
response = view(request)

print(f"Response Status: {response.status_code}")
print(f"Response Data: {json.dumps(response.data, indent=2, default=str)}")
