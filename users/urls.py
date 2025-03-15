from django.urls import path
from . import views
from django.urls import path

urlpatterns = [
    path('login/', views.user_list, name='login'),
]
