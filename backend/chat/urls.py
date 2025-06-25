from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrivateChatRoomViewSet, RoomChatMessagesView

router = DefaultRouter()
router.register("", PrivateChatRoomViewSet, basename="private-chat")

urlpatterns = [
    path('', include(router.urls)),
    path('<int:user_id>/', PrivateChatRoomViewSet.as_view({'post': 'create'}), name='create-private-chat'),
    path('room/<int:room_id>/messages/', RoomChatMessagesView.as_view(), name='room-messages'),
]

