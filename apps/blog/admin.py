from django.contrib import admin

# Register your models here.
from apps.blog.models import Category, Article, Tag


# admin.site.register([Category, Article, Tag])

class CategoryTable(admin.TabularInline):
    model = Category
    extra = 1  # 多级分类


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'sort', 'add_date', 'pub_date')
    list_editable = ('sort',)
    search_fields = ('name',)
    search_help_text = "Search by category name"
    list_filter = ('name',)
    exclude = ('parent',)
    inlines = [
        CategoryTable
    ]

# admin.site.register(Category, CategoryAdmin)
