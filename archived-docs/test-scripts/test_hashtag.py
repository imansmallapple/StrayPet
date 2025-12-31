"""
测试脚本：演示hashtag自动提取功能

使用方法：
1. 启动Django容器
2. 运行：docker-compose exec sp_web python manage.py shell < test_hashtag.py

或者在Django shell中运行：
from apps.blog.serializers import ArticleCreateUpdateSerializer
serializer = ArticleCreateUpdateSerializer()
content = "这是一篇关于 #猫咪护理 和 #宠物训练 的文章。我们还会讨论 #领养指南"
hashtags = serializer.extract_hashtags(content)
print("提取的hashtags:", hashtags)
"""

from apps.blog.serializers import ArticleCreateUpdateSerializer
from apps.blog.models import Article, Category, Tag

# 创建serializer实例
serializer = ArticleCreateUpdateSerializer()

# 测试内容
test_contents = [
    "这是一篇关于 #猫咪护理 和 #宠物训练 的文章。我们还会讨论 #领养指南",
    "Today I want to share #DogTraining tips and #PetCare advice! #AdoptDontShop",
    "混合中英文: #狗狗健康 is important for #PetOwners who love #宠物",
    "<p>HTML内容中的标签: #猫咪 #训练 #健康</p>",
]

print("=" * 60)
print("测试 Hashtag 自动提取功能")
print("=" * 60)

for i, content in enumerate(test_contents, 1):
    print(f"\n测试 {i}:")
    print(f"内容: {content}")
    hashtags = serializer.extract_hashtags(content)
    print(f"提取的hashtags: {hashtags}")
    print("-" * 60)

# 显示当前数据库中的tags
print("\n当前数据库中的Tags:")
for tag in Tag.objects.all():
    print(f"  - {tag.name}")

print("\n当前数据库中的Categories:")
for cat in Category.objects.all():
    print(f"  - {cat.name}")
