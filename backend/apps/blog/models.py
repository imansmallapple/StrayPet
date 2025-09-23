from django.db import models
from django.db.models import CharField
from django.utils.text import Truncator
from django.utils.html import strip_tags
from django.contrib.contenttypes.fields import GenericRelation
from apps.user.models import ViewStatistics
from apps.comment.models import Comment


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
    description = models.CharField('description', max_length=200, blank=True, default="")
    content = models.TextField('content')
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
    view_count = GenericRelation(ViewStatistics, verbose_name="View Statistics")
    comments = GenericRelation(Comment, verbose_name="comment")

    class Meta:
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'
        ordering = ["-add_date"]

    def __str__(self) -> CharField:
        return self.title

    def save(self, *args, **kwargs):
        if not self.description:
            self.description = strip_tags(
                Truncator(self.get_markdown()).chars(190)
            ).replace("\n", "").replace("\r", "").replace(" ", "")
        super().save(*args, **kwargs)

    def get_markdown(self):
        markdown = self._get_markdown_obj()
        return markdown.convert(self.content)

    def get_toc(self):
        markdown = self._get_markdown_obj()
        markdown.convert(self.content)
        return markdown.toc

    def _get_markdown_obj(self):
        import markdown
        markdown = markdown.Markdown(extensions=[
            'markdown.extensions.extra',
            'markdown.extensions.codehilite',
            'markdown.extensions.toc',
        ])
        return markdown


class Tag(BaseModel):
    name = models.CharField(max_length=30, verbose_name='Tag name')

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ["-add_date"]

    def __str__(self) -> str:
        return f"{self.id}:{self.name}"
