from django.db import models
from django.db.models import CharField


# Create your models here.
class BaseModel(models.Model):
    add_date = models.DateTimeField('add time', auto_now_add=True)
    pub_date = models.DateTimeField('update time', auto_now=True)

    class Meta:
        abstract = True


class Category(BaseModel):
    name = models.CharField('name', max_length=50)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        verbose_name="parent",
        blank=True,
        null=True
    )
    sort = models.IntegerField('sort', default=0)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = verbose_name
        ordering = ["-sort"]

    def __str__(self) -> CharField:
        return self.name


class Article(BaseModel):
    title = models.CharField("title", max_length=100)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        verbose_name='Category'
    )
    tags = models.ManyToManyField(
        'Tag',
        verbose_name='Tags',
        blank=True
    )

    class Meta:
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'
        ordering = ["-add_date"]

    def __str__(self) -> CharField:
        return self.title


class Tag(BaseModel):
    name = models.CharField(max_length=30, verbose_name='Tag name')

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ["-add_date"]

    def __str__(self) -> CharField:
        return self.name
