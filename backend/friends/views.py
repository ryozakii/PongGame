from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Friendship
from gamestats.models import GameStats
from acounts.models import UserAccount
from acounts.serializers import UserAccountSerializer
from acounts.authentication.jwt import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from chat.utils import find_or_create_private_chat
from django.http import Http404
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction

channel_layer = get_channel_layer()
class FriendStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, friend_id):
        user = get_object_or_404(UserAccount, id=friend_id)
        
        friendship = Friendship.objects.filter(
            Q(user1=request.user, user2=user) | Q(user1=user, user2=request.user)
        ).first()

        if friendship:
            status_info = {
                'status': friendship.status,
                'is_user1': friendship.user1 == request.user,
                'is_user2': friendship.user2 == request.user,
                'friendship_id': friendship.id,
            }
            return Response(status_info, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'none', 'is_user1': False, 'is_user2': False}, status=status.HTTP_200_OK)

class FriendProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, friend_id):
        if request.user.id == friend_id:
            return Response(
                {"error": "see your dashbord"},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            user = get_object_or_404(UserAccount, id=friend_id)
        except Http404:
            return Response(
                {'error': 'Profile not found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )


        is_blocked = Friendship.objects.filter(
            (Q(user1=user, user2=request.user) | Q(user1=request.user, user2=user)),
            status=Friendship.BLOCKED
        ).exists()

        if is_blocked:
            return Response(
                {'error': 'You are blocked from viewing this profile.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        gamestats, created = GameStats.objects.get_or_create(user=user)

        if not user.is_uptodate:
            gamestats.calculate_status_game()

        friendship = Friendship.objects.filter(
            Q(user1=request.user, user2=user) | Q(user1=user, user2=request.user)
        ).first()

        status_info = {
            'status': friendship.status if friendship else 'none',
            'is_user1': friendship.user1 == request.user if friendship else False,
            'is_user2': friendship.user2 == request.user if friendship else False,
        }

        serializer = UserAccountSerializer(user)
        response_data = serializer.data
        response_data['friendship_status'] = status_info

        return Response(response_data, status=status.HTTP_200_OK)


class SendFriendRequestView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, friend_id):
        user_to_friend = get_object_or_404(UserAccount, id=friend_id)

        if user_to_friend == request.user:
            return Response({'error': "You can't send a friend request to yourself."}, status=status.HTTP_400_BAD_REQUEST)

        if Friendship.objects.filter(Q(user1=request.user, user2=user_to_friend) | Q(user1=user_to_friend, user2=request.user)).exists():
            return Response({'error': 'Friendship already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        Friendship.objects.create(user1=request.user, user2=user_to_friend, status=Friendship.PENDING)
        async_to_sync(channel_layer.group_send)((str(user_to_friend.id)), {
    "type": "add.notification",
    "image": str(request.user.image.url),
    "message": f'{request.user.username} has sent you a friend request',
    "category": 'Friend'})
    
        return Response({'status': 'PENDING',
                         'message': 'Friend request sent successfully.',
                       
                         }, status=status.HTTP_201_CREATED)


class AcceptFriendRequestView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, friendship_id):
        friendship = get_object_or_404(Friendship, id=friendship_id, user2=request.user)

        if friendship.status != Friendship.PENDING:
            return Response({'error': 'Friend request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)

        friendship.status = Friendship.ACCEPTED
        chat = find_or_create_private_chat(friendship.user1, friendship.user2)
        if not chat.is_active:
            chat.is_active = True
            chat.save()
        friendship.save()
        user2 = None
        if (friendship.user1 == request.user):
            user2 = friendship.user2
        else:
            user2 = friendship.user1
        async_to_sync(channel_layer.group_send)((str(user2.id)), {
            "type": "add.notification",
            "image": str(request.user.image.url),
            "message": f'{request.user.username} accepted your friend request',
            "category": 'Friend-accept'})
        return Response({'message': 'Friend request accepted.'}, status=status.HTTP_200_OK)


class ListFriendsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friendships = Friendship.objects.filter(
            (Q(user1=request.user) | Q(user2=request.user)) & 
            Q(status=Friendship.ACCEPTED)
            ).exclude(user1__isnull=True).exclude(user2__isnull=True)


        friends = []
        for friend in friendships:
            if not friend.user1 or not friend.user2:
                continue
            friend_user = friend.user2 if friend.user1 == request.user else friend.user1
            gamestats, created = GameStats.objects.get_or_create(user=friend_user)

            friends.append({
                'friendship_id': friend.id,
                'id': friend_user.id,
                'username': friend_user.username,
                'status': friend.status,
                'level': gamestats.level, 
                'progress': gamestats.progress, 
                'avatar': friend_user.image.url if friend_user.image else None,  
            })

        return Response(friends, status=status.HTTP_200_OK)

class ListPendingRequestsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_requests = Friendship.objects.filter(user2=request.user, status=Friendship.PENDING)

        friends = []
        for friend in pending_requests:
            friend_user = friend.user1 
            gamestats, created = GameStats.objects.get_or_create(user=friend_user)

            friends.append({
                'friendship_id': friend.id,
                'id': friend_user.id,
                'username': friend_user.username,
                'status': friend.status,
                'level': gamestats.level,  
                'progress': gamestats.progress, 
                'avatar': friend_user.image.url if friend_user.image else None, 
            })

        return Response(friends, status=status.HTTP_200_OK)


class ListBlockingRequestsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        blocking_requests = Friendship.objects.filter(
            blocked_by=request.user,
            status=Friendship.BLOCKED
        )

        blocked_users = []
        for friend in blocking_requests:
            friend_user = friend.user2 if friend.user1 == request.user else friend.user1
            gamestats, created = GameStats.objects.get_or_create(user=friend_user)

            blocked_users.append({
                'friendship_id': friend.id,
                'id': friend_user.id,
                'username': friend_user.username,
                'status': friend.status,
                'level': gamestats.level, 
                'progress': gamestats.progress,
                'avatar': friend_user.image.url if friend_user.image else None, 
            })

        return Response(blocked_users, status=status.HTTP_200_OK)


class CancelFriendRequestByUser2View(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        friendship = Friendship.objects.filter(user1_id=user_id, user2=request.user, status=Friendship.PENDING).first()

        if not friendship:
            return Response({'error': 'No pending friend request found from the specified user.'}, status=status.HTTP_400_BAD_REQUEST)

        friendship.delete()
        return Response({'status': 'none', 'message': 'Friend request canceled successfully.'}, status=status.HTTP_200_OK)


class CancelFriendRequestView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        friendship = Friendship.objects.filter(user1=request.user, user2_id=user_id, status=Friendship.PENDING).first()

        if not friendship:
            return Response({'error': 'No pending friend request found.'}, status=status.HTTP_400_BAD_REQUEST)

        friendship.delete()
        return Response({'status': 'none', 'message': 'Friend request canceled successfully.'}, status=status.HTTP_200_OK)


class RemoveFriendView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        friendship = Friendship.objects.filter(
            (Q(user1=request.user, user2_id=user_id) | Q(user1_id=user_id, user2=request.user)),
            status=Friendship.ACCEPTED
        ).first()

        if not friendship:
            return Response({'status': 'none', 'error': 'Friendship not found.'}, status=status.HTTP_400_BAD_REQUEST)

        chat = find_or_create_private_chat(friendship.user1, friendship.user2)
        if chat.is_active:
            chat.is_active = False
            chat.save()
        friendship.delete()
        return Response({'status': 'none', 'message': 'Friend removed successfully.'}, status=status.HTTP_200_OK)


class BlockUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        with transaction.atomic():  # Start atomic transaction
            user_to_block = get_object_or_404(UserAccount, id=user_id)

            if request.user == user_to_block:
                return Response({'error': 'You cannot block yourself.'}, status=status.HTTP_400_BAD_REQUEST)

            existing_blocked_friendship = Friendship.objects.select_for_update().filter(
                (Q(user1=request.user, user2=user_to_block) | Q(user1=user_to_block, user2=request.user)),
                status=Friendship.BLOCKED
            ).first()

            if existing_blocked_friendship:
                return Response(
                    {'message': 'Block relationship already exists.', 'byblock': 0},
                    status=status.HTTP_200_OK
                )

            Friendship.objects.filter(
                Q(user1=request.user, user2=user_to_block) | Q(user1=user_to_block, user2=request.user)
            ).exclude(status=Friendship.BLOCKED).delete()

            existing_blocked_friendship = Friendship.objects.filter(
                (Q(user1=request.user, user2=user_to_block) | Q(user1=user_to_block, user2=request.user)),
                status=Friendship.BLOCKED
            ).first()

            if existing_blocked_friendship:
                return Response(
                    {'message': 'Block relationship already exists.', 'byblock': 0},
                    status=status.HTTP_200_OK
                )

            friendship, created = Friendship.objects.get_or_create(
                user1=request.user,
                user2=user_to_block,
                defaults={'status': Friendship.BLOCKED, 'blocked_by': request.user}
            )

            if not created:
                friendship.status = Friendship.BLOCKED
                friendship.blocked_by = request.user
                friendship.save()

            chat = find_or_create_private_chat(friendship.user1, friendship.user2)
            if chat.is_active:
                chat.is_active = False
                chat.save()

            return Response(
                {'message': 'User blocked successfully.', 'status': 'BLOCKED', 'byblock': 1},
                status=status.HTTP_200_OK
            )


class UnblockUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        friendship = Friendship.objects.filter(
            user1=request.user,
            user2_id=user_id,
            status=Friendship.BLOCKED,
            blocked_by=request.user
        ).first()

        if friendship:
            friendship.delete()
            return Response({'message': 'User unblocked successfully.', 'status': 'none'}, status=status.HTTP_200_OK)

        return Response({'error': 'No blocked user found, or you are not authorized to unblock this user.'}, status=status.HTTP_400_BAD_REQUEST)
