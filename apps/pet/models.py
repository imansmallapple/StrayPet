# apps/pet/models.py
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.safestring import mark_safe

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
    location = models.CharField("Location", max_length=120, blank=True, default="")

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
    location = models.CharField("Location", max_length=120, blank=True, default="")

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
        from django.db import transaction
        with transaction.atomic():
            if self.created_pet:
                return self.created_pet  # 避免重复创建

            if self.status not in ("submitted", "reviewing", "approved"):
                raise ValueError("Current status can't process")

            pet = Pet.objects.create(
                name=self.name, species=self.species, breed=self.breed, sex=self.sex,
                age_years=self.age_years, age_months=self.age_months,
                description=self.description, location=self.location,
                status=Pet.Status.AVAILABLE,
                created_by=self.donor,  # 或 reviewer/机构账号
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
