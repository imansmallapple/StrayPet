from rest_framework import viewsets, mixins, permissions
from rest_framework.decorators import action
from django.db.models.functions import ExtractYear, ExtractMonth

from django.db import models
from .models import Article, Tag, Category
from .serializers import ArticleSerializer, TagSerializer, CategorySerializer
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from django_filters import rest_framework as filters
from apps.user.models import ViewStatistics


class CategoryViewSet(mixins.ListModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.CreateModelMixin,
                      viewsets.GenericViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [SearchFilter, OrderingFilter]
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    search_fields = ['name']
    ordering_fields = ['add_date']


class ArticleViewSet(mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    filter_backends = [
        filters.DjangoFilterBackend,
        SearchFilter, OrderingFilter
    ]
    search_fields = ['title']
    ordering_fields = ['add_date']
    filterset_fields = ['category']

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        ViewStatistics.increase(request, obj)
        return super().retrieve(request, *args, **kwargs)

    @action(methods=['get'], detail=False)
    def archive(self, request, *args, **kwargs):
        queryset = self.get_queryset().annotate(
            year=ExtractYear('add_date'),
            month=ExtractMonth('add_date')
        ).values('year', 'month').annotate(
            count=models.Count('id')
        ).order_by('-year', '-month')
        return Response(list(queryset))
        # [{'year': 2021, 'month': 1, 'count': 1}]

    @action(methods=['get'], detail=False)
    def archive_detail(self, request, year: int, month: int):
        queryset = self.get_queryset().annotate(
            year=ExtractYear('add_date'),
            month=ExtractMonth('add_date')
        ).filter(
            add_date__year=year,
            add_date__month=month
        ).order_by('-add_date')

        serializer = self.get_serializer(
            queryset,
            many=True,
        )
        return Response(serializer.data)


class TagViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['add_date']
