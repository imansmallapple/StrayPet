from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny
from django.core.cache import cache

User = get_user_model()


def get_token_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class VerifyEmailCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, label='Email')
    code = serializers.CharField(
        required=True,
        label='Verification Code',
        max_length=4,
        min_length=4,
        write_only=True
    )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        from django.core.cache import cache
        item_code = cache.get(attrs['email'])
        if item_code != attrs['code']:
            raise serializers.ValidationError('Code wrong!')
        return attrs
    
class UserMeSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='profile.phone', allow_blank=True, required=False)
    preferred_species = serializers.CharField(source='profile.preferred_species', allow_blank=True, required=False)
    preferred_size = serializers.CharField(source='profile.preferred_size', allow_blank=True, required=False)
    preferred_age_min = serializers.IntegerField(source='profile.preferred_age_min', allow_null=True, required=False)
    preferred_age_max = serializers.IntegerField(source='profile.preferred_age_max', allow_null=True, required=False)
    preferred_gender = serializers.CharField(source='profile.preferred_gender', allow_blank=True, required=False)
    has_experience = serializers.BooleanField(source='profile.has_experience', required=False)
    living_situation = serializers.CharField(source='profile.living_situation', allow_blank=True, required=False)
    has_yard = serializers.BooleanField(source='profile.has_yard', required=False)
    other_pets = serializers.CharField(source='profile.other_pets', allow_blank=True, required=False)
    additional_notes = serializers.CharField(source='profile.additional_notes', allow_blank=True, required=False)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "phone", 
                  "preferred_species", "preferred_size", "preferred_age_min", "preferred_age_max",
                  "preferred_gender", "has_experience", "living_situation", "has_yard", 
                  "other_pets", "additional_notes")
        extra_kwargs = {
            "username": {"required": False},
            "email": {"required": False},
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if profile_data:
            profile = getattr(instance, 'profile', None)
            if profile:
                for attr, value in profile_data.items():
                    setattr(profile, attr, value)
                profile.save()

        return instance

class RegisterSerializer(VerifyEmailCodeSerializer, serializers.ModelSerializer):
    # password = serializers.CharField(write_only=True)
    password1 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    # get user object
    tokens = serializers.SerializerMethodField()
    email = serializers.EmailField(required=True, label='email',
                                   validators=[UniqueValidator(queryset=User.objects.all(),
                                                               message='Email already exists!')
                                               ])

    class Meta:
        model = User
        fields = ('username', 'password', 'password1', 'email', 'tokens', 'code')
        extra_kwargs = {
            # 'email': {
            #     'validators': [
            #         UniqueValidator(queryset=User.objects.all(), message='Email already exists!')
            #     ]
            # },
            'password': {
                'write_only': True,
                'style': {'input_type': 'password'}
            },
            'password1': {
                'write_only': True,
                'style': {'input_type': 'password'}
            },
        }

    def validate(self, attrs):
        print(attrs)
        if attrs['password'] != attrs['password1']:
            raise serializers.ValidationError('Repeat password incorrect!')
        attrs = super().validate(attrs)
        attrs['password'] = make_password(attrs['password'])
        del attrs['password1']
        del attrs['code']
        return attrs

    def validate_password(self, password):
        validate_password(password)
        return password

    def get_tokens(self, obj):
        return get_token_for_user(obj)


class SendEmailCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, label='Email')


class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class UpdateEmailSerializer(VerifyEmailCodeSerializer, serializers.ModelSerializer):
    email = serializers.EmailField(required=True, label='Email', validators=[
        UniqueValidator(queryset=User.objects.all(), message='Email already exists!')
    ])

    class Meta:
        model = User
        fields = ('id', 'email', 'code')

        def validate(self, attrs):
            attrs = super().validate(attrs)
            del attrs['code']
            return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    permission_classes = [AllowAny]
    authentication_classes = []  
    def validate(self, attrs):
        # 不暴露用户是否存在；如果要提示不存在，可在此查表并返回 ValidationError
        attrs["user_exists"] = User.objects.filter(email=attrs["email"]).exists()
        return attrs

class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=4, min_length=4, write_only=True)
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    re_new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    permission_classes = [AllowAny]
    authentication_classes = [] 
    
    def validate(self, attrs):
        if attrs["new_password"] != attrs["re_new_password"]:
            raise serializers.ValidationError("Repeat password incorrect!")
        validate_password(attrs["new_password"])  # 走 Django 密码强度校验

        real = cache.get(attrs["email"])
        if not real:
            raise serializers.ValidationError("Verification code expired!")
        if real != attrs["code"]:
            raise serializers.ValidationError("Code wrong!")

        try:
            attrs["user"] = User.objects.get(email=attrs["email"])
        except User.DoesNotExist:
            # 保持一致性：不暴露是否存在
            raise serializers.ValidationError("Invalid email or code.")
        return attrs

class ChangePasswordSerializer(serializers.ModelSerializer):
    old_password = serializers.CharField(
        required=True,
        label='Old Password',
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('id', 'old_password', 'password')
        extra_kwargs = {
            'password': {
                'write_only': True,
                'style': {'input_type': 'password'}
            },
        }

    def validate_old_password(self, old_password):
        if not self.instance.check_password(old_password):
            raise serializers.ValidationError('Old password incorrect!')
        return old_password

    def validate(self, attrs):
        attrs = super().validate(attrs)
        del attrs['old_password']
        return attrs


class CaptchaSerializer(serializers.Serializer):
    captcha = serializers.CharField(
        label="Verification code",
        max_length=4,
        min_length=4,
        write_only=True
    )
    uid = serializers.CharField(
        label='Verification code id',
        max_length=100,
        min_length=10,
        write_only=True
    )

    def validate(self, attrs):
        from django.core.cache import cache

        if not cache.get(attrs['uid']):
            raise serializers.ValidationError("Verification code expired!")

        if cache.get(attrs['uid']).lower() != attrs['captcha'].lower():
            raise serializers.ValidationError("Verification code wrong!")
        cache.delete(attrs['uid'])
        return super().validate(attrs)


class LoginSerializer(CaptchaSerializer, TokenObtainPairSerializer):
    pass


class UploadImageSerializer(serializers.Serializer):
    image = serializers.ImageField(label="Image", required=True)

    def validate(self, attrs):
        if attrs['image'].size > 2 * 1024 * 1024:
            raise serializers.ValidationError("Image size can't bigger than 2M")
        return super().validate(attrs)


# apps/user/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers

class UserListSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='profile.phone', allow_blank=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone')


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """
    允许通过 kwargs['fields'] / kwargs['exclude'] 动态裁剪字段
    """
    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('fields', None)
        exclude = kwargs.pop('exclude', None)
        super().__init__(*args, **kwargs)
        if fields is not None:
            allowed = set(fields)
            for f in list(self.fields.keys()):
                if f not in allowed:
                    self.fields.pop(f)
        if exclude is not None:
            for f in exclude:
                self.fields.pop(f, None)

class UserDetailSerializer(DynamicFieldsModelSerializer):
    # 把 phone 映射到 profile.phone
    phone = serializers.CharField(source='profile.phone', allow_blank=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name',
                  'phone', 'is_staff', 'date_joined', 'last_login')
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }

    # 唯一性校验
    def validate_username(self, v):
        if not v:
            return v
        user = self.instance or self.context.get('request').user
        if User.objects.exclude(pk=user.pk).filter(username=v).exists():
            raise serializers.ValidationError('该用户名已被占用')
        return v

    def validate_email(self, v):
        if not v:
            return v
        user = self.instance or self.context.get('request').user
        if User.objects.exclude(pk=user.pk).filter(email=v).exists():
            raise serializers.ValidationError('该邮箱已被占用')
        return v

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        # 更新 User 字段
        for attr in ['username', 'first_name', 'last_name', 'email']:
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])
        instance.save()
        # 更新 phone
        if 'phone' in profile_data:
            profile = getattr(instance, 'profile', None)
            if profile is None:
                from .models import UserProfile
                profile = UserProfile.objects.create(user=instance)
            profile.phone = profile_data.get('phone') or ''
            profile.full_clean()
            profile.save()
        return instance