"""
Script to generate missing avatars for users who don't have one yet
Run: python manage.py shell < generate_missing_avatars.py
"""
from django.contrib.auth import get_user_model
from apps.user.models import UserProfile
from apps.user.avatar_utils import generate_default_avatar

User = get_user_model()

# Find all users without avatars
users_without_avatars = User.objects.filter(
    profile__avatar__isnull=True
) | User.objects.filter(
    profile__avatar__exact=''
)

print(f"Found {users_without_avatars.count()} users without avatars")

for user in users_without_avatars:
    try:
        profile = user.profile
        if not profile.avatar:
            # Generate default avatar
            default_avatar = generate_default_avatar(user.username)
            # Save it
            profile.avatar.save(
                f'{user.username}_avatar.png',
                default_avatar,
                save=True
            )
            print(f"✓ Generated avatar for {user.username}")
        else:
            print(f"- {user.username} already has avatar")
    except Exception as e:
        print(f"✗ Error for {user.username}: {e}")

print("Done!")
