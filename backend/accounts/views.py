from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserRole
from .permissions import IsAccountsManager, can_manage_target_user, get_user_role
from .serializers import ChangePasswordSerializer, LoginSerializer, ManagedUserUpdateSerializer, MeUpdateSerializer, UserSerializer

User = get_user_model()


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {
                'access': serializer.validated_data['access'],
                'refresh': serializer.validated_data['refresh'],
                'user': UserSerializer(serializer.validated_data['user']).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = MeUpdateSerializer(data=request.data, partial=True, context={'user': request.user})
        serializer.is_valid(raise_exception=True)
        serializer.update(request.user, serializer.validated_data)
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'user': request.user})
        serializer.is_valid(raise_exception=True)

        new_password = serializer.validated_data['new_password']
        try:
            validate_password(new_password, request.user)
        except DjangoValidationError as exc:
            raise ValidationError({'new_password': list(exc.messages)}) from exc

        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)


class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAccountsManager]

    def get(self, request):
        users = User.objects.select_related('profile').order_by('username')

        if not request.user.is_superuser:
            # Hide super-admin users from HOD/TPO visibility.
            users = users.exclude(is_superuser=True).exclude(profile__role=UserRole.SUPER_ADMIN)

        return Response(UserSerializer(users, many=True).data, status=status.HTTP_200_OK)


class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAccountsManager]

    def patch(self, request, user_id):
        target_user = get_object_or_404(User.objects.select_related('profile'), pk=user_id)

        if not can_manage_target_user(request.user, target_user):
            raise ValidationError({'detail': 'You do not have permission to manage this account.'})

        # HOD/TPO cannot modify peer-level (HOD/TPO) or hidden super-admin accounts.
        actor_role = get_user_role(request.user)
        target_role = get_user_role(target_user)
        if not request.user.is_superuser and actor_role in {UserRole.HOD, UserRole.TPO}:
            if target_role in {UserRole.SUPER_ADMIN, UserRole.HOD, UserRole.TPO}:
                raise ValidationError({'detail': 'You cannot modify this account.'})

        serializer = ManagedUserUpdateSerializer(
            data=request.data,
            partial=True,
            context={'actor_user': request.user, 'target_user': target_user},
        )
        serializer.is_valid(raise_exception=True)
        serializer.update(target_user, serializer.validated_data)

        return Response(UserSerializer(target_user).data, status=status.HTTP_200_OK)
