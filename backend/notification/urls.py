from django.urls import path
from .views import NotificationView, ResetNotificationView

urlpatterns = [
    # Notification
    path('notification/<int:user_id>/', NotificationView.as_view(), name='notification'),
    path('notification_reset/', ResetNotificationView.as_view(), name='reset_notification'),
]
