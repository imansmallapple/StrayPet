from django.test import Client
import json
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

client = Client()

# Try to get the first article
response = client.get('/blog/article/1/', HTTP_HOST='localhost:8000')

print(f"Response status: {response.status_code}")

if response.status_code == 200:
    data = json.loads(response.content)
    
    # Get comments from the article data
    if 'comments' in data:
        comments = data['comments'][:2]
        for c in comments:
            print(f"Comment {c['id']}:")
            print(f"  User: {c['user']['username']}")
            print(f"  Avatar: {c['user'].get('avatar', 'NOT FOUND')}")
    else:
        print("No comments field in response")
        print("Response keys:", list(data.keys()))
else:
    print(f"Error: {response.status_code}")
    print(response.content.decode()[:500])
