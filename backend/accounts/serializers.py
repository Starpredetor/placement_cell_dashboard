from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile, UserRole
from .permissions import ROLE_RANK, get_user_role

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'role')

    def get_role(self, obj):
        if obj.is_superuser:
            return UserRole.SUPER_ADMIN
        if hasattr(obj, 'profile'):
            return obj.profile.role
        return UserRole.STUDENT


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError({'detail': 'Invalid email or password.'}) from exc

        user = authenticate(username=user_obj.username, password=password)
        if not user:
            raise serializers.ValidationError({'detail': 'Invalid email or password.'})

        if not user.is_active:
            raise serializers.ValidationError({'detail': 'This user account is disabled.'})

        refresh = RefreshToken.for_user(user)

        attrs['access'] = str(refresh.access_token)
        attrs['refresh'] = str(refresh)
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'role', 'phone_number', 'is_active', 'created_at', 'updated_at')


class MeUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_username(self, value):
        user = self.context.get('user')
        existing = User.objects.filter(username__iexact=value).exclude(pk=user.pk)
        if existing.exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save(update_fields=['username', 'first_name', 'last_name'])

        if 'phone_number' in validated_data:
            profile = getattr(instance, 'profile', None)
            if profile:
                profile.phone_number = validated_data.get('phone_number', profile.phone_number)
                profile.save(update_fields=['phone_number'])

        return instance

    def create(self, validated_data):
        raise NotImplementedError


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        user = self.context.get('user')

        if not user.check_password(attrs['current_password']):
            raise serializers.ValidationError({'current_password': 'Current password is incorrect.'})

        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})

        if attrs['new_password'] == attrs['current_password']:
            raise serializers.ValidationError({'new_password': 'New password must be different.'})

        return attrs


class ManagedUserUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=UserRole.choices, required=False)
    is_active = serializers.BooleanField(required=False)

    def validate_username(self, value):
        target = self.context['target_user']
        existing = User.objects.filter(username__iexact=value).exclude(pk=target.pk)
        if existing.exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate_email(self, value):
        target = self.context['target_user']
        existing = User.objects.filter(email__iexact=value).exclude(pk=target.pk)
        if existing.exists():
            raise serializers.ValidationError('This email is already in use.')
        return value

    def validate_role(self, value):
        actor = self.context['actor_user']
        actor_role = get_user_role(actor)

        # SUPER_ADMIN role is reserved; do not expose assignment through UI management endpoint.
        if value == UserRole.SUPER_ADMIN:
            raise serializers.ValidationError('SUPER_ADMIN role cannot be assigned from this endpoint.')

        if actor.is_superuser:
            return value

        if actor_role in {UserRole.HOD, UserRole.TPO} and value not in {UserRole.VOLUNTEER, UserRole.STUDENT}:
            raise serializers.ValidationError('You can assign only VOLUNTEER or STUDENT roles.')

        if ROLE_RANK.get(actor_role, 0) <= ROLE_RANK.get(value, 0):
            raise serializers.ValidationError('You cannot assign a role equal to or higher than your own.')

        return value

    def update(self, instance, validated_data):
        role = validated_data.pop('role', None)

        for field in ['username', 'email', 'first_name', 'last_name', 'is_active']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        update_fields = [field for field in ['username', 'email', 'first_name', 'last_name', 'is_active'] if field in validated_data]
        if update_fields:
            instance.save(update_fields=update_fields)

        if role is not None:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            profile.role = role
            profile.save(update_fields=['role'])

        return instance

    def create(self, validated_data):
        raise NotImplementedError
