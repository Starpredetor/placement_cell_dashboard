from rest_framework import permissions

from .models import UserRole


class IsAccountsManager(permissions.BasePermission):
    message = 'You do not have permission to access account management endpoints.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        role = getattr(getattr(request.user, 'profile', None), 'role', None)
        return role in {UserRole.TPO, UserRole.HOD}
