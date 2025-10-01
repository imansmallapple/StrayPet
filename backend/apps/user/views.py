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
    UserInfoSerializer, UpdateEmailSerializer, ChangePasswordSerializer, UploadImageSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from common.utils import generate_catcha_image
from django.core.files.storage import default_storage

User = get_user_model()


class RegisterViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


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
