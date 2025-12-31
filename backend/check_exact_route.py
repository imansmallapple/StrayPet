import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.urls import resolve

# 检查路由
try:
    match = resolve('/user/notifications/')
    print(f"路由匹配成功:")
    print(f"  回调: {match.callback}")
    print(f"  名称: {match.url_name}")
    
    # 检查回调是否是 APIView
    if hasattr(match.callback, 'cls'):
        print(f"  这是一个 APIView: {match.callback.cls}")
    elif hasattr(match.callback, '__self__'):
        print(f"  这是一个绑定方法")
    else:
        print(f"  这是一个普通函数")
        
except Exception as e:
    print(f"路由匹配失败: {e}")

# 也检查 /user/notifications 不带末尾斜杠
print("\n" + "="*60)
try:
    match = resolve('/user/notifications')
    print(f"/user/notifications (无末尾斜杠) 匹配:")
    print(f"  回调: {match.callback}")
except Exception as e:
    print(f"/user/notifications 不匹配: {e}")
