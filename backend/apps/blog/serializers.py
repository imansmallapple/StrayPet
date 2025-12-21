from rest_framework import serializers
from .models import Article, Category, Tag
from apps.user.models import ViewStatistics
import re


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class TagSerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True, default=0)
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'add_date', 'pub_date', 'article_count']


class ArticleSerializer(serializers.ModelSerializer):
    category = serializers.HyperlinkedRelatedField(
        view_name='category-detail',
        read_only=True,
    )
    tags = serializers.StringRelatedField(many=True, read_only=True)
    count = serializers.IntegerField(read_only=True, default=0)
    content = serializers.CharField(source='get_markdown', read_only=True)
    toc = serializers.CharField(source='get_toc', read_only=True)

    class Meta:
        model = Article
        fields = '__all__'


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """用于创建和更新文章的 Serializer"""
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Article
        fields = ['id', 'title', 'description', 'content', 'category', 'tags']
        read_only_fields = ['id']

    def extract_hashtags(self, content):
        """从内容中提取所有 #hashtag"""
        # 匹配 #后面跟字母、数字、中文字符
        pattern = r'#([\w\u4e00-\u9fa5]+)'
        hashtags = re.findall(pattern, content)
        return list(set(hashtags))  # 去重

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        content = validated_data.get('content', '')
        
        # 如果没有提供category，使用默认的"未分类"
        if 'category' not in validated_data or validated_data.get('category') is None:
            default_category, _ = Category.objects.get_or_create(
                name='未分类',
                defaults={'name': '未分类'}
            )
            validated_data['category'] = default_category
        
        # 创建文章
        article = Article.objects.create(**validated_data)
        
        # 从内容中提取hashtags
        hashtags = self.extract_hashtags(content)
        
        # 为提取的hashtags创建或获取Tag对象
        tag_objects = []
        for tag_name in hashtags:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            tag_objects.append(tag)
        
        # 添加手动指定的tags（如果有）
        tag_objects.extend(tags_data)
        
        # 关联所有tags
        if tag_objects:
            article.tags.set(tag_objects)
        
        return article

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        content = validated_data.get('content', instance.content)
        
        # 更新基本字段
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 从内容中提取hashtags
        hashtags = self.extract_hashtags(content)
        
        # 为提取的hashtags创建或获取Tag对象
        tag_objects = []
        for tag_name in hashtags:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            tag_objects.append(tag)
        
        # 如果手动指定了tags，也添加进去
        if tags_data is not None:
            tag_objects.extend(tags_data)
        
        # 更新tags关联
        if tag_objects or tags_data is not None:
            instance.tags.set(tag_objects)
        
        return instance
