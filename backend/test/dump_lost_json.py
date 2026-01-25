#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost
from apps.pet.serializers import LostSerializer

# 获取一条数据
lost = Lost.objects.first()
serializer = LostSerializer(lost)

# 输出完整 JSON
print(json.dumps(serializer.data, indent=2, default=str))
