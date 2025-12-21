# Generated migration for adding default categories

from django.db import migrations


def create_default_categories(apps, schema_editor):
    """创建默认的博客分类"""
    Category = apps.get_model('blog', 'Category')
    
    default_categories = [
        '宠物护理',
        '宠物健康',
        '宠物训练',
        '宠物故事',
        '领养指南',
        '救助经验',
        '宠物行为',
        '未分类',
    ]
    
    for name in default_categories:
        Category.objects.get_or_create(name=name)


def remove_default_categories(apps, schema_editor):
    """删除默认分类（回滚操作）"""
    Category = apps.get_model('blog', 'Category')
    default_categories = [
        '宠物护理',
        '宠物健康',
        '宠物训练',
        '宠物故事',
        '领养指南',
        '救助经验',
        '宠物行为',
        '未分类',
    ]
    Category.objects.filter(name__in=default_categories).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_categories, remove_default_categories),
    ]
