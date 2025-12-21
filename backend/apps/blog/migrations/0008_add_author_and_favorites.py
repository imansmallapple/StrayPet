# Generated migration for adding author and favorites

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('blog', '0007_add_default_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='author',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='articles',
                to=settings.AUTH_USER_MODEL,
                verbose_name='作者'
            ),
        ),
        migrations.CreateModel(
            name='FavoriteArticle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('add_date', models.DateTimeField(auto_now_add=True, verbose_name='add time')),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='blog.article', verbose_name='文章')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorite_articles', to=settings.AUTH_USER_MODEL, verbose_name='用户')),
            ],
            options={
                'verbose_name': '收藏的文章',
                'verbose_name_plural': '收藏的文章',
                'ordering': ['-add_date'],
                'unique_together': {('user', 'article')},
            },
        ),
    ]
