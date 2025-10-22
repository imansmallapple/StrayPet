# apps/pet/urls.py
from rest_framework.routers import DefaultRouter
from .views import PetViewSet, AdoptionViewSet, LostViewSet, DonationViewSet
from django.urls import path
from apps.pet.views import LostGeoViewSet

router = DefaultRouter()
router.register("pet", PetViewSet, basename="pet")
router.register("adoption", AdoptionViewSet, basename="pet-application")
router.register(r'lost', LostViewSet, basename='lost')
router.register(r"pet/lost_geo", LostGeoViewSet, basename="lost-geo")

urlpatterns = [
    # —— Pet —— #
    path(
        '',
        PetViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='pet_list'
    ),
    path(
        '<int:pk>/',
        PetViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='pet_detail'
    ),
    # —— Adoption —— #
    path(
        'adoption/',
        AdoptionViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='pet_adoption'
    ),
    path(
        'adoption/<int:pk>/',
        AdoptionViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='pet_adoption_detail'
    ),
    # —— Donation —— #
    path(
        'donation/',
        DonationViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='pet_donation'
    ),
    path(
        'donation/<int:pk>/',
        DonationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='pet_donation_detail'
    ),
    # —— Lost —— #
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

    *router.urls
]
