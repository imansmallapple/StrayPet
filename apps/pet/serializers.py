# apps/pet/serializers.py
from rest_framework import serializers
from .models import Pet, Adoption, DonationPhoto, Donation


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


class DonationPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationPhoto
        fields = ["id", "image"]


class DonationCreateSerializer(serializers.ModelSerializer):
    photos = serializers.ListField(child=serializers.ImageField(), write_only=True, required=False)

    class Meta:
        model = Donation
        fields = ["name", "species", "breed", "sex", "age_years", "age_months",
                  "description", "location", "dewormed", "vaccinated", "microchipped",
                  "is_stray", "contact_phone", "photos"]

    def create(self, validated_data):
        photos = validated_data.pop("photos", [])
        donation = Donation.objects.create(donor=self.context["request"].user, **validated_data)
        for img in photos[:8]:
            DonationPhoto.objects.create(donation=donation, image=img)
        return donation


class DonationDetailSerializer(serializers.ModelSerializer):
    photos = DonationPhotoSerializer(many=True, read_only=True)
    donor_name = serializers.CharField(source="donor.username", read_only=True)
    created_pet_id = serializers.IntegerField(source="created_pet.id", read_only=True)

    class Meta:
        model = Donation
        fields = ["id", "donor", "donor_name", "name", "species", "breed", "sex", "age_years", "age_months",
                  "description", "location", "dewormed", "vaccinated", "microchipped", "is_stray", "contact_phone",
                  "status", "reviewer", "review_note", "created_pet_id", "photos", "add_date", "pub_date"]
        read_only_fields = ["status", "reviewer", "review_note", "created_pet_id", "add_date", "pub_date"]
