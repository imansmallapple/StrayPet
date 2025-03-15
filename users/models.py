from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# Create your models here.

class UserProfile(models.Model):
    USER_GENDER_TYPE = (
        ('male', 'man'),
        ('female', 'woman')
    )

    owner = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='User')
    nick_name = models.CharField('Nickname', max_length=30, blank=True, default='')
    desc = models.TextField('Personal Description', max_length=200, blank=True, default='')
    motto = models.CharField('Motto', max_length=100, blank=True, default='')
    birth = models.DateField('Birth', null=True, blank=True)
    gender = models.CharField('Gender', max_length=6, choices=USER_GENDER_TYPE, default='')
    address = models.CharField('Address', max_length=100, blank=True, default='')
    image = models.ImageField(upload_to='images/%Y/%m', default='images/default.png', max_length=100,
                              verbose_name='Avatar')

    class Meta:
        verbose_name = 'User Data'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.owner.name

