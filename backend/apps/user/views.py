import random
import string
import io
import base64
import uuid
from datetime import date
from django.core.cache import cache
from django.contrib.auth import get_user_model, logout
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import viewsets, mixins, filters, permissions, authentication, status, generics
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from common import pagination
from rest_framework.decorators import action
from apps.user.serializer import RegisterSerializer, SendEmailCodeSerializer, VerifyEmailCodeSerializer, \
    UserInfoSerializer, UpdateEmailSerializer, ChangePasswordSerializer, UploadImageSerializer, \
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer, UserMeSerializer, UserListSerializer, \
    UserDetailSerializer, NotificationSerializer, FriendshipSerializer, PrivateMessageSerializer
from apps.user.models import Notification, Friendship, PrivateMessage
from rest_framework_simplejwt.authentication import JWTAuthentication
from common.utils import generate_catcha_image
from django.core.files.storage import default_storage
from django.core.mail import send_mail
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
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
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # 允许查询任何用户的公开信息
        return super().get_queryset()

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
    permission_classes = [AllowAny]          
    authentication_classes = []  
    
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
    

class UserOpsViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    提供以下路由（空前缀）：
    - GET  /user/<id>/              → 按 id 查看单个用户
    - GET  /user/<id>/detail/       → 按 id 查看单个用户的详细信息
    - GET  /user/me/                → 当前登录用户（简要）
    - GET  /user/detail/            → 当前用户详细（支持 fields/exclude）
    - PATCH /user/detail/           → 修改当前用户基础信息（username/email/first/last/phone）
    """
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserDetailSerializer
    authentication_classes = [JWTAuthentication, SessionAuthentication]

    def get_permissions(self):
        # 按需调整：只有管理员能看/查他人；当前用户自己的接口只需登录
        if self.action in ['retrieve', 'detail_by_id']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    # 当前用户——简要
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if request.method == 'GET':
            ser = UserMeSerializer(request.user, context={'request': request})
            return Response(ser.data)
        elif request.method == 'PATCH':
            ser = UserMeSerializer(request.user, data=request.data, partial=True, context={'request': request})
            ser.is_valid(raise_exception=True)
            ser.save()
            return Response(ser.data)
        ser = UserMeSerializer(request.user, context={'request': request})
        return Response(ser.data)

    # 当前用户——详细（GET 可裁剪字段，PATCH 可修改基础信息）
    @action(detail=False, methods=['get', 'patch'], url_path='detail', url_name='my-detail')
    def my_detail(self, request):
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

    # 指定 id —— 详细
    @action(detail=True, methods=['get'], url_path='detail', url_name='detail-by-id')
    def detail_by_id(self, request, pk=None):
        obj = self.get_object()  # 按 pk 取用户
        ser = UserDetailSerializer(obj, context={'request': request})
        return Response(ser.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """用户通知 API - 获取当前用户的所有通知"""
    serializer_class = NotificationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.AllowAny]  # 临时改为AllowAny来测试
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    pagination_class = pagination.PageNumberPagination
    
    def get_queryset(self):
        # 只返回当前用户的通知
        # 如果request.user是匿名用户，返回空
        if not self.request.user or not self.request.user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_object(self):
        # 确保用户只能访问自己的通知
        obj = super().get_object()
        if not self.request.user.is_authenticated or obj.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to access this notification.')
        return obj
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """获取未读通知数"""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """获取所有未读通知"""
        notifications = Notification.objects.filter(user=request.user, is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """标记所有通知为已读"""
        from django.utils import timezone
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'message': 'All notifications marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """标记单个通知为已读"""
        from django.utils import timezone
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'message': 'Notification marked as read'})

class AvatarViewSet(viewsets.ViewSet):
    """
    User avatar management
    - GET  /user/avatars/{user_id}/          - Get user avatar
    - GET  /user/avatars/{user_id}/default/  - Get default avatar (initials)
    - POST /user/avatars/upload/              - Upload custom avatar
    - DELETE /user/avatars/delete/            - Delete custom avatar (revert to default)
    """
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @action(detail=False, methods=['post'], url_path='upload', url_name='upload-avatar')
    def upload_avatar(self, request):
        """Upload a custom avatar for current user"""
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'No avatar file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_file = request.FILES['avatar']
        user = request.user
        
        # Validate file size (max 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Avatar file too large (max 5MB)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        valid_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        file_ext = avatar_file.name.split('.')[-1].lower()
        if file_ext not in valid_extensions:
            return Response(
                {'error': f'Invalid file type. Allowed: {", ".join(valid_extensions)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Save avatar
            user.profile.avatar = avatar_file
            user.profile.save()
            
            serializer = UserMeSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to upload avatar: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='delete', url_name='delete-avatar')
    def delete_avatar(self, request):
        """Delete custom avatar and revert to default"""
        user = request.user
        
        try:
            # Delete the custom avatar file
            if user.profile.avatar:
                user.profile.avatar.delete()
                user.profile.avatar = None
                user.profile.save()
            
            return Response(
                {'message': 'Avatar deleted, reverting to default'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete avatar: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='reset', url_name='reset-avatar')
    def reset_to_default(self, request):
        """Reset to default avatar"""
        user = request.user
        
        try:
            from .avatar_utils import generate_default_avatar
            
            # Delete existing custom avatar
            if user.profile.avatar:
                user.profile.avatar.delete()
            
            # Generate and save default avatar
            default_avatar = generate_default_avatar(user.username)
            user.profile.avatar.save(
                f'{user.username}_avatar.png',
                default_avatar,
                save=True
            )
            
            serializer = UserMeSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to reset avatar: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FriendshipViewSet(viewsets.ModelViewSet):
    """好友管理 API"""
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get_queryset(self):
        user = self.request.user
        # 返回与当前用户相关的所有好友关系
        return Friendship.objects.filter(
            Q(from_user=user) | Q(to_user=user)
        )
    
    @action(detail=False, methods=['post'])
    def add_friend(self, request):
        """添加好友"""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': '缺少user_id参数'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)
        
        if target_user == request.user:
            return Response({'error': '不能添加自己为好友'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查是否已存在好友关系
        friendship = Friendship.objects.filter(
            Q(from_user=request.user, to_user=target_user) |
            Q(from_user=target_user, to_user=request.user)
        ).first()
        
        if friendship:
            serializer = self.get_serializer(friendship)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # 创建新的好友请求
        friendship = Friendship.objects.create(
            from_user=request.user,
            to_user=target_user,
            status='pending'
        )
        serializer = self.get_serializer(friendship)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """接受好友请求"""
        friendship = self.get_object()
        if friendship.to_user != request.user:
            return Response({'error': '只有接收者能接受好友请求'}, status=status.HTTP_403_FORBIDDEN)
        
        friendship.status = 'accepted'
        friendship.save()
        serializer = self.get_serializer(friendship)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """拒绝好友请求"""
        friendship = self.get_object()
        if friendship.to_user != request.user:
            return Response({'error': '只有接收者能拒绝好友请求'}, status=status.HTTP_403_FORBIDDEN)
        
        friendship.status = 'blocked'
        friendship.save()
        serializer = self.get_serializer(friendship)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def check_friendship(self, request):
        """检查与某用户的好友关系"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': '缺少user_id参数'}, status=status.HTTP_400_BAD_REQUEST)
        
        friendship = Friendship.objects.filter(
            Q(from_user=request.user, to_user_id=user_id) |
            Q(from_user_id=user_id, to_user=request.user)
        ).first()
        
        if not friendship:
            return Response({'status': None})
        
        serializer = self.get_serializer(friendship)
        return Response(serializer.data)


class PrivateMessageViewSet(viewsets.ModelViewSet):
    """私信管理 API"""
    serializer_class = PrivateMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    
    def get_queryset(self):
        user = self.request.user
        # 返回当前用户收到或发送的所有消息
        return PrivateMessage.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """发送私信"""
        recipient_id = request.data.get('recipient_id')
        content = request.data.get('content')
        
        if not recipient_id or not content:
            return Response({'error': '缺少recipient_id或content'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({'error': '接收者不存在'}, status=status.HTTP_404_NOT_FOUND)
        
        # 检查是否为好友或者检查非好友消息数量
        friendship = Friendship.objects.filter(
            Q(from_user=request.user, to_user=recipient, status='accepted') |
            Q(from_user=recipient, to_user=request.user, status='accepted')
        ).first()
        
        if not friendship:
            # 非好友关系，检查消息数量限制
            message_count = PrivateMessage.objects.filter(
                sender=request.user,
                recipient=recipient,
                created_at__date=date.today()
            ).count()
            
            if message_count >= 3:
                return Response(
                    {'error': '今日给陌生人的消息已达上限(3条)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        message = PrivateMessage.objects.create(
            sender=request.user,
            recipient=recipient,
            content=content
        )
        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def conversation(self, request):
        """获取与某用户的对话"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': '缺少user_id参数'}, status=status.HTTP_400_BAD_REQUEST)
        
        messages = PrivateMessage.objects.filter(
            Q(sender=request.user, recipient_id=user_id) |
            Q(sender_id=user_id, recipient=request.user)
        ).order_by('-created_at')
        
        page = self.paginate_queryset(messages, request)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """标记消息为已读"""
        message = self.get_object()
        if message.recipient != request.user:
            return Response({'error': '只有接收者能标记消息为已读'}, status=status.HTTP_403_FORBIDDEN)
        
        from django.utils import timezone
        message.is_read = True
        message.read_at = timezone.now()
        message.save()
        serializer = self.get_serializer(message)
        return Response(serializer.data)


class NotificationsListView(APIView):
    """通知列表 API - 使用最基本的APIView来绕过权限检查问题"""
    
    def get(self, request):
        try:
            # 手动检查认证
            if request.user and request.user.is_authenticated:
                notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
                # 手动分页
                from rest_framework.pagination import PageNumberPagination
                paginator = PageNumberPagination()
                paginator.page_size = 10
                page = paginator.paginate_queryset(notifications, request)
                serializer = NotificationSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)
            else:
                return Response(
                    {'results': []},
                    status=status.HTTP_200_OK
                )
        except Exception as e:
            print(f'Error in NotificationsListView: {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
