from django.urls import path
from . import views

urlpatterns = [
    path('category/', views.CategoryAPIView.as_view(), name="category-list"),
]
