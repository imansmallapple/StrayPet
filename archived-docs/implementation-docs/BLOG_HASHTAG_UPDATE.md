# 博客功能更新说明

## 🎯 更新内容

### 1. **自动 Hashtag 标签系统**

现在在博客文章中使用 `#标签名` 格式，系统会自动识别并创建标签！

#### 工作原理：

- 在文章内容中输入 `#猫咪护理`、`#宠物训练` 等 hashtag
- 系统会自动提取所有 hashtag
- 如果标签不存在，会自动创建
- 如果标签已存在，会直接使用该标签
- 文章会自动关联这些标签

#### 示例：

```
我今天要分享一些 #猫咪护理 的经验。
#宠物训练 是每个宠物主人都应该了解的话题。
记得要 #定期体检 保证宠物健康！
```

这篇文章会自动创建/关联三个标签：

- 猫咪护理
- 宠物训练
- 定期体检

#### 支持的格式：

- ✅ 中文标签：`#猫咪护理`
- ✅ 英文标签：`#PetCare`
- ✅ 数字：`#2024年度总结`
- ✅ 混合：`#Pet护理`

### 2. **分类变为可选**

#### 变化：

- **之前**：必须选择一个分类才能发布文章
- **现在**：分类变为可选，如果不选择会自动归类到"未分类"

#### 默认分类：

系统预设了以下分类：

- 🐱 宠物护理
- 💊 宠物健康
- 🎓 宠物训练
- 📖 宠物故事
- 🏠 领养指南
- 🆘 救助经验
- 🐾 宠物行为
- 📁 未分类

### 3. **移除手动选择标签**

不再需要手动勾选标签，只需在文章内容中使用 `#hashtag` 即可！

## 🚀 使用方法

### 前端（用户界面）：

1. **创建博客文章**

   - 进入 `/blog/create`
   - 填写标题（必填）
   - 填写描述（可选，不填会自动生成）
   - 在富文本编辑器中编写内容
   - 在内容中使用 `#标签名` 添加话题标签
   - 选择分类（可选）
   - 提交发布

2. **查看效果**
   - 文章发布后，hashtag 会自动转换为标签
   - 在文章详情页可以看到关联的标签
   - 点击标签可以查看相同标签的其他文章

### 后端 API：

#### 创建文章：

```python
POST /api/blog/article/

{
  "title": "我的宠物护理经验",
  "content": "<p>今天分享 #猫咪护理 和 #宠物训练 的经验...</p>",
  "description": "分享宠物护理经验",  // 可选
  "category": 1  // 可选，不传则使用"未分类"
}
```

响应：文章创建成功，自动关联 "猫咪护理" 和 "宠物训练" 两个标签

## 🔧 技术实现

### 后端改动：

1. **serializers.py**

   - 添加 `extract_hashtags()` 方法使用正则提取 hashtag
   - 修改 `create()` 和 `update()` 方法自动处理标签
   - Category 改为可选字段，默认使用"未分类"

2. **数据迁移**
   - 新增 `0002_add_default_categories.py` 迁移
   - 自动创建 8 个默认分类

### 前端改动：

1. **create/index.tsx**
   - 集成 FluentEditor 富文本编辑器
   - 移除手动选择标签的界面
   - Category 改为可选下拉框
   - 添加 hashtag 使用说明

## 📝 注意事项

1. **Hashtag 格式**：

   - 必须以 `#` 开头
   - 后面跟字母、数字或中文字符
   - 不支持空格和特殊符号
   - 例如：`#猫咪护理` ✅ `# 猫咪护理` ❌ `#猫咪-护理` ❌

2. **去重**：

   - 同一篇文章中相同的 hashtag 只会创建一次
   - `#猫咪护理 #猫咪护理` → 只会关联一个"猫咪护理"标签

3. **大小写**：
   - 英文 hashtag 区分大小写
   - `#PetCare` 和 `#petcare` 是两个不同的标签

## 🧪 测试

运行测试脚本：

```bash
cd backend
docker-compose exec sp_web python test_hashtag.py
```

或在 Django shell 中测试：

```bash
docker-compose exec sp_web python manage.py shell
```

```python
from apps.blog.serializers import ArticleCreateUpdateSerializer
serializer = ArticleCreateUpdateSerializer()
content = "测试 #猫咪 #狗狗 #宠物护理"
hashtags = serializer.extract_hashtags(content)
print(hashtags)  # ['猫咪', '狗狗', '宠物护理']
```

## 🎨 用户体验改进

1. **更简单**：不需要事先创建标签，写文章时直接使用 hashtag
2. **更直观**：在编辑器中直接看到 `#标签` 的视觉效果
3. **更灵活**：可以随时添加新标签，无需在后台管理
4. **更快速**：减少创建文章的步骤，提高发布效率

## 📊 数据库变更

运行迁移命令创建默认分类：

```bash
docker-compose exec sp_web python manage.py migrate blog
```

这会自动创建 8 个默认分类。
