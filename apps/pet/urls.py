# apps/pet/urls.py
from rest_framework.routers import DefaultRouter
from .views import PetViewSet

router = DefaultRouter()
router.register("pet", PetViewSet, basename="pet")

urlpatterns = [*router.urls]
