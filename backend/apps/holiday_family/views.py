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

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a holiday family application"""
        application = self.get_object()
        
        # 检查权限
        if not request.user.is_staff:
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if application.status != 'pending':
            return Response(
                {'error': f'Cannot approve application with status {application.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = 'approved'
        application.save()
        
        # 更新用户的holiday family认证状态
        if application.user:
            application.user.profile.is_holiday_family_certified = True
            application.user.profile.save()
            
            # 创建通知给申请用户
            Notification.objects.create(
                user=application.user,
                notification_type='holiday_family_approve',
                holiday_family_application=application,
                title='Your Holiday Family Application has been Approved!',
                content='Congratulations! Your application to be a Holiday Family has been approved.',
                from_user=request.user
            )
        
        try:
            serializer = self.get_serializer(application)
            return Response(
                {
                    'message': 'Application approved successfully',
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f'Serialization error: {str(e)}')
            return Response(
                {
                    'message': 'Application approved successfully',
                    'data': {
                        'id': application.id,
                        'status': application.status,
                    }
                },
                status=status.HTTP_200_OK
            )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a holiday family application"""
        application = self.get_object()
        
        # 检查权限
        if not request.user.is_staff:
            return Response(
                {'error': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if application.status != 'pending':
            return Response(
                {'error': f'Cannot reject application with status {application.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('reason', '').strip()
        if not rejection_reason:
            return Response(
                {'error': 'Rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = 'rejected'
        application.rejection_reason = rejection_reason
        application.save()
        
        # 创建通知给申请用户
        if application.user:
            Notification.objects.create(
                user=application.user,
                notification_type='holiday_family_reject',
                holiday_family_application=application,
                title='Your Holiday Family Application has been Rejected',
                content=f'Your application has been rejected. Reason: {rejection_reason}',
                from_user=request.user
            )
        
        try:
            serializer = self.get_serializer(application)
            return Response(
                {
                    'message': 'Application rejected successfully',
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f'Serialization error: {str(e)}')
            return Response(
                {
                    'message': 'Application rejected successfully',
                    'data': {
                        'id': application.id,
                        'status': application.status,
                        'rejection_reason': application.rejection_reason
                    }
                },
                status=status.HTTP_200_OK
            )
