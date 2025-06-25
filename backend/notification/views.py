from rest_framework.views import APIView
from acounts.authentication.jwt import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status
from acounts.models import UserAccount
from channels.layers import get_channel_layer
# import async to sync
from asgiref.sync import async_to_sync

channel_layer = get_channel_layer()
class NotificationView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request, user_id):
        user = get_object_or_404(UserAccount, id=user_id)
        data = request.data
        online_users = cache.get("online_users", [])
        # print("online users = ",online_users)
        # print("request data",data)
        # ui = self.find_user(username)
        if user.id in online_users:
            user_id = str(user.id)
            # #print("user_channel_name = ",user_channel_name)
            #             async_to_sync(channel_layer.group_send)(user_id, {
            #     "type": "notification",
            #     "message": "You have a new friend request",
            #     "from": request.user.username,
            #     "from_id": request.user.id,
            # })
            return Response({'status': True}, status=status.HTTP_200_OK)
        else:
            return Response({'status': False}, status=status.HTTP_200_OK)

class ResetNotificationView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        #print("reset notification")
        async_to_sync(channel_layer.group_send)((str(request.user.id)), {
    "type": "clear_notification",
})
        return Response({'status': True}, status=status.HTTP_200_OK)
#         user = get_object_or_404(UserAccount, username=username)
#         data = request.data
#         online_users = cache.get("online_users", [])
#         #print("online users = ",online_users)
#         #print("request data",data)
#         # ui = self.find_user(username)
#         if username in online_users:
#             user_id = str(user.id)
#             # #print("user_channel_name = ",user_channel_name)
#             async_to_sync(channel_layer.group_send)(user_id, {
#     "type": "notification",
#     "message": "You have a new friend request",
#     "from": request.user.username,
#     "from_id": request.user.id,
# })
#             return Response({'status': True}, status=status.HTTP_200_OK)
#         else:
#             return Response({'status': False}, status=status.HTTP_200_OK)
# user = get_object_or_404(UserAccount, id=username)

# friendship = Friendship.objects.filter(
#     Q(user1=request.user, user2=user) | Q(user1=user, user2=request.user)
# ).first()

# if friendship:
#     status_info = {
#         'status': friendship.status,
#         'is_user1': friendship.user1 == request.user,
#         'is_user2': friendship.user2 == request.user,
#         'friendship_id': friendship.id,
#     }
#     return Response(status_info, status=status.HTTP_200_OK)
# else:
#     return Response({'status': 'none', 'is_user1': False, 'is_user2': False}, status=status.HTTP_200_OK)
