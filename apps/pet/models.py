# apps/pet/models.py
from django.db import models
from django.contrib.auth import get_user_model

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


# todo: simple use case:
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
        verbose_name_plural = "Adoption"
        ordering = ["-pub_date"]
        indexes = [models.Index(fields=["pet", "status"]), models.Index(fields=["applicant", "status"])]

    def __str__(self):
        return f"{self.applicant} -> {self.pet} ({self.status})"
