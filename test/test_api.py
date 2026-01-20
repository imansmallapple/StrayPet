#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://localhost:8000'

# 测试登录
print('=== 测试消息API ===')
try:
    # 获取令牌
    login_response = requests.post(f'{BASE_URL}/user/token/', json={
        'username': 'testuser',
        'password': '123456'
    })
    
    if login_response.status_code == 200:
        token = login_response.json()['access']
        print(f'✓ 登录成功, Token: {token[:30]}...')
        
        # 获取消息列表
        headers = {'Authorization': f'Bearer {token}'}
        messages_response = requests.get(f'{BASE_URL}/user/messages/', headers=headers)
        
        if messages_response.status_code == 200:
            data = messages_response.json()
            print(f'\n✓ 消息API成功返回')
            print(f'  消息总数: {len(data.get("results", []))}')
            if data.get('results'):
                print(f'  最近消息样本:')
                for msg in data['results'][:2]:
                    print(f'    - {msg["sender"]["username"]} -> {msg["recipient"]["username"]}: {msg["content"][:40]}')
            else:
                print('  暂无消息')
        else:
            print(f'✗ 消息API错误: {messages_response.status_code}')
            print(f'  {messages_response.text}')
    else:
        print(f'✗ 登录失败: {login_response.status_code}')
        print(f'  {login_response.text}')
        
except Exception as e:
    print(f'✗ 错误: {e}')
