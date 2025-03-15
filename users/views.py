from django.contrib.auth import authenticate, login
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.serializers import UserSerializer

from users.forms import LoginForm


class MyBackend(ModelBackend):

    def authenticate(self, request, username=None, password=None, ):
        try:
            user = User.objects.get(Q(username=username) | Q(email=username))
            if user.check_password(password):  # Encrypt Password
                return user
        except Exception as e:
            return None


@api_view(['GET', 'POST'])
def login_view(request):
    if request.method != 'POST':
        LoginForm()
    else:
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                # 登录成功之后跳转到个人中心
                return redirect('users:user_profile')
            else:
                return HttpResponse('Login failed')
    if request.method == 'GET':
        user_list = User.objects.all()
        serializer = UserSerializer(user_list, many=True)
        return Response(serializer.data)


@api_view(['GET', 'POST'])
def user_list(request):
    if request.method == 'GET':
        user_list = User.objects.all()
        serializer = UserSerializer(user_list, many=True)
        return Response(serializer.data)
    if request.method != 'POST':
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
