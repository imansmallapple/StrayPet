from django.contrib.auth import get_user_model

from rest_framework import viewsets, mixins, filters, permissions

from apps.user.serializer import RegisterSerializer

User = get_user_model()


class RegisterViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
