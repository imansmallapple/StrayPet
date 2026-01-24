#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet
from apps.pet.serializers import PetListSerializer

# 获取 Luna
luna = Pet.objects.filter(name='Luna').first()
if luna:
    serializer = PetListSerializer(luna)
    data = serializer.data
    
    print("Luna 的序列化数据:")
    print(f"  size: {repr(data.get('size'))}")
    print(f"  size 类型: {type(data.get('size'))}")
    print(f"  size 长度: {len(data.get('size', ''))}")
    print(f"  size 是否为 None: {data.get('size') is None}")
    print(f"  size 是否为空字符串: {data.get('size') == ''}")
    print(f"  完整 JSON: {json.dumps({'size': data.get('size')})}")
else:
    print("没有找到 Luna")
