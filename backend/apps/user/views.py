import random
import string
import io
import base64
import uuid
from django.core.cache import cache
from django.contrib.auth import get_user_model, logout
from rest_framework import viewsets, mixins, filters, permissions, authentication
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.decorators import action
from apps.user.serializer import RegisterSerializer, SendEmailCodeSerializer, VerifyEmailCodeSerializer, \
    UserInfoSerializer, UpdateEmailSerializer, ChangePasswordSerializer, UploadImageSerializer, \
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer, UserMeSerializer, UserListSerializer, \
        UserDetailSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from common.utils import generate_catcha_image
from django.core.files.storage import default_storage
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework import status
User = get_user_model()

    
class RegisterViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    http_method_names = ['get', 'post', 'head', 'options']  # 允许 GET
    
    def list(self, request, *args, **kwargs):
        return Response({"detail": "Use POST to register a new user."})

class SendEmailCodeGenericAPIView(GenericAPIView):
    serializer_class = SendEmailCodeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = ''.join(random.sample(string.ascii_letters + string.digits, 4))
        email = serializer.validated_data['email']
        cache.get_or_set(email, code, 60 * 5)

        from django.core.mail import send_mail
        send_mail(
            subject='Email code sent, please check your mail box!',
            message=f'Your verification code is {code}',
            from_email='admin@qq.com',
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'msg': 'Sent success!'})


class VerifyEmailCodeGenericAPIView(GenericAPIView):
    serializer_class = VerifyEmailCodeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cache.delete(serializer.data['email'])
        return Response({'msg': 'Verification success!'})


class UserViewSet(mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  viewsets.GenericViewSet):
    """
    /user/
      ├── /user/register/     注册
      ├── /user/me/           当前用户信息
      └── /user/profiles/     所有用户（管理员）
    """
    queryset = User.objects.all().select_related('profile')
    authentication_classes = [JWTAuthentication]
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAdminUser] 
    # 仅管理员可以访问列表
    def get_permissions(self):
        if self.action in ['list']:
            return [permissions.IsAdminUser()]
        elif self.action in ['me', 'partial_update', 'update']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    # 普通 list: /user/profiles/
    def list(self, request, *args, **kwargs):
        """管理员查看所有用户资料"""
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        """
        GET /user/me/      → 当前用户资料
        PATCH /user/me/    → 修改当前用户资料
        """
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(
        detail=False,
        methods=['get', 'patch'],
        url_path='detail',
        permission_classes=[permissions.IsAuthenticated],
        authentication_classes=[JWTAuthentication]
    )
    def detail(self, request):
        """
        GET  /user/detail/?fields=id,username,email,phone
        PATCH /user/detail/ { "username": "...", "phone": "..." }
        """
        user = request.user

        # 从 query 中取动态字段
        fields_param  = request.query_params.get('fields')
        exclude_param = request.query_params.get('exclude')
        fields  = [s.strip() for s in fields_param.split(',')] if fields_param else None
        exclude = [s.strip() for s in exclude_param.split(',')] if exclude_param else None

        if request.method == 'GET':
            ser = UserDetailSerializer(user, context={'request': request}, fields=fields, exclude=exclude)
            return Response(ser.data)

        # PATCH：只允许基础信息字段
        ser = UserDetailSerializer(
            user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class UserListViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    GET /user/list/   All user basic information
    """
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAdminUser]   # 或视需求改成 IsAuthenticated
    
    def get_view_name(self):
        if getattr(self, 'action', None) == 'list':
            return 'User list'   # 你想要的标题
        return super().get_view_name()


class UserInfoViewSet(mixins.RetrieveModelMixin,
                      viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserInfoSerializer
    authentication_classes = [authentication.SessionAuthentication, JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(id=self.request.user.id)

    def get_serializer_class(self):
        if self.action == 'update_email':
            return UpdateEmailSerializer
        elif self.action == 'change_password':
            return ChangePasswordSerializer
        return super().get_serializer_class()

    @action(methods=['post'], detail=True)
    def update_email(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        instance.email = serializer.validated_data['email']
        instance.save()
        return Response({'msg': 'Email update succeed!'})

    @action(methods=['post'], detail=True)
    def change_password(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        instance.set_password(serializer.validated_data['password'])
        instance.save()

        if authentication.SessionAuthentication in self.authentication_classes:
            logout(request)
        return Response({'msg': 'Change password succeed!'})


class CaptchaGenericAPIView(GenericAPIView):
    def get(self, request, *args, **kwargs):
        image, text = generate_catcha_image()
        uid = uuid.uuid4().hex
        cache.set(uid, text, 60 * 5)

        buf = io.BytesIO()
        image.save(buf, format='PNG')  # 大写也行
        b64 = base64.b64encode(buf.getvalue()).decode('ascii')  # ← 只 decode，不要再 encode

        return Response({
            "uid": uid,
            "image": f"data:image/png;base64,{b64}"  # ← 关键：加 data URL 前缀
        })


class UploadImageGenericAPIView(GenericAPIView):
    serializer_class = UploadImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [
        authentication.SessionAuthentication,
        JWTAuthentication
    ]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data['image']
        name = default_storage.save(file.name, file)
        url = request.build_absolute_uri(default_storage.url(name))

        return Response({
            'code': 'ok',
            'url': url,
            'text': file.name
        })

class PasswordResetRequestAPIView(GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []      # ← important: no SessionAuth (no CSRF)
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"]
        code = ''.join(random.sample(string.ascii_letters + string.digits, 4))
        cache.set(email, code, 300)
        send_mail("Password reset code", f"Your code is {code}", "admin@gmail.com", [email])
        return Response({"msg": "If the email exists, a reset code has been sent."})

class PasswordResetConfirmAPIView(GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.validated_data["user"]
        user.set_password(s.validated_data["new_password"])
        user.save()
        cache.delete(s.validated_data["email"])
        return Response({"msg": "Password has been reset."})
    
class UserMeView(generics.RetrieveUpdateAPIView):
    # ★ 明确只用 JWT 认证（避免默认 SessionAuth 导致匿名 -> 403）
    serializer_class = UserMeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user
    

class UserOpsViewSet(viewsets.GenericViewSet):
    """
    空前缀挂载，仅提供动作：
    - GET /user/me/
    - GET|PATCH /user/detail/
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserDetailSerializer  # 用于 detail 更新

    @action(detail=False, methods=['get'])
    def me(self, request):
        ser = UserMeSerializer(request.user, context={'request': request})
        return Response(ser.data)

    @action(detail=False, methods=['get', 'patch'])
    def detail(self, request):
        user = request.user
        fields_q  = request.query_params.get('fields')
        exclude_q = request.query_params.get('exclude')
        fields  = [s.strip() for s in fields_q.split(',')] if fields_q else None
        exclude = [s.strip() for s in exclude_q.split(',')] if exclude_q else None

        if request.method == 'GET':
            ser = UserDetailSerializer(user, context={'request': request},
                                       fields=fields, exclude=exclude)
            return Response(ser.data)

        ser = UserDetailSerializer(user, data=request.data, partial=True,
                                   context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)