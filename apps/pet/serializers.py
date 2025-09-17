# apps/pet/serializers.py
from rest_framework import serializers
from .models import Pet


class PetListSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    applications_count = serializers.IntegerField(read_only=True, default=0)  # 预留统计字段

    class Meta:
        model = Pet
        fields = (
            "id", "name", "species", "breed", "sex",
            "age_years", "age_months", "age_display",
            "description", "location", "cover",
            "status", "created_by", "applications_count",
            "add_date", "pub_date"
        )
        read_only_fields = ("status", "created_by", "applications_count", "add_date", "pub_date")


class PetCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = (
            "id", "name", "species", "breed", "sex", "age_months",
            "description", "location", "cover", "status"
        )
        read_only_fields = ("status",)  # 创建默认 AVAILABLE；如需修改在视图层控制
