"""
URL configuration for crm_dashboard project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API schema and documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # API v1 endpoints
    path('api/v1/auth/', include('accounts.urls', namespace='auth')),
    path('api/v1/students/', include('students.urls', namespace='students')),
    path('api/v1/placements/', include('placement.urls', namespace='placements')),
    path('api/v1/training/', include('training.urls', namespace='training')),
    path('api/v1/events/', include('events.urls', namespace='events')),
    path('api/v1/communications/', include('communications.urls', namespace='communications')),
    path('api/v1/analytics/', include('analytics.urls', namespace='analytics')),
    path('api/v1/common/', include('common.urls', namespace='common')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
