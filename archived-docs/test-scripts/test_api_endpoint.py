#!/usr/bin/env python
"""
测试通知 API 端点的脚本
"""

import requests
import json

# 获取 token 的函数（需要提供有效的登录凭据）
def test_notifications_api(token):
    """测试通知 API"""
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    url = 'http://localhost:8000/user/notifications/?page=1&page_size=10'
    
    print(f"🔗 测试 URL: {url}")
    print(f"📨 Request Headers: {headers}")
    print()
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        
        print(f"✅ Status Code: {response.status_code}")
        print(f"📝 Response Headers: {dict(response.headers)}")
        print()
        
        if response.status_code in (200, 201):
            data = response.json()
            print(f"✅ 成功! 响应数据:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"❌ 错误! 响应内容:")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器。请确保 Django 开发服务器正在运行")
    except Exception as e:
        print(f"❌ 发生错误: {e}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("使用方法: python test_api_endpoint.py <jwt_token>")
        print()
        print("示例:")
        print("  python test_api_endpoint.py 'eyJ0eXAiOiJKV1QiLCJhbGc...'")
        print()
        print("说明:")
        print("  1. 在浏览器中登录应用")
        print("  2. 打开开发者工具 (F12)")
        print("  3. 在 Console 中执行: localStorage.getItem('accessToken')")
        print("  4. 复制输出的 token 并粘贴到这里")
        sys.exit(1)
    
    token = sys.argv[1]
    test_notifications_api(token)
