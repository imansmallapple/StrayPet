from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('category', views.CategoryViewSet, basename='category')
router.register('article', views.ArticleViewSet, basename='article')
router.register('tag', views.TagViewSet, basename='tag')

urlpatterns = [
    path('article/<int:year>/<int:month>/',
         views.ArticleViewSet.as_view({'get': 'archive_detail'}),
         name='archive_detail'
         ),
    *router.urls
]
