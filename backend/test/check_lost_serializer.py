#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost
from apps.pet.serializers import LostSerializer
import json

# 获取一个 Lost 对象
lost = Lost.objects.first()
if lost:
    serializer = LostSerializer(lost)
    print("Lost 序列化数据:")
    print(json.dumps(serializer.data, indent=2, default=str))
else:
    print("没有 Lost 对象")
