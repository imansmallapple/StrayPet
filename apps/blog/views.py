import json

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.generic import View
from django.core import serializers

from apps.blog.models import Category


class CategoryAPIView(View):

    def get(self, request, *args, **kwargs):
        queryset = Category.objects.all()
        data = serializers.serialize('json', queryset)
        data = json.loads(data)
        return JsonResponse({'result': data})
