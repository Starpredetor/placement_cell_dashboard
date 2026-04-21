from rest_framework import permissions

from .models import UserRole


ROLE_RANK = {
    UserRole.STUDENT: 1,
    UserRole.VOLUNTEER: 2,
    UserRole.TPO: 3,
    UserRole.HOD: 3,
    UserRole.SUPER_ADMIN: 4,
}


def get_user_role(user):
    if user.is_superuser:
        return UserRole.SUPER_ADMIN
    return getattr(getattr(user, 'profile', None), 'role', UserRole.STUDENT)


def can_manage_target_user(actor, target):
    actor_role = get_user_role(actor)
    target_role = get_user_role(target)

    # Super-admin can manage all except changing peer super-admin account details through manager endpoints.
    if actor.is_superuser:
        return True

    # Only TPO/HOD manage accounts beneath them.
    if actor_role not in {UserRole.TPO, UserRole.HOD}:
        return False

    # HOD/TPO cannot see or manage super admins or peer-level roles.
    return ROLE_RANK.get(actor_role, 0) > ROLE_RANK.get(target_role, 0)


class IsAccountsManager(permissions.BasePermission):
    message = 'You do not have permission to access account management endpoints.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        role = get_user_role(request.user)
        return role in {UserRole.TPO, UserRole.HOD}
