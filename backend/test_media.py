import requests
import os

# Test if media files are accessible
url = 'http://localhost:8000/media/avatars/2025/12/25/user4_avatar.png'
file_path = '/app/media/avatars/2025/12/25/user4_avatar.png'

print(f"File exists: {os.path.exists(file_path)}")
print(f"File size: {os.path.getsize(file_path) if os.path.exists(file_path) else 'N/A'}")

try:
    r = requests.get(url, timeout=5)
    print(f"URL Status: {r.status_code}")
    print(f"Content-Length: {len(r.content)} bytes")
    print(f"Content-Type: {r.headers.get('Content-Type')}")
except Exception as e:
    print(f"Error: {e}")
