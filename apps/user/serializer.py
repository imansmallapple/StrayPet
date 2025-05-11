from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def get_token_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterSerializer(serializers.ModelSerializer):
    # password = serializers.CharField(write_only=True)
    # password1 = serializers.CharField(write_only=True)
    # get user object
    tokens = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('username', 'password', 'password1', 'email', 'tokens')
        extra_kwargs = {
            'email': {
                'validators': [
                    UniqueValidator(queryset=User.objects.all(), message='Email already exists!')
                ]
            },
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
        return attrs

    def validate_password(self, password):
        validate_password(password)
        return password

    def get_tokens(self, obj):
        return get_token_for_user(obj)
