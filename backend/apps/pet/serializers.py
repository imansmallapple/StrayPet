# apps/pet/serializers.py
from rest_framework import serializers
import json
from .models import Pet, Adoption, DonationPhoto, Donation, Lost, Address, Country, Region, City


def _create_or_resolve_address(address_data: dict) -> Address:
    """
    Resolve or create Country/Region/City from provided strings or IDs and return an Address instance.
    address_data may contain: country, region, city, street, postal_code, building_number, latitude, longitude.
    """
    country = None
    region = None
    city = None

    if not address_data:
        raise ValueError("address_data is required")

    # Helper to normalize str
    def _norm(s):
        return str(s).strip() if s is not None else None

    cval = address_data.get('country')
    if cval is not None:
        if isinstance(cval, int):
            country = Country.objects.filter(pk=cval).first()
        else:
            cstr = _norm(cval)
            if len(cstr or '') == 2:
                country = Country.objects.filter(code__iexact=cstr).first()
            if not country:
                country = Country.objects.filter(name__iexact=cstr).first()
            if not country:
                # fallback: create with a guessed code
                code = ''.join([ch for ch in cstr if ch.isalpha()])[:2].upper() or 'XX'
                country, _ = Country.objects.get_or_create(code=code, defaults={'name': cstr or code})

    rval = address_data.get('region')
    if rval is not None:
        if isinstance(rval, int):
            region = Region.objects.filter(pk=rval).first()
        else:
            rstr = _norm(rval)
            if country:
                region = Region.objects.filter(country=country, name__iexact=rstr).first()
            if not region:
                region = Region.objects.filter(name__iexact=rstr).first()
            if not region and country:
                region, _ = Region.objects.get_or_create(country=country, name=rstr)

    ctyval = address_data.get('city')
    if ctyval is not None:
        if isinstance(ctyval, int):
            city = City.objects.filter(pk=ctyval).first()
        else:
            cstr = _norm(ctyval)
            if region:
                city = City.objects.filter(region=region, name__iexact=cstr).first()
            if not city:
                city = City.objects.filter(name__iexact=cstr).first()
            if not city and region:
                city, _ = City.objects.get_or_create(region=region, name=cstr)

    # If only city string provided and we didn't find a city, try find any city by name
    if not city and isinstance(address_data.get('city'), str):
        city = City.objects.filter(name__iexact=_norm(address_data.get('city'))).first()
        if city and not region:
            region = city.region
            country = city.region.country if city.region else country

    # Build Address kwargs
    addr_kwargs = {}
    if country:
        addr_kwargs['country'] = country
    if region:
        addr_kwargs['region'] = region
    if city:
        addr_kwargs['city'] = city
    if address_data.get('street'):
        addr_kwargs['street'] = _norm(address_data.get('street'))
    if address_data.get('building_number'):
        addr_kwargs['building_number'] = _norm(address_data.get('building_number'))
    if address_data.get('postal_code'):
        addr_kwargs['postal_code'] = _norm(address_data.get('postal_code'))
    # optional lat/lng
    if address_data.get('latitude') is not None:
        try:
            addr_kwargs['latitude'] = float(address_data.get('latitude'))
        except Exception:
            pass
    if address_data.get('longitude') is not None:
        try:
            addr_kwargs['longitude'] = float(address_data.get('longitude'))
        except Exception:
            pass

    addr = Address.objects.create(**addr_kwargs)
    return addr

from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework_gis.fields import GeometryField

class LostGeoSerializer(GeoFeatureModelSerializer):
    # 用 GeometryField 显式映射外键下的 geometry 字段
    geometry = GeometryField(source='address.location')

    class Meta:
        model = Lost
        geo_field = "geometry"
        fields = ("id", "status", "pet_name", "species", "breed", "color", "sex", "size", "reporter", "lost_time")

class PetListSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    applications_count = serializers.IntegerField(read_only=True, default=0)  # 预留统计字段
    age_display = serializers.SerializerMethodField()
    address_display = serializers.SerializerMethodField()
    photo = serializers.ImageField(source='cover', read_only=True)

    class Meta:
        model = Pet
        fields = (
            "id", "name", "species", "breed", "sex",
            "age_years", "age_months", "age_display",
            "description", "address_display", "cover", 'photo',
            "status", "created_by", "applications_count",
            "add_date", "pub_date"
        )
        read_only_fields = ("status", "created_by", "applications_count", "add_date", "pub_date")

    def get_age_display(self, obj: Pet) -> str:
        y = obj.age_years or 0
        m = obj.age_months or 0
        if y and m:
            return f"{y}y {m}m"
        if y:
            return f"{y}y"
        if m:
            return f"{m}m"
        return "0m"

    def get_address_display(self, obj: Pet) -> str:
        if not obj.address_id:
            return "-"
        a = obj.address
        parts = [
            a.street, a.building_number,
            a.city.name if a.city_id else "",
            a.region.name if a.region_id else "",
            a.country.name if a.country_id else "",
            a.postal_code,
        ]
        return ", ".join([p for p in parts if p])


class PetCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = (
            "id", "name", "species", "breed", "sex", "age_months",
            "description", "address", "cover", "status"
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
    # 支持嵌套地址数据（参考 LostSerializer）
    address_data = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = Donation
        fields = ["name", "species", "breed", "sex", "age_years", "age_months",
                  "description", "address", "address_data", "dewormed", "vaccinated", "microchipped",
                  "is_stray", "contact_phone", "photos"]

    def create(self, validated_data):
        photos = validated_data.pop("photos", [])
        address_data = validated_data.pop('address_data', None)
        if address_data:
            # Accept JSON string or dict
            if isinstance(address_data, str):
                try:
                    address_data = json.loads(address_data)
                except Exception:
                    address_data = None
            if address_data:
                address = _create_or_resolve_address(address_data)
                validated_data['address'] = address
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
                  "description", "address", "dewormed", "vaccinated", "microchipped", "is_stray", "contact_phone",
                  "status", "reviewer", "review_note", "created_pet_id", "photos", "add_date", "pub_date"]
        read_only_fields = ["status", "reviewer", "review_note", "created_pet_id", "add_date", "pub_date"]


class LostSerializer(serializers.ModelSerializer):
    reporter_username = serializers.ReadOnlyField(source='reporter.username')
    country = serializers.IntegerField(source='address.country_id', read_only=True)
    region = serializers.IntegerField(source='address.region_id', read_only=True)
    city = serializers.CharField(source='address.city.name', read_only=True)
    photo_url = serializers.SerializerMethodField(read_only=True)

    # 新增：嵌套地址字段
    address_data = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = Lost
        fields = [
            'id', 'pet_name', 'species', 'breed', 'color', 'sex', 'size',
            'address', 'address_data',  # ✅ 新增
            'country', 'region', 'city',
            'lost_time', 'description', 'reward', 'photo', 'photo_url',
            'status', 'reporter', 'reporter_username',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('reporter', 'created_at', 'updated_at')

    def create(self, validated_data):
        address_data = validated_data.pop('address_data', None)
        if address_data:
            # Allow JSON string input in multipart/form-data
            if isinstance(address_data, str):
                try:
                    address_data = json.loads(address_data)
                except Exception:
                    address_data = None
            if address_data:
                address = _create_or_resolve_address(address_data)
                validated_data['address'] = address
        return super().create(validated_data)

    def get_photo_url(self, obj):
        try:
            if obj.photo and hasattr(obj.photo, 'url'):
                request = self.context.get('request')
                url = obj.photo.url
                return request.build_absolute_uri(url) if request else url
        except Exception:
            pass
        return None
