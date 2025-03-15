# DRF

- install pip
- install django
- pip install djangorestframework
- using django-admin.exe create project like: django-admin.exe startproject storeProject

=>
In project settings.py => INSTALL_APP => Add 'rest_framework'

- Under project directory, run server via: python manage.py runserver

=> Create api directory with 2 files(__init__.py views.py)

Under views.py import Response
from rest_framework.response import Response
from rest_framework.decorators import api_view

Response可以让我们将相应以Json的格式输出

AIPView 装饰器用于将基于函数的试图转为基于Restful 请求的视图

创建API视图：
```
@api_view(['GET'])
def get_data(request):
    goods = {'name': "test goods", 'price': "2.3"}
    return Response(goods)
```
这样可以创建url完成视图的绑定：
创建url.py
from django.urls import path
from . import views
完成url映射关系配置：
urlpatterns = [
    path('', views.get_data)
]


然后在项目根目录urls.py 导入我们的api.urls模块, 注意这里需要引入include
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('api.urls'))
]

python manage.py runserver
worked!

接下来尝试创建app名为goods
python manage.py startapp goods
=> storeProject.py /settings.py INSTALLED_APP add app: 'goods'

define goods model

class Goods(models.Model):
    name = models.CharField(max_length=100)
    price = models.FloatField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

然后进行数据迁移
django中数据迁移是一种用于管理数据变化的模式

python manage.py makemigrations
python manage.py migrate

完成了模型创建和数据迁移操作，接下来创建超级管理员来添加数据(admin console)

python manage.py createsuperuser
admin 123123

进入goods/admin.py 注册数据模型
from . import models
# Register your models here.
admin.site.register(models.Goods)

重新启动服务可以看到admin页面了
python manage.py runserver
http://127.0.0.1:8000/admin/

添加完测试数据可以写增删改查接口了

在api创建serializers.py 用于处理复杂数据的转换工具

from rest_framework import serializers
from goods.models import Goods


class GoodsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goods
        fields = '__all__'
       

当我们的API返回模型时会用到这个文件对我们的数据进行序列化
然后尝试修改 api/views.py
from goods.models import Goods
from api.serializers import GoodsSerializer


@api_view(['GET'])
def goods_list(request):
    goods = Goods.objects.all()
    serializer = GoodsSerializer(goods, many=True)
    return Response(serializer.data)

然后点开api/urls.py 
urlpatterns = [
    path('goods/', views.goods_list)
]
可以看到了商品列表返回了
http://127.0.0.1:8000/goods/

下一步尝试添加POST方法
使一个接口处理多个请求
@api_view(['GET', 'POST'])
def goods_list(request):
    if request.method == 'GET':
        goods = Goods.objects.all()
        serializer = GoodsSerializer(goods, many=True)
        return Response(serializer.data)
    if request.method == 'POST':
        serializer = GoodsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

商品详情API:
@api_view(['GET', 'POST', 'DELETE'])
def goods_detail(request, id):
    try:
        goods = Goods.objects.get(id=id)
    except Goods.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        serializer = GoodsSerializer(goods)
        return Response(serializer.data)
    if request.method == 'PUT':
        serializer = GoodsSerializer(goods, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    if request.method == 'DELETE':
        goods.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
写完之后配置url映射 api/urls
urlpatterns = [
    path('goods/', views.goods_list),
    path('goods/<int:id>', views.goods_detail)
]
