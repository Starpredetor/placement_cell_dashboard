from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile, UserRole

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
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save(update_fields=['first_name', 'last_name'])

        if 'phone_number' in validated_data:
            profile = getattr(instance, 'profile', None)
            if profile:
                profile.phone_number = validated_data.get('phone_number', profile.phone_number)
                profile.save(update_fields=['phone_number'])

        return instance

    def create(self, validated_data):
        raise NotImplementedError
