from django.contrib import admin
from django.contrib.auth.models import User
from .models import UserProfile
from django.contrib.auth.admin import UserAdmin

# Unlink registered user
admin.site.unregister(User)


# Define linked objects style
# StackedInline/TabularInline vertical/horizontal list

class UserProfileInline(admin.StackedInline):
    model = UserProfile  # Define link model


# Link UserProfile, here inherit UserAdmin
class UserProfileAdmin(UserAdmin):
    # Link UserProfile
    inlines = [UserProfileInline]


# Register User Model
admin.site.register(User, UserProfileAdmin)
