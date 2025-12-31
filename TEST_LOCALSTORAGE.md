# 调试 localStorage 步骤

## 步骤1：打开浏览器开发者工具
1. 按 F12 打开开发者工具
2. 进入 Console 选项卡

## 步骤2：检查 localStorage 结构
在 Console 中执行以下命令：

```javascript
// 查看所有 localStorage
console.log('所有localStorage内容:')
console.log(localStorage)

// 查看具体的 user_info
console.log('user_info:', localStorage.getItem('user_info'))

// 解析并查看详细信息
const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
console.log('解析后的userInfo:', userInfo)
console.log('当前用户ID:', userInfo?.id)
```

## 步骤3：查看加载消息列表时的控制台日志
1. 打开消息中心页面
2. 在 Console 选项卡中查看下面这些日志：
   - "当前用户ID: XX"（应该显示正确的ID，比如 2）
   - 对于每条消息，应该看到 "消息: sender=X, recipient=Y, otherUserId=Z, currentUserId=XX"
   - 对于应该显示的用户，应该看到 "添加对话: username"

## 步骤4：预期结果
如果用户2登录：
- localStorage.getItem('user_info') 应该返回包含 `"id":2` 的 JSON 字符串
- 当前用户ID应该是：2
- 消息日志应该显示：
  - 如果是 "sender=1, recipient=2"，otherUserId应该是1，应该添加对话
  - 如果是 "sender=2, recipient=1"，otherUserId应该是1，应该添加对话（如果还没添加过）
  - 不应该出现 otherUserId=2 的情况

## 步骤5：问题排查
- 如果 "当前用户ID" 显示 undefined 或 null，说明 localStorage 中没有 user_info 或没有 id 字段
- 如果显示了 user2 对话，但控制台没有 "添加对话: user2" 的日志，说明过滤逻辑在工作
- 如果显示了 user2 对话且也有 "添加对话: user2" 的日志，说明过滤条件没有生效

## 步骤6：刷新并重试
如果有任何问题，尝试：
1. Ctrl+Shift+R 强制刷新（清除缓存）
2. 重新登录
3. 再次检查 localStorage 和控制台日志
