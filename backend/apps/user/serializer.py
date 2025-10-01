from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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
