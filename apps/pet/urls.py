# apps/pet/urls.py
from rest_framework.routers import DefaultRouter
from .views import PetViewSet, AdoptionViewSet, LostViewSet
router = DefaultRouter()
router.register("pet", PetViewSet, basename="pet")
router.register("adoption", AdoptionViewSet, basename="pet-application")
router.register(r'losts', LostViewSet, basename='lost')
urlpatterns = [*router.urls]
