# apps/user/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import UserProfile
from .avatar_utils import generate_default_avatar

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile(sender, instance, created, **kwargs):
    if created:
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        # Generate and save default avatar if not already set
        if not profile.avatar:
            default_avatar = generate_default_avatar(instance.username)
            profile.avatar.save(f'{instance.username}_avatar.png', default_avatar, save=True)
