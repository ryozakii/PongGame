from django.contrib import admin
from django.urls import path, include, re_path 
from acounts.models import UserAccount  
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from chat.views import PrivateChatRoomViewSet
from rest_framework import routers


router = DefaultRouter()
router.register("", PrivateChatRoomViewSet, basename="private-chat")

urlpatterns = [
    path('api/', include('acounts.urls')),
    path('api/', include('friends.urls')),
    path('api/', include('gamestats.urls')),
    path('api/', include('notification.urls')),
    path('api/', include(router.urls)),
    path('api/chat/', include('chat.urls',)),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/schema/ui/', SpectacularSwaggerView.as_view()),                                                                       
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)