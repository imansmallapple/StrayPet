# apps/pet/filters.py
import django_filters as df
from .models import Pet


class PetFilter(df.FilterSet):
    species = df.CharFilter(field_name="species", lookup_expr="icontains")
    breed = df.CharFilter(field_name="breed", lookup_expr="icontains")
    status = df.CharFilter(field_name="status", lookup_expr="iexact")
    location = df.CharFilter(field_name="location", lookup_expr="icontains")
    min_age = df.NumberFilter(field_name="age_months", lookup_expr="gte")
    max_age = df.NumberFilter(field_name="age_months", lookup_expr="lte")

    class Meta:
        model = Pet
        fields = ["species", "breed", "status", "location", "min_age", "max_age"]
