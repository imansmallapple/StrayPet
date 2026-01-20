#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://localhost:8000'
TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3MTkwMTQ4LCJpYXQiOjE3NjcxODk4NDgsImp0aSI6IjhmZTEyNjMyNzMxNTQ0NTU4MzkwZTQyYjFkMmQ2ODc0IiwidXNlcl9pZCI6IjEifQ.XE3jUsyvyzH9Ffaw4ffsExwDhbxUy3GIrKCmc99w_BY'

print('=== 测试消息API头像URL ===')
try:
    headers = {'Authorization': f'Bearer {TOKEN}'}
    
    # 获取消息列表
    messages_response = requests.get(f'{BASE_URL}/user/messages/', headers=headers)
    
    if messages_response.status_code == 200:
        data = messages_response.json()
        print(f'✓ 消息API成功返回 (状态码: {messages_response.status_code})')
        if data.get('results'):
            print(f'\n消息发送者信息:')
            for msg in data['results'][:1]:
                print(f'  - 发送者: {msg["sender"]["username"]}')
                print(f'    头像URL: {msg["sender"]["avatar"]}')
                print(f'    是绝对路径: {msg["sender"]["avatar"].startswith("http") if msg["sender"]["avatar"] else "N/A"}')
                print(f'\n  - 接收者: {msg["recipient"]["username"]}')
                print(f'    头像URL: {msg["recipient"]["avatar"]}')
                print(f'    是绝对路径: {msg["recipient"]["avatar"].startswith("http") if msg["recipient"]["avatar"] else "N/A"}')
        else:
            print('暂无消息')
    else:
        print(f'✗ 消息API错误: {messages_response.status_code}')
        print(f'  {messages_response.text}')
        
except Exception as e:
    print(f'✗ 错误: {e}')
    import traceback
    traceback.print_exc()
