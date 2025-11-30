# apps/pet/models.py
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.safestring import mark_safe
from smart_selects.db_fields import ChainedForeignKey
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.contrib.postgres.indexes import GistIndex
from django.db import transaction
import bleach
User = get_user_model()


class Pet(models.Model):
    SEX_CHOICES = (
        ("male", "Male"),
        ("female", "Female"),
    )

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"  # 草稿，仅发布者可见
        AVAILABLE = "available", "Available"  # 可申请/公开
        PENDING = "pending", "Pending"  # 处理中（比如有申请）
        ADOPTED = "adopted", "Adopted"  # 已被领养/转让
        ARCHIVED = "archived", "Archived"  # 下架/归档
        LOST = "lost", "Lost"

    name = models.CharField("Pet Name", max_length=80)
    species = models.CharField("Species", max_length=40)  # cat/dog/…
    breed = models.CharField("Breed", max_length=80, blank=True, default="")

    sex = models.CharField(
        "Sex",
        max_length=10,
        choices=SEX_CHOICES,
        default="male"
    )

    age_years = models.PositiveIntegerField("Age (years)", default=0)
    age_months = models.PositiveIntegerField("Age (months)", default=0)
    description = models.TextField("Description", blank=True, default="")
    address = models.ForeignKey(
        "pet.Address", on_delete=models.SET_NULL, null=True, blank=True, related_name="pets", verbose_name="Address"
    )
    # 新增通用 location 外键（用于兼容 Map 渲染），优先使用 location
    location = models.ForeignKey(
        'pet.Location', on_delete=models.SET_NULL, null=True, blank=True, related_name='pet_locations',
        verbose_name='Location')
    cover = models.ImageField("Cover", upload_to="pets/", blank=True, null=True)

    status = models.CharField(
        "Status", max_length=20, choices=Status.choices,
        default=Status.AVAILABLE, db_index=True
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="pets", verbose_name="Owner"
    )

    add_date = models.DateTimeField("Created At", auto_now_add=True)
    pub_date = models.DateTimeField("Updated At", auto_now=True)

    class Meta:
        verbose_name = "Pet"
        verbose_name_plural = "Pets"
        ordering = ["-pub_date"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["species", "breed"]),
            models.Index(fields=["created_by"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.species})"


# simple use case:
# when user submit application, if pet available, status change into pending
# when application approved, pet status change into adopted and close all other unclosed applications from this pet
# when application close or refused, if there is no other application, pet status change back to available
class Adoption(models.Model):
    STATUS_CHOICES = (
        ("submitted", "Submitted"),
        ("processing", "Processing"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("closed", "Closed"),
    )

    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="applications")
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pet_adoption")
    message = models.TextField("Message to Owner", blank=True, default="")
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default="submitted", db_index=True)

    add_date = models.DateTimeField("Created At", auto_now_add=True)
    pub_date = models.DateTimeField("Updated At", auto_now=True)

    def clean(self):
        super().clean()
        if self.pet and self.pet.status == Pet.Status.LOST:
            raise ValidationError({"pet": "This pet is reported LOST and cannot be adopted."})

    class Meta:
        verbose_name = "Adoption"
        verbose_name_plural = "Adoptions"
        ordering = ["-pub_date"]
        indexes = [models.Index(fields=["pet", "status"]), models.Index(fields=["applicant", "status"])]

    def __str__(self):
        return f"{self.applicant} -> {self.pet} ({self.status})"


# todo: Reviewer默认设置为当前
class Donation(models.Model):
    STATUS_CHOICES = (
        ("submitted", "Submitted"),
        ("reviewing", "Reviewing"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("closed", "Closed"),  # ← 新增
    )

    donor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pet_donor")

    # 基础信息（用于生成 Pet）
    name = models.CharField("Pet Name", max_length=80)
    species = models.CharField("Species", max_length=40)  # cat/dog/…
    breed = models.CharField("Breed", max_length=80, blank=True, default="")
    sex = models.CharField("Sex", max_length=10, choices=(("male", "Male"), ("female", "Female")), default="male")
    age_years = models.PositiveIntegerField("Age (years)", default=0)
    age_months = models.PositiveIntegerField("Age (months)", default=0)
    description = models.TextField("Description", blank=True, default="")
    address = models.ForeignKey(
        "pet.Address", on_delete=models.SET_NULL, null=True, blank=True, related_name="donations",
        verbose_name="Address"
    )
    # 新增 location 外键，优先使用 location 作为渲染来源
    location = models.ForeignKey(
        'pet.Location', on_delete=models.SET_NULL, null=True, blank=True, related_name='donation_locations',
        verbose_name='Location')
    # 健康与背景（可选）
    dewormed = models.BooleanField("Dewormed", default=False)
    vaccinated = models.BooleanField("Vaccinated", default=False)
    microchipped = models.BooleanField("Microchipped", default=False)
    is_stray = models.BooleanField("Found as Stray", default=False)
    contact_phone = models.CharField("Contact Phone", max_length=30, blank=True, default="")

    # 审核流
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default="submitted", db_index=True)
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name="donation_reviewed")
    review_note = models.CharField("Review Note", max_length=200, blank=True, default="")

    # 审核通过后关联生成的 Pet
    created_pet = models.OneToOneField(Pet, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name="from_donor")

    add_date = models.DateTimeField("Created At", auto_now_add=True)
    pub_date = models.DateTimeField("Updated At", auto_now=True)

    class Meta:
        verbose_name = "Donation"
        verbose_name_plural = "Donations"
        ordering = ["-pub_date"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["donor"]),
        ]

    def __str__(self):
        return f"{self.donor} -> {self.name} ({self.species}) [{self.status}]"

    # —— 审核通过时自动创建 Pet，并将第一张图设为封面 ——
    def approve(self, reviewer, note=""):

        with transaction.atomic():
            if self.created_pet:
                return self.created_pet  # 避免重复创建

            if self.status not in ("submitted", "reviewing", "approved"):
                raise ValueError("Current status can't process")

            # sanitize rich HTML content from donation before creating Pet
            safe_description = None
            try:
                # allow some commonly used HTML tags and attributes
                allowed_tags = [
                    'p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'img',
                    'h1', 'h2', 'h3', 'blockquote'
                ]
                allowed_attrs = {
                    'a': ['href', 'title', 'rel', 'target'],
                    'img': ['src', 'alt', 'title'],
                }
                safe_description = bleach.clean(self.description or '', tags=allowed_tags, attributes=allowed_attrs)
            except Exception:
                safe_description = (self.description or '')

            pet_location = self.location
            # 如果 Donation 还没有 location，但 Address 里有经纬度，可以顺便克隆一份 Location（可选）
            if not pet_location and self.address and self.address.latitude is not None and self.address.longitude is not None:
                try:
                    pet_location = Location.objects.create(
                        country_code = getattr(self.address.country, 'code', '') or '',
                        country_name = getattr(self.address.country, 'name', '') or '',
                        region       = getattr(self.address.region, 'name', '') or '',
                        city         = getattr(self.address.city, 'name', '') or '',
                        street       = self.address.street or '',
                        postal_code  = self.address.postal_code or '',
                        latitude     = self.address.latitude,
                        longitude    = self.address.longitude,
                        location     = self.address.location  # PointField 可直接复用
                    )
                except Exception:
                    pet_location = None  # 出错就算了，不影响主流程

            pet = Pet.objects.create(
                name=self.name, species=self.species, breed=self.breed, sex=self.sex,
                age_years=self.age_years, age_months=self.age_months,
                description=safe_description,
                address=self.address,          # 兼容老逻辑，先保留
                location=pet_location,         # ✅ 新增：把 Donation.location 传给 Pet.location
                status=Pet.Status.AVAILABLE,
                created_by=self.donor,
            )
            
            first = self.photos.order_by("id").first()
            if first and first.image:
                try:
                    # 确保文件句柄可读
                    first.image.open("rb")
                    data = first.image.read()
                    # 生成新文件名（避免重名）
                    orig_name = first.image.name.split("/")[-1]  # e.g. pet1.png
                    target_path = f"pets/{pet.id}_{orig_name}"
                    saved_path = default_storage.save(target_path, ContentFile(data))
                    pet.cover.name = saved_path
                    pet.save(update_fields=["cover"])
                except Exception:
                    # 出错也不阻断主流程
                    pass
                finally:
                    try:
                        first.image.close()
                    except Exception:
                        pass

            self.created_pet = pet
            self.status = "approved"
            self.reviewer = reviewer
            self.review_note = note
            self.save(update_fields=["created_pet", "status", "reviewer", "review_note", "pub_date"])
            return pet


class DonationPhoto(models.Model):
    """ 多图上传；第一张作为 Pet 封面 """
    donation = models.ForeignKey(Donation, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="donations/")
    add_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def preview(self):
        if self.image and hasattr(self.image, "url"):
            return mark_safe(f'<img src="{self.image.url}" width="120" style="border-radius:8px;" />')
        return "(no image)"

    preview.short_description = "Preview"


# Address related models
class Country(models.Model):
    code = models.CharField(max_length=2, unique=True)  # ISO 3166-1 alpha-2, 如 "PL"
    name = models.CharField(max_length=64)

    class Meta:
        ordering = ["name"]
        verbose_name = "Country"
        verbose_name_plural = "Countries"

    def __str__(self): return self.name


class Region(models.Model):  # 省/州
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="regions")
    code = models.CharField(max_length=10)  # ISO 3166-2 (可选)
    name = models.CharField(max_length=64)

    class Meta:
        unique_together = ("country", "name")
        ordering = ["name"]
        verbose_name = "Region"
        verbose_name_plural = "Regions"
        indexes = [models.Index(fields=["country", "name"])]

    def __str__(self): return self.name


class City(models.Model):
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="cities")
    name = models.CharField(max_length=64)

    class Meta:
        unique_together = ("region", "name")
        ordering = ["name"]
        verbose_name = "City"
        verbose_name_plural = "Cities"
        indexes = [models.Index(fields=["region", "name"])]

    def __str__(self): return self.name


class Address(models.Model):
    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, verbose_name="Country",
        null=True, blank=True  # ← 允许空（第一次迁移更顺滑）
    )
    region = ChainedForeignKey(
        Region, on_delete=models.PROTECT, verbose_name="Region",
        chained_field="country", chained_model_field="country",
        show_all=False, auto_choose=True, sort=True,
        null=True, blank=True  # ← 允许空
    )
    city = ChainedForeignKey(
        City, on_delete=models.PROTECT, verbose_name="City",
        chained_field="region", chained_model_field="region",
        show_all=False, auto_choose=False, sort=True,
        null=True, blank=True  # ← 允许空
    )
    street = models.CharField("Street", max_length=128, blank=True, default="")
    building_number = models.CharField("Building No.", max_length=16, blank=True, default="")
    postal_code = models.CharField("Postal Code", max_length=20, blank=True, default="")
    latitude = models.DecimalField("Lat", max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField("Lng", max_digits=9, decimal_places=6, null=True, blank=True)
  # ✅ 新增：地理点（WGS84，经纬度）
    location  = gis_models.PointField(srid=4326, geography=True, null=True, blank=True)

    class Meta:
        ordering = ["country", "region", "city", "street"]
        verbose_name = "Address"
        verbose_name_plural = "Addresses"
        indexes = [
            models.Index(fields=["country", "region", "city"]),
            models.Index(fields=["postal_code"]),
            GistIndex(fields=["location"], name="idx_address_location_gist"),
        ]

    def __str__(self):
        parts = [
            self.street, self.building_number,
            self.city.name if self.city_id else "",
            self.region.name if self.region_id else "",
            self.country.name if self.country_id else "",
            self.postal_code,
        ]
        return ", ".join([p for p in parts if p]) or "Address"


# 新的更简单的地理位置模型，替代之前复杂的 Address 以便前端轻松传输 location_data
class Location(models.Model):
    country_code = models.CharField(max_length=8, blank=True, default='')
    country_name = models.CharField(max_length=128, blank=True, default='')
    region = models.CharField(max_length=128, blank=True, default='')
    city = models.CharField(max_length=128, blank=True, default='')
    street = models.CharField(max_length=128, blank=True, default='')
    postal_code = models.CharField(max_length=20, blank=True, default='')
    latitude = models.DecimalField("Lat", max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField("Lng", max_digits=9, decimal_places=6, null=True, blank=True)
    location = gis_models.PointField(srid=4326, geography=True, null=True, blank=True)

    class Meta:
        verbose_name = "Location"
        verbose_name_plural = "Locations"
        ordering = ["country_name", "region", "city", "street"]

    def __str__(self):
        parts = [self.street, self.city, self.region, self.country_name, self.postal_code]
        return ", ".join([p for p in parts if p]) or "Location"


class LostStatus(models.TextChoices):
    OPEN = "open", "Open"  # 待寻找
    FOUND = "found", "Found"  # 已找到
    CLOSED = "closed", "Closed"  # 关闭/无效


def lost_upload_to(instance, filename):
    return f"lost/{instance.id or 'new'}/{filename}"


# todo: 需要新增宠物状态 Lost
# Lost的宠物不可以收养
class Lost(models.Model):
    pet = models.ForeignKey('Pet', null=True, blank=True,
                            on_delete=models.SET_NULL, related_name='lost_reports')
    pet_name = models.CharField("Pet Name", max_length=80, blank=True, default="")

    species = models.CharField(max_length=50, help_text="cat/dog/…")
    breed = models.CharField(max_length=100, blank=True, default="")
    color = models.CharField(max_length=100, blank=True, default="")
    sex = models.CharField("Sex", max_length=10, choices=(("male", "Male"), ("female", "Female")), default="male")
    size = models.CharField(max_length=20, blank=True, default="")  # small/medium/large

    # 与 Donation 一致，使用 Address 外键（Country→Region→City 级联在 Address 中完成）
    address = models.ForeignKey(
        "pet.Address", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="losts", verbose_name="Address"
    )

    lost_time = models.DateTimeField(help_text="Lost time (local)")
    description = models.TextField(blank=True, default="")
    reward = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    photo = models.ImageField(upload_to=lost_upload_to, null=True, blank=True)

    status = models.CharField(max_length=20, choices=LostStatus.choices, default=LostStatus.OPEN)
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='lost_reports')
    contact_phone = models.CharField(max_length=50, blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Lost"
        verbose_name_plural = "Losts"

    def __str__(self):
        base = self.pet_name or f"{self.species} ({self.color})"
        if self.address_id:
            parts = [
                self.address.city.name if self.address and self.address.city_id else "",
                self.address.region.name if self.address and self.address.region_id else "",
                self.address.country.name if self.address and self.address.country_id else "",
            ]
            loc = ", ".join([p for p in parts if p])
            return f"[{self.get_status_display()}] {base}" + (f" @ {loc}" if loc else "")
        return f"[{self.get_status_display()}] {base}"
