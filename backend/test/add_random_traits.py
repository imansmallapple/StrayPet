#!/usr/bin/env python
import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

print("=" * 80)
print("🎲 为宠物随机添加特征")
print("=" * 80)

# 可用的特征字段
trait_fields = [
    'sterilized',      # 已绝育
    'vaccinated',      # 已接种
    'dewormed',        # 已驱虫
    'child_friendly',  # 对儿童友好
    'trained',         # 已训练
    'loves_play',      # 喜欢玩耍
    'loves_walks',     # 喜欢散步
    'good_with_dogs',  # 与狗相处好
    'good_with_cats',  # 与猫相处好
    'affectionate',    # 温和亲切
]

pets = Pet.objects.all()
print(f"\n总共 {pets.count()} 只宠物")

for pet in pets:
    # 为每只宠物随机选择 2-4 个特征
    num_traits = random.randint(2, 4)
    selected_traits = random.sample(trait_fields, num_traits)
    
    traits_added = []
    for trait in selected_traits:
        setattr(pet, trait, True)
        traits_added.append(trait)
    
    pet.save()
    
    trait_display = [
        '✓ Sterilized' if 'sterilized' in traits_added else '',
        '✓ Vaccinated' if 'vaccinated' in traits_added else '',
        '✓ Child-friendly' if 'child_friendly' in traits_added else '',
        '✓ Trained' if 'trained' in traits_added else '',
        '✓ Loves to play' if 'loves_play' in traits_added else '',
        '✓ Good with dogs' if 'good_with_dogs' in traits_added else '',
        '✓ Good with cats' if 'good_with_cats' in traits_added else '',
        '✓ Affectionate' if 'affectionate' in traits_added else '',
    ]
    trait_display = [t for t in trait_display if t]  # 移除空字符串
    
    print(f"✅ {pet.name:20s} → {', '.join(trait_display)}")

print("\n" + "=" * 80)
print("✅ 特征添加完成")
print("=" * 80)
