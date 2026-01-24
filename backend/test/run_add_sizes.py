#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

output = []
output.append("=" * 80)
output.append("🔧 为宠物添加 Size 值")
output.append("=" * 80)

# 获取所有 size 为空的宠物
pets_without_size = Pet.objects.filter(size='')
total = pets_without_size.count()

if total == 0:
    output.append("✅ 所有宠物都已有 Size 值")
else:
    output.append(f"\n找到 {total} 个宠物需要添加 Size\n")

    # Size 分配策略：根据物种和品种分配
    small_breeds = ['chihuahua', 'poodle', 'dachshund', 'pug', 'shih tzu', 'maltese', 'yorkie']
    large_breeds = ['german shepherd', 'retriever', 'husky', 'boxer', 'doberman', 'rottweiler', 'labrador']
    
    updated = 0
    for pet in pets_without_size:
        # 根据品种分配 size
        if pet.breed:
            breed_lower = pet.breed.lower()
            if any(small_breed in breed_lower for small_breed in small_breeds):
                pet.size = 'Small'
            elif any(large_breed in breed_lower for large_breed in large_breeds):
                pet.size = 'Large'
            else:
                pet.size = 'Medium'
        else:
            # 如果没有品种，按物种分配
            if pet.species == 'cat':
                pet.size = 'Small'
            elif pet.species == 'dog':
                pet.size = 'Medium'
            else:
                pet.size = 'Medium'
        
        pet.save(update_fields=['size'])
        updated += 1
        output.append(f"✅ {pet.name}: {pet.size}")

    output.append(f"\n✅ 成功更新 {updated} 个宠物的 Size")

output.append("=" * 80)

# 打印输出
result_text = '\n'.join(output)
print(result_text)

# 也写入文件
with open('size_update_result.txt', 'w', encoding='utf-8') as f:
    f.write(result_text)
