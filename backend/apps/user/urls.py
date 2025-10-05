from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from collections import OrderedDict
from rest_framework.reverse import reverse
from . import views
app_name = 'user'

class UserDefaultRouter(DefaultRouter):
    def __init__(self, root_name='User', root_description='The default basic root view for user router'):
        super().__init__()
        self._root_name = root_name
        self._root_desc = root_description

    def get_api_root_view(self, **kwargs):
        view = super().get_api_root_view(**kwargs)
        view.cls.__name__ = self._root_name
        view.cls.__doc__  = self._root_desc

        # original_get = view.cls().get  # 缓存原 get

        # def patched_get(self, request, *args, **kw):
        #     resp = original_get(self, request, *args, **kw)
        #     if isinstance(resp.data, dict):
        #         # 追加当前用户接口链接（需要已注册 basename='user-ops'）
        #         extra = OrderedDict()
        #         extra['detail'] = reverse('user:user-ops-detail', request=request)
        #         extra['me']     = reverse('user:user-ops-me',     request=request)
        #         # 把 extra 合并到现有 Root JSON 的末尾
        #         resp.data.update(extra)
        #     return resp

        # view.cls.get = patched_get
        return view
    
router = UserDefaultRouter()
router.register('register', views.RegisterViewSet, basename='category')
router.register('userinfo', views.UserInfoViewSet, basename='userinfo')
router.register('list',      views.UserListViewSet,basename='user-list')
router.register('',         views.UserOpsViewSet,  basename='user-ops')
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
    path(
        'password/reset/confirm/',
        views.PasswordResetConfirmAPIView.as_view(),
        name='pwd_reset_confirm'
    ),
    path(
        'password/reset/request/',
        views.PasswordResetRequestAPIView.as_view(),
        name='pwd_reset_request'
    ),
    path(
        'me/',
        views.UserMeView.as_view(),
        name='user-me'
    ),
    * router.urls,
]
