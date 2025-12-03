from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from django.core.validators import RegexValidator

phone_validator = RegexValidator(
    regex=r'^\+?[0-9\- ]{6,20}$',
    message='Phone format incorrect（e.g.：+48 123-456-789 or 13800138000）'
)

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=32, blank=True, validators=[phone_validator])
    
    # Pet adoption preferences
    preferred_species = models.CharField(max_length=50, blank=True, help_text="偏好的物种（如：dog, cat）")
    preferred_size = models.CharField(max_length=50, blank=True, help_text="偏好的大小（如：small, medium, large）")
    preferred_age_min = models.IntegerField(null=True, blank=True, help_text="偏好的最小年龄（月）")
    preferred_age_max = models.IntegerField(null=True, blank=True, help_text="偏好的最大年龄（月）")
    preferred_gender = models.CharField(max_length=20, blank=True, help_text="偏好的性别（male/female）")
    has_experience = models.BooleanField(default=False, help_text="是否有养宠经验")
    living_situation = models.CharField(max_length=100, blank=True, help_text="居住环境（如：apartment, house）")
    has_yard = models.BooleanField(default=False, help_text="是否有院子")
    other_pets = models.CharField(max_length=200, blank=True, help_text="家中其他宠物")
    additional_notes = models.TextField(blank=True, help_text="其他偏好说明")

    def __str__(self):
        return f'Profile<{self.user.username}>'

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
