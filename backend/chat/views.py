# chat/views.py
from asgiref.sync import sync_to_async
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from itertools import chain
from chat.models import PrivateChatRoom, RoomChatMessage, UnreadChatRoomMessages
from .serializer import FriendSerializer, RoomChatMessageSerializer, PrivateChatRoomSerializer, CreatePrivateChatSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework.viewsets import ViewSet
from rest_framework.pagination import PageNumberPagination
from chat.utils import find_or_create_private_chat, get_room_or_error
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from acounts.models import UserAccount
from acounts.authentication.jwt import JWTAuthentication



class PrivateChatRoomViewSet(ViewSet):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user

        # rooms the user is a part of
        rooms1 = PrivateChatRoom.objects.filter(user1=user, is_active=True)
        rooms2 = PrivateChatRoom.objects.filter(user2=user, is_active=True)

        # Merge the lists
        rooms = list(chain(rooms1, rooms2))

        m_and_f = []
        for room in rooms:
            friend = room.user2 if room.user1 == user else room.user1
            last_message = RoomChatMessage.objects.filter(room=room).order_by("-timestamp").first()
            unread_count = UnreadChatRoomMessages.objects.filter(room=room, user=user).first()
            unread_count = unread_count.count if unread_count else 0

            m_and_f.append({
                'friend': friend,
                'last_message': last_message.messages if last_message else "",
                'unread_count': unread_count,
            })

        serializer = FriendSerializer(m_and_f, many=True)
        return Response(serializer.data)
    @extend_schema(
        request=CreatePrivateChatSerializer,
        responses={
            201: OpenApiParameter(name="room_id", type=int, description="The ID of the created private chat room."),
            400: "Bad Request: Missing or invalid user_id",
            404: "User not found",
        },
    )
    def create(self, request, *args, **kwargs):

        user_id = kwargs.get('user_id')
        
        user1 = request.user

        user2_id = user_id

        if not user2_id:
            return Response(
                {"response": "User2 ID is required."}, 
            )

        try:
            user2 = UserAccount.objects.get(pk=user2_id)
        except UserAccount.DoesNotExist:
            return Response(
                {"response": "Unable to start a chat with that user."}, 
            )

        chat = find_or_create_private_chat(user1, user2)

        serializer = PrivateChatRoomSerializer(chat)

        return Response(
            {
                "response": "Successfully got the chat.",
                "chatroom": serializer.data,
            }, 
        )


class RoomChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        """
        Handle fetching messages for a room, paginated.
        """
        user = request.user

        # Get room synchronously
        try:
            room = get_room_or_error(room_id, user)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        # Query messages synchronously
        try:
            queryset = RoomChatMessage.objects.by_room(room).order_by('-timestamp')
        except Exception as e:
            return Response({"error": f"Error fetching messages: {e}"}, status=404)

        # Paginate messages
        paginator = PageNumberPagination()
        paginator.page_size = 1  # Define your page size
        page = paginator.paginate_queryset(queryset, request, view=self)

        # Serialize paginated messages
        serializer = RoomChatMessageSerializer(page, many=True)

        # Return paginated response
        return paginator.get_paginated_response(serializer.data)