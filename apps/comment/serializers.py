from rest_framework import serializers
from .models import Comment
from apps.user.serializer import CaptchaSerializer


class CommentSerializer(CaptchaSerializer, serializers.ModelSerializer):
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ('content_type', 'object_id', 'add_date', 'pub_date')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        del attrs['captcha']
        del attrs['uid']
        return attrs
