from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAccountsManager
from .serializers import LoginSerializer, MeUpdateSerializer, UserSerializer

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
        serializer = MeUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.update(request.user, serializer.validated_data)
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAccountsManager]

    def get(self, request):
        users = User.objects.select_related('profile').order_by('username')
        return Response(UserSerializer(users, many=True).data, status=status.HTTP_200_OK)
