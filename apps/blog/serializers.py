from rest_framework import serializers
from .models import Article, Category, Tag
from apps.user.models import ViewStatistics


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'


class ArticleSerializer(serializers.ModelSerializer):
    # category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    # category = CategorySerializer(many=False, read_only=True)
    category = serializers.HyperlinkedRelatedField(
        view_name='category-detail',
        read_only=True,
    )
    # tags = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all(), many=True, required=False, allow_null=True)
    # tags = TagSerializer(many=True, read_only=True)
    tags = serializers.StringRelatedField(many=True)  # 返回Tag关联的数据
    # count = serializers.SerializerMethodField()
    count = serializers.IntegerField(read_only=True, default=0)
    content = serializers.CharField(source='get_markdown', read_only=True)
    toc = serializers.CharField(source='get_toc', read_only=True)

    class Meta:
        model = Article
        fields = '__all__'

    # def get_count(self, obj):
    #     return ViewStatistics.get_view_count(obj)
