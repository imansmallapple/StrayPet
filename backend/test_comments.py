from django.test import Client
import json
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

client = Client()
response = client.get('/blog/articles/1/comments/', HTTP_HOST='localhost:8000')

if response.status_code == 200:
    data = json.loads(response.content)
    if isinstance(data, dict) and 'results' in data:
        comments = data['results'][:2]
    else:
        comments = data[:2]
    
    for c in comments:
        print(f"Comment {c['id']}:")
        print(f"  User: {c['user']['username']}")
        print(f"  Avatar: {c['user'].get('avatar', 'NOT FOUND')}")
else:
    print(f'Error: {response.status_code}')
