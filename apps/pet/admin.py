# apps/pet/admin.py
from django.contrib import admin, messages
from django.utils.html import format_html
from .models import Pet, Adoption, DonationPhoto, Donation, Country, Region, City, Address


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ("id", "thumb", "name", "species", "breed", "status", "address", "created_by", "add_date")
    readonly_fields = ("preview",)
    list_filter = ("status", "species", "add_date")
    search_fields = ("name", "species", "breed", "description", "address")
    autocomplete_fields = ("created_by",)
    fields = (
        "name", "species", "breed", "sex", "age_years", "age_months", "description",
        "address", "cover", "status", "created_by"
    )

    def addr(self, obj):
        # 若你引入了 Address 外键
        if hasattr(obj, "address") and obj.address:
            return str(obj.address)
        # 兼容老数据
        return getattr(obj, "location", "") or "—"

    addr.short_description = "Location / Address"

    def thumb(self, obj):
        if obj.cover:
            return format_html(
                '<img src="{}" style="height:60px;width:60px;object-fit:cover;border-radius:6px;" />',
                obj.cover.url
            )
        return "—"

    thumb.short_description = "Photo"

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        formfield = super().formfield_for_foreignkey(db_field, request, **kwargs)
        if db_field.name in ("country", "region", "city"):
            w = formfield.widget
            w.can_add_related = False
            w.can_change_related = False
            w.can_delete_related = False
            w.can_view_related = False
        return formfield

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


class DonationPhotoInline(admin.TabularInline):
    model = DonationPhoto
    extra = 0
    readonly_fields = ("preview",)
    fields = ("preview", "image")


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "species", "sex", "donor", "status", "created_pet", "add_date")
    list_filter = ("status", "species", "sex", "add_date")
    search_fields = ("name", "species", "breed", "donor__username")
    inlines = [DonationPhotoInline]
    readonly_fields = ("created_pet",)  # Create temp pet to avoid polluting pet pool
    exclude = ("reviewer",)
    actions = ["approve_and_create_pet", "close_donation"]
    autocomplete_fields = ()
    fields = (
        # 你的 Donation 基本字段...
        "name", "species", "breed", "sex", "age_years", "age_months", "description",
        "address",  # ← 新增：结构化地址（点击进入地址创建/选择页）
        "status", "created_pet", "donor"
    )

    def save_model(self, request, obj, form, change):
        # 如果当前用户是管理员（is_staff），并且 reviewer 还没填，则写入
        if request.user.is_staff and not obj.reviewer:
            obj.reviewer = request.user
        # 检测“状态是否从 非approved -> approved”
        to_approved = False
        if change:
            prev = Donation.objects.get(pk=obj.pk)
            to_approved = (prev.status != "approved" and obj.status == "approved")

        super().save_model(request, obj, form, change)

        # 触发创建 Pet（仅当尚未创建过）
        if to_approved and not obj.created_pet:
            obj.approve(reviewer=request.user, note="Approved in admin (edit form)")

    def has_change_permission(self, request, obj=None):
        if obj and obj.status == "closed":
            return False  # 关闭后彻底不可编辑
        return super().has_change_permission(request, obj)


@admin.action(description="Review pass and create pet")
def approve_and_create_pet(modeladmin, request, queryset):
    ok, fail = 0, 0
    for d in queryset:
        try:
            d.approve(reviewer=request.user, note="Approved in admin")
            ok += 1
        except Exception as e:
            fail += 1
    messages.info(request, f"Finish: Pass {ok} time(s); Fail {fail} time(s)")


@admin.action(description="Close donation (lock editing)")
def close_donation(modeladmin, request, queryset):
    updated = queryset.exclude(status="closed").update(status="closed")
    messages.info(request, f"Closed {updated} item(s).")


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("__str__", "country", "region", "city", "street", "building_number", "postal_code")
    list_filter = ("country", "region", "city")
    search_fields = ("country__name", "region__name", "city__name", "street", "building_number", "postal_code")
    fields = ("country", "region", "city", "street", "building_number", "postal_code", "latitude", "longitude")
