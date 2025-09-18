# apps/pet/views.py
from django.db import transaction
from rest_framework import viewsets, permissions, decorators
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Pet, Adoption
from .serializers import PetListSerializer, PetCreateUpdateSerializer, AdoptionCreateSerializer, \
    AdoptionDetailSerializer, AdoptionReviewSerializer
from .permissions import IsOwnerOrAdmin, IsAdopterOrOwnerOrAdmin
from .filters import PetFilter


class PetViewSet(viewsets.ModelViewSet):
    queryset = Pet.objects.select_related("created_by").order_by("-pub_date")
    filterset_class = PetFilter
    search_fields = ["name", "species", "breed", "description", "location"]
    ordering_fields = ["add_date", "pub_date", "age_months", "name"]
    permission_classes = [IsOwnerOrAdmin]

    def get_serializer_class(self):
        return PetListSerializer if self.action in ("list", "retrieve") else PetCreateUpdateSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        if self.action in ("create",):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    # 公共列表：只展示 AVAILABLE/PENDING
    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(
            self.get_queryset().filter(status__in=[Pet.Status.AVAILABLE, Pet.Status.PENDING])
        )
        page = self.paginate_queryset(qs)
        ser = PetListSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(ser.data)

    # 非公开详情限制访问（DRAFT/ARCHIVED 仅作者/管理员可见）
    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.status in (Pet.Status.DRAFT, Pet.Status.ARCHIVED):
            u = request.user
            if not (u.is_authenticated and (u.is_staff or u.id == obj.created_by_id)):
                raise PermissionDenied("This pet is not public.")
        ser = PetListSerializer(obj, context={"request": request})
        return Response(ser.data)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, status=Pet.Status.AVAILABLE)

    # 可选：快速标记状态（仅作者/管理员）
    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def set_status(self, request, pk=None):
        obj = self.get_object()
        u = request.user
        if not (u.is_staff or u.id == obj.created_by_id):
            raise PermissionDenied("Only owner or admin can change status.")
        status_val = request.data.get("status")
        allowed = {s for s, _ in Pet.Status.choices}
        if status_val not in allowed:
            return Response({"detail": f"status must be one of {sorted(allowed)}"}, status=400)
        obj.status = status_val
        obj.save(update_fields=["status", "pub_date"])
        return Response({"ok": True, "status": obj.status})

    @decorators.action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def apply(self, request, pk=None):
        pet = self.get_object()
        ser = AdoptionCreateSerializer(
            data={"pet": pet.id, "message": request.data.get("message", "")},
            context={"request": request}
        )
        ser.is_valid(raise_exception=True)
        app = ser.save(applicant=request.user)
        # 有申请则把宠物置为 pending
        if pet.status == Pet.Status.AVAILABLE:
            pet.status = Pet.Status.PENDING
            pet.save(update_fields=["status", "pub_date"])
        return Response({"ok": True, "application_id": app.id})


class AdoptionViewSet(viewsets.ModelViewSet):
    queryset = Adoption.objects.select_related("pet", "applicant", "pet__created_by").order_by("-pub_date")
    permission_classes = [IsAdopterOrOwnerOrAdmin]
    search_fields = ["message", "pet__name", "applicant__username"]
    ordering_fields = ["add_date", "pub_date", "status"]

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return AdoptionReviewSerializer
        return AdoptionDetailSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "create"):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    # 我的申请 / 发布者看自己宠物的申请；管理员看全部
    def list(self, request, *args, **kwargs):
        u = request.user
        qs = self.filter_queryset(self.get_queryset())
        if not u.is_staff:
            pet_id = request.query_params.get("pet")
            if pet_id:
                qs = qs.filter(pet__created_by=u, pet_id=pet_id)  # 发布者看某只宠物
            else:
                qs = qs.filter(applicant=u)                       # 普通用户看自己的
        page = self.paginate_queryset(qs)
        ser = AdoptionDetailSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(ser.data)

    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        """
        审核/撤销：
        - 管理员或宠物发布者：processing/approved/rejected/closed
        - 申请人：closed（撤销）
        审核通过：宠物置 ADOPTED，并关闭其它未结案申请
        """
        obj = self.get_object()
        u = request.user
        next_status = request.data.get("status")
        if not next_status:
            return Response({"detail": "status is required"}, status=400)

        owner_allowed = {"processing", "approved", "rejected", "closed"}
        applicant_allowed = {"closed"}

        is_owner_or_admin = (u.is_staff or obj.pet.created_by_id == u.id)
        is_applicant = (obj.applicant_id == u.id)

        if is_owner_or_admin and next_status in owner_allowed:
            obj.status = next_status
            obj.save(update_fields=["status", "pub_date"])
        elif is_applicant and next_status in applicant_allowed:
            obj.status = next_status
            obj.save(update_fields=["status", "pub_date"])
        else:
            raise PermissionDenied("Not allowed to change status.")

        pet = obj.pet
        if obj.status == "approved":
            pet.status = Pet.Status.ADOPTED
            pet.save(update_fields=["status", "pub_date"])
            Adoption.objects.filter(
                pet=pet, status__in=["submitted", "processing"]
            ).exclude(id=obj.id).update(status="closed")
        else:
            open_exists = Adoption.objects.filter(
                pet=pet, status__in=["submitted", "processing"]
            ).exists()
            if not open_exists and pet.status in (Pet.Status.PENDING, Pet.Status.AVAILABLE):
                pet.status = Pet.Status.AVAILABLE
                pet.save(update_fields=["status", "pub_date"])

        ser = AdoptionDetailSerializer(obj, context={"request": request})
        return Response(ser.data)