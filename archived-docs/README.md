# Archived Documentation and Tests

This directory contains all historical test scripts, debug utilities, and implementation documentation organized by category.

## Directory Structure

### 📄 `/test-scripts`
测试脚本集合，包括各个功能模块的API测试和集成测试

**子分类：**
- **用户认证相关** (`test_*user*, test_*token*, get_token.py`)
  - API认证测试
  - Token生成和验证
  - 用户信息查询

- **头像功能** (`test_avatar_*.py, generate_missing_avatars.py`)
  - 头像上传测试
  - 头像API调试
  - 默认头像生成

- **内容管理** (`test_article.py, test_blog_*.py, test_hashtag.py`)
  - 博客文章测试
  - 评论系统测试
  - 哈希标签功能

- **社交功能** (`test_friend_request.py, test_replies_*.py`)
  - 好友请求测试
  - 评论回复测试
  - 媒体处理

- **通知和消息** (`test_notifications.py, test_mark_messages_as_read.py`)
  - 通知推送测试
  - 私信标记已读测试

- **基础API测试** (`test_api_*.py, test_with_django_client.py`)
  - 通用API端点测试
  - Django Client集成测试

### 🔧 `/debug-scripts`
调试和诊断脚本，用于问题排查和系统检查

**内容：**
- `check_*.py` - 系统检查脚本（路由、通知、用户）
- `diagnose_*.py` - 问题诊断脚本
- `notification_debug_guide.py` - 通知系统调试指南
- `NOTIFICATION_FIX_COMPLETE.py` - 通知系统修复总结

### 📚 `/implementation-docs`
功能实现的详细文档和快速启动指南

**功能模块：**
- **头像系统** (`AVATAR_*.md`)
  - 功能变更总结
  - 实现指南
  - 快速启动

- **博客系统** (`BLOG_*.md`)
  - 作者头像集成
  - 哈希标签更新

- **消息中心** (`MESSAGE_*.md`)
  - 功能完整文档
  - 实现说明
  - 验证清单
  - 快速启动

- **通知系统** (`NOTIFICATION_*.md`)
  - 诊断报告
  - 功能清单
  - 快速参考
  - 测试用例

- **私信功能** (`PRIVATE_MESSAGES_IMPLEMENTATION.md`)
  - 私信系统实现

- **评论回复** (`REPLIES_*.md`)
  - 功能说明
  - UI升级文档

### ✓ `/verification-docs`
验证清单和总结报告，用于确保功能完整性

**内容：**
- `COMPLETION_REPORT.md` - 项目完成报告
- `IMPLEMENTATION_*.md` - 实现总结
- `NOTIFICATION_*.md` - 通知功能检查
- `QUICK_REFERENCE.md` - 快速参考指南
- `VERIFICATION_CHECKLIST.md` - 验证清单

### 🛠️ 根目录配置文件
- `build.bat` - Windows编译脚本
- `run_test.ps1` - PowerShell测试运行脚本
- `setup-env.ps1` - 环境设置脚本
- `token.txt` - 测试用Token（已过期）
- `test.png` - 测试图片

## 使用指南

### 运行测试
```bash
cd ..
python -m pytest archived-docs/test-scripts/test_*.py
```

### 查看调试信息
```bash
python archived-docs/debug-scripts/diagnose_permission_issue.py
```

### 查看特定功能文档
```bash
cat archived-docs/implementation-docs/AVATAR_IMPLEMENTATION_GUIDE.md
```

## 文件统计

- **测试脚本**: 30+ 个Python文件
- **调试脚本**: 6个诊断和检查脚本
- **实现文档**: 15个markdown文档
- **验证文档**: 8个清单和报告

---

*最后更新: 2025年12月31日*
