from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from . import views

router = DefaultRouter()
router.register('register', views.RegisterViewSet, basename='category')
router.register('userinfo', views.UserInfoViewSet, basename='userinfo')

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path(
        'send_email_code/',
        views.SendEmailCodeGenericAPIView.as_view(),
        name='send_email_code'
    ),
    path(
        'verify_email_code/',
        views.VerifyEmailCodeGenericAPIView.as_view(),
        name='verify_email_code'
    ),
    path(
        'captcha/',
        views.CaptchaGenericAPIView.as_view(),
        name='captcha'
    ),
    path(
        'upload_image/',
        views.UploadImageGenericAPIView.as_view(),
        name='upload_image'
    ),
    * router.urls,
]
