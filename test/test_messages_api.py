#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://localhost:8000'
TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3MTkwMTQ4LCJpYXQiOjE3NjcxODk4NDgsImp0aSI6IjhmZTEyNjMyNzMxNTQ0NTU4MzkwZTQyYjFkMmQ2ODc0IiwidXNlcl9pZCI6IjEifQ.XE3jUsyvyzH9Ffaw4ffsExwDhbxUy3GIrKCmc99w_BY'

print('=== 测试消息API ===')
try:
    headers = {'Authorization': f'Bearer {TOKEN}'}
    
    # 获取消息列表
    messages_response = requests.get(f'{BASE_URL}/user/messages/', headers=headers)
    
    if messages_response.status_code == 200:
        data = messages_response.json()
        print(f'✓ 消息API成功返回 (状态码: {messages_response.status_code})')
        print(f'  总数: {data.get("count", 0)}')
        print(f'  结果数: {len(data.get("results", []))}')
        if data.get('results'):
            print(f'\n  消息内容:')
            for msg in data['results'][:5]:
                print(f'    - ID: {msg["id"]}')
                print(f'      From: {msg["sender"]["username"]} ({msg["sender"]["id"]})')
                print(f'      To: {msg["recipient"]["username"]} ({msg["recipient"]["id"]})')
                print(f'      Content: {msg["content"]}')
                print(f'      Created: {msg["created_at"]}')
                print(f'      Read: {msg["is_read"]}')
                print()
        else:
            print('  暂无消息')
    else:
        print(f'✗ 消息API错误: {messages_response.status_code}')
        print(f'  {messages_response.text}')
        
except Exception as e:
    print(f'✗ 错误: {e}')
    import traceback
    traceback.print_exc()
