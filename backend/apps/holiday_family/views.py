from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import HolidayFamilyApplication
from .serializers import HolidayFamilyApplicationSerializer
from apps.user.models import Notification

User = get_user_model()


class HolidayFamilyApplicationViewSet(viewsets.ModelViewSet):
    queryset = HolidayFamilyApplication.objects.all()
    serializer_class = HolidayFamilyApplicationSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def apply(self, request):
        """Create a new holiday family application"""
        
        # 检查用户是否已有待审批的申请
        pending_application = HolidayFamilyApplication.objects.filter(
            user=request.user,
            status='pending'
        ).first()
        
        if pending_application:
            return Response(
                {
                    'error': 'You already have a pending application. Please wait for the review to complete before submitting a new one.',
                    'pending_application_id': pending_application.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # 保存时 serializer 会自动从 request 中获取 user
            application = serializer.save()
            
            # 为所有管理员创建通知
            admin_users = User.objects.filter(is_staff=True)
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    notification_type='holiday_family_apply',
                    holiday_family_application=application,
                    title=f'New Holiday Family Application from {application.full_name}',
                    content=f'{application.full_name} has submitted a Holiday Family application.',
                    from_user=request.user
                )
            
            return Response(
                {
                    'message': 'Application submitted successfully',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
