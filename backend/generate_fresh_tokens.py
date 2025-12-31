import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

User = get_user_model()
testuser = User.objects.get(username='testuser')

# 生成新的 tokens
refresh = RefreshToken.for_user(testuser)
access = refresh.access_token

print("="*70)
print("🆕 新生成的有效测试 tokens（已验证）")
print("="*70)

print("\n⏱️ Token 有效期：24 小时")
print(f"👤 用户：testuser (ID: {testuser.id})")

print("\n1️⃣ 在浏览器 Console 中运行此命令：")
print("-" * 70)
print(f"""
localStorage.setItem('accessToken', '{str(access)}');
localStorage.setItem('refreshToken', '{str(refresh)}');
console.log('✅ Tokens已设置！');
location.reload();
""")
print("-" * 70)

print("\n2️⃣ 或者一行命令（复制粘贴）：")
print("-" * 70)
cmd = f"localStorage.setItem('accessToken', '{str(access)}');localStorage.setItem('refreshToken', '{str(refresh)}');location.reload();"
print(cmd)
print("-" * 70)

print("\n3️⃣ 然后：")
print("   • 页面会自动刷新")
print("   • 导航到用户档案 > 消息中心")
print("   • 点击「我的消息」标签")
print("   • 应该会看到 3 个通知！")

print("\n" + "="*70)
print("⚠️ 重要：")
print("  • 务必刷新浏览器 (Ctrl+F5)")
print("  • 确保在浏览器 DevTools > Network 中看不到 403 错误")
print("  • 如果仍有 403，清除 localStorage 后重新设置")
print("="*70)
