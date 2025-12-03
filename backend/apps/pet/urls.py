# apps/pet/urls.py
from rest_framework.routers import DefaultRouter
from .views import PetViewSet, AdoptionViewSet, LostViewSet, DonationViewSet
from django.urls import path, include
from apps.pet.views import LostGeoViewSet

router = DefaultRouter()
router.register(r'', PetViewSet, basename='pet')
router.register(r'adoption', AdoptionViewSet, basename='pet-application')
router.register(r'lost', LostViewSet, basename='lost')
router.register(r'donation', DonationViewSet, basename='donation')
router.register(r"lost_geo", LostGeoViewSet, basename="lost-geo")

urlpatterns = [
	# Explicit lost routes to ensure /pet/lost/ resolves
	path(
		'lost/',
		LostViewSet.as_view({'get': 'list', 'post': 'create'}),
		name='pet_lost'
	),
	path(
		'lost/<int:pk>/',
		LostViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}),
		name='pet_lost_detail'
	),
	# Router-generated routes
	*router.urls
]
