from chat.models import PrivateChatRoom
from datetime import datetime
from django.contrib.humanize.templatetags.humanize import naturalday
from django.core.serializers.python import Serializer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from friends.models import Friendship
from django.db.models import Q

def find_or_create_private_chat(user1, user2):
    try:
        chat = PrivateChatRoom.objects.get(user1=user1, user2=user2)
    except PrivateChatRoom.DoesNotExist:
        try:
            chat = PrivateChatRoom.objects.get(user1=user2, user2=user1)
        except PrivateChatRoom.DoesNotExist:
            chat = PrivateChatRoom(user1=user1, user2=user2)
            chat.save()
    return chat


def get_room_or_error(room_id, user):
    """
    Fetch a PrivateChatRoom by ID and validate the user.
    """
    try:
        room = PrivateChatRoom.objects.get(pk=room_id)
    except PrivateChatRoom.DoesNotExist:
        raise ClientError("ROOM_INVALID", "Invalid room ID.")

    if user != room.user1 and user != room.user2:
        raise ClientError(
            "ROOM_ACCESS_DENIED", "You do not have permission to access this room."
        )

    other_user = room.user2 if user == room.user1 else room.user1

    # Check friendship status
    friendship = Friendship.objects.filter(
        (Q(user1=user, user2=other_user) | Q(user1=other_user, user2=user)),
    ).first()

    # Blocked check
    if friendship and friendship.status == Friendship.BLOCKED:
        blocker = (
            friendship.blocked_by.username if friendship.blocked_by else "another user"
        )
        raise ClientError(
            "CHAT_BLOCKED", f"Chat disabled: {blocker} has blocked this conversation"
        )

    # Friends check
    if not friendship or friendship.status != Friendship.ACCEPTED:
        raise ClientError("CHAT_NOT_FRIENDS", "You can only chat with accepted friends")

    return room


def calculate_timestamp(timestamp):
	ts = ""
	# Today or yesterday
	if (naturalday(timestamp) == "today") or (naturalday(timestamp) == "yesterday"):
		str_time = datetime.strftime(timestamp, "%I:%M %p")
		str_time = str_time.strip("0")
		ts = f"{naturalday(timestamp)} at {str_time}"
	# other days
	else:
		str_time = datetime.strftime(timestamp, "%m/%d/%Y")
		ts = f"{str_time}"
	return str(ts)
