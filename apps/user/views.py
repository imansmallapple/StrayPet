import random
import string
from django.core.cache import cache
from django.contrib.auth import get_user_model

from rest_framework import viewsets, mixins, filters, permissions, authentication
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from apps.user.serializer import RegisterSerializer, SendEmailCodeSerializer, VerifyEmailCodeSerializer, \
    UserInfoSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication

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