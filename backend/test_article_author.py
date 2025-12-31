#!/usr/bin/env python
import os
import sys
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.blog.models import Article
from apps.blog.serializers import ArticleSerializer
from django.test import RequestFactory

# 创建虚拟request对象
factory = RequestFactory()
request = factory.get('/api/blog/articles/')

# 获取所有文章
articles = Article.objects.all()[:5]

for article in articles:
    print(f"\n=== Article: {article.title} ===")
    print(f"Article ID: {article.id}")
    print(f"Author ID: {article.author.id if article.author else 'None'}")
    print(f"Author Username: {article.author.username if article.author else 'None'}")
    
    # 序列化后的数据，提供request context
    serializer = ArticleSerializer(article, context={'request': request})
    data = serializer.data
    print(f"\nSerialized author: {data.get('author')}")
    if isinstance(data.get('author'), dict):
        print(f"  - ID: {data['author'].get('id')}")
        print(f"  - Username: {data['author'].get('username')}")
    elif isinstance(data.get('author'), str):
        print(f"  - Author URL: {data['author']}")
