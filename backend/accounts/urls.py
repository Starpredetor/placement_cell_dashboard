from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import ChangePasswordView, LoginView, LogoutView, MeView, UserDetailView, UserListView

app_name = 'auth'

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('users/', UserListView.as_view(), name='users'),
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]
