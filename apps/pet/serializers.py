# apps/pet/serializers.py
from rest_framework import serializers
from .models import Pet, Adoption


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


class AdoptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Adoption
        fields = ("id", "pet", "message", "status", "add_date", "pub_date")
        read_only_fields = ("status", "add_date", "pub_date")

    def validate(self, attrs):
        pet = attrs["pet"]
        if pet.status not in (Pet.Status.AVAILABLE, Pet.Status.PENDING):
            raise serializers.ValidationError("This pet is not available for adoption.")
        return attrs


class AdoptionDetailSerializer(serializers.ModelSerializer):
    pet = PetListSerializer(read_only=True)  # 你已有的列表/详情序列化器
    applicant = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Adoption
        fields = ("id", "pet", "applicant", "message", "status", "add_date", "pub_date")


class AdoptionReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Adoption
        fields = ("status",)