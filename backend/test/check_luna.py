#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

# 查找 Luna 宠物
luna = Pet.objects.filter(name='Luna').first()
if luna:
    print(f"宠物名: {luna.name}")
    print(f"物种: {luna.species}")
    print(f"性别: {luna.sex}")
    print(f"大小: '{luna.size}'")
    print(f"Size 是否为空: {luna.size == ''}")
    print(f"Size 是否为 None: {luna.size is None}")
    print(f"Size 长度: {len(luna.size) if luna.size else 0}")
else:
    print("没有找到 Luna")
