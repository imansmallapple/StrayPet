# apps/pet/filters.py
import django_filters
import django_filters as df
from .models import Pet, Lost
from django.db import models
from django.db.models import Q


class PetFilter(df.FilterSet):
    species = df.CharFilter(field_name="species", lookup_expr="icontains")
    breed = df.CharFilter(field_name="breed", lookup_expr="icontains")
    status = df.CharFilter(field_name="status", lookup_expr="iexact")

    class Meta:
        model = Pet
        fields = ["species", "breed", "status"]


class LostFilter(df.FilterSet):
    q = df.CharFilter(method='search', label='Search')
    created_from = df.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_to = df.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    lost_from = df.DateTimeFilter(field_name='lost_time', lookup_expr='gte')
    lost_to = df.DateTimeFilter(field_name='lost_time', lookup_expr='lte')

    # 基于 Address 的过滤
    country = df.NumberFilter(field_name='address__country_id', lookup_expr='exact')
    region = df.NumberFilter(field_name='address__region_id', lookup_expr='exact')
    city = df.CharFilter(field_name='address__city__name', lookup_expr='icontains')

    class Meta:
        model = Lost
        fields = ['species', 'breed', 'color', 'sex', 'size', 'status', 'country', 'region', 'city']

    def search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(pet_name__icontains=value) |
            Q(address__city__name__icontains=value) |
            Q(address__region__name__icontains=value) |
            Q(address__country__name__icontains=value) |
            Q(description__icontains=value) |
            Q(color__icontains=value) |
            Q(breed__icontains=value)
        )
