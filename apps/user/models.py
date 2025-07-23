from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.cache import cache
from django.utils import timezone


class ViewStatistics(models.Model):
    object_id = models.PositiveIntegerField()
    content_type = models.ForeignKey(on_delete=models.CASCADE, to=ContentType)
    content_object = GenericForeignKey('content_type', 'object_id')
    count = models.PositiveIntegerField(default=0)
    date = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = 'View statistics'
        verbose_name_plural = 'View statistics'
        ordering = ['-date']
        indexes = [
            models.Index(
                fields=['content_type', 'object_id', 'date'],
                name='user_views_content_date_idx'
            )
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['content_type', 'object_id', 'date'],
                name='user_views_content_type_idx'
            )
        ]

    def __str__(self) -> str:
        return f'{self.content_type}{self.object_id}-{self.date}-{self.count}'

    @classmethod
    def increase(cls, request, obj):
        uid = request.uid
        obj_id = obj.id
        date = timezone.now().date()
        ct = ContentType.objects.get_for_model(obj.__class__)
        key = f'{uid}:{date}:{obj_id}'

        if not cache.get(key):
            cache.set(key, 1, 60 * 60 * 24)
            try:
                cls.objects.get(content_type=ct, object_id=obj_id, date=date)
            except cls.DoesNotExist:
                cls.objects.create(
                    content_type=ct,
                    object_id=obj_id,
                    count=1,
                    date=date
                )
            else:
                cls.objects.filter(
                    content_type=ct,
                    object_id=obj_id,
                    date=date
                ).update(count=models.F('count') + 1)

    @classmethod
    def get_view_count(cls, obj):
        ct = ContentType.objects.get_for_model(obj)
        obj_id = obj.id
        date = timezone.now().date()
        try:
            view_statistics = ViewStatistics.objects.get(
                content_type=ct,
                object_id=obj_id,
                date=date
            )
        except cls.DoesNotExist:
            return 0
        else:
            return cls.objects.filter(
                content_type=ct,
                object_id=obj_id
            ).aggregate(models.Sum('count'))['count__sum']
