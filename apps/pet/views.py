# apps/pet/views.py
from rest_framework import viewsets, permissions, decorators
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Pet
from .serializers import PetListSerializer, PetCreateUpdateSerializer
from .permissions import IsOwnerOrAdmin
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
