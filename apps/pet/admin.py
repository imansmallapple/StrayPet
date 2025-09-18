# apps/pet/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Pet, Adoption


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ("id", "thumb", "name", "species", "breed", "status", "created_by", "add_date")
    readonly_fields = ("preview",)  # 让预览出现在详情页
    list_filter = ("status", "species", "add_date")
    search_fields = ("name", "species", "breed", "description", "location")
    autocomplete_fields = ("created_by",)
    fields = (
        "name", "species", "breed", "sex", "age_years", "age_months", "description",
        "location", "cover", "status", "created_by"
    )

    def thumb(self, obj):
        if obj.cover:
            return format_html(
                '<img src="{}" style="height:60px;width:60px;object-fit:cover;border-radius:6px;" />',
                obj.cover.url
            )
        return "—"

    thumb.short_description = "Photo"

    def preview(self, obj):
        url = obj.cover.url if obj and obj.cover else ""
        # 无图时也渲染一个隐藏的 img，方便 JS 直接改它的 src
        display = "block" if url else "none"
        return format_html(
            '<img id="cover-preview" src="{}" style="max-height:240px;border-radius:8px;display:{};" />',
            url, display
        )

    preview.short_description = "Preview"

    class Media:
        # 静态文件路径相对于 STATIC_URL
        js = ("pet/preview.js",)


@admin.register(Adoption)
class AdoptionApplicationAdmin(admin.ModelAdmin):
    list_display = ("id", "pet", "applicant", "status", "add_date")
    list_filter = ("status", "add_date")
    search_fields = ("message", "pet__name", "applicant__username")
    autocomplete_fields = ("pet", "applicant")