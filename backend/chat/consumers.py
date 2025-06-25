from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from channels.db import database_sync_to_async
from friends.models import Friendship
from chat.models import RoomChatMessage, PrivateChatRoom, UnreadChatRoomMessages
from chat.views import RoomChatMessagesView
from chat.exceptions import ClientError
from chat.utils import calculate_timestamp
from chat.constants import *
from chat.serializer import UserSerializer
import json
from django.core.serializers.python import Serializer
from django.core.paginator import Paginator
from .serializer import PrivateChatRoomSerializer
from acounts.models import UserAccount
from django.db.models import Q
from itertools import chain
import asyncio
from chat.models import PrivateChatRoom, RoomChatMessage, UnreadChatRoomMessages
from friends.models import Friendship
from .serializer import (
    FriendSerializer,
    RoomChatMessageSerializer,
    PrivateChatRoomSerializer,
    CreatePrivateChatSerializer,
)


class StatusConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.data = None
        self.count = 0
        if b"sec-websocket-protocol" in dict(self.scope.get("headers", {})):
            await self.accept(subprotocol="json")
        else:
            await self.accept()
        self.task = asyncio.create_task(self.update_status())

    async def update_status(self):
        while True:
            old_count = self.count
            await self.messages()
            if self.count != old_count:
                await self.send_json(self.data)
            await asyncio.sleep(5)

    async def disconnect(self):
        if hasattr(self, "task") and self.task:
            self.task.cancel()

    @sync_to_async
    def messages(self):
        user = self.scope["user"]
        rooms1 = PrivateChatRoom.objects.filter(user1=user, is_active=True)
        rooms2 = PrivateChatRoom.objects.filter(user2=user, is_active=True)
        rooms = list(chain(rooms1, rooms2))
        m_and_f = []
        self.count = 0
        for room in rooms:
            friend = room.user2 if room.user1 == user else room.user1
            last_message = (
                RoomChatMessage.objects.filter(room=room).order_by("-timestamp").first()
            )
            unread_count = (
                UnreadChatRoomMessages.objects.filter(room=room, user=user)
                .first()
                .count
            )
            self.count = unread_count + self.count
            m_and_f.append(
                {
                    "friend": friend,
                    "last_message": last_message.messages if last_message else "",
                    "unread_count": unread_count,
                }
            )
        serializer = FriendSerializer(m_and_f, many=True)
        self.data = serializer.data


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):

        if b"sec-websocket-protocol" in dict(self.scope.get("headers", {})):
            await self.accept(subprotocol="json")
        else:
            await self.accept()
            # room_id put the user to "connected".
            self.room_id = None

    async def receive(self, text_data):
        try:
            p = json.loads(text_data.strip())
            await self.receive_json(p)
        except json.JSONDecodeError:
            data = {"type": "error", "message": "invalid format"}
            await self.send_json(data)
            return

    async def receive_json(self, content):

        command = content.get("command", None)
        try:
            if command == "join":
                await self.join_room(content["room_id"])
            elif command == "leave":
                await self.leave_room(content["room_id"])
            elif command == "send":
                if len(content["message"].lstrip()) != 0:
                    flag = "invite" in content
                    await self.send_room(content["room_id"], content["message"], flag)
            elif command == "get_room_chat_messages":
                room = await get_room_or_error(content["room_id"], self.scope["user"])
                # print("Room1 retrieved")
                payload = await get_room_chat_messages(room, content["page_number"])
                if payload != None:
                    payload = json.loads(payload)
                    await self.send_messages_payload(
                        payload["messages"], payload["new_page_number"]
                    )
                else:
                    raise ClientError(
                        204, "Something went wrong retrieving the chatroom messages."
                    )
            elif command == "get_user_info":
                try:
                    if command == "get_user_info":
                        room = await get_room_or_error(
                            content["room_id"], self.scope["user"]
                        )
                        user_info = get_user_info(room, self.scope["user"])
                        if user_info is not None:
                            await self.send_user_info_payload({"user_info": user_info})
                    else:
                        raise ClientError(
                            204,
                            "Something went wrong retrieving the other user's account details.",
                        )
                except ClientError as e:
                    await self.handle_client_error(e)
        except Exception as e:
            print(f"EXCEPTION: {str(e)}")

    async def disconnect(self, code):
        """
        WebSocket closes
        """
        try:
            if self.room_id != None:
                await self.leave_room(self.room_id)
        except Exception as e:
            pass

    async def join_room(self, room_id):

        try:
            room = await get_room_or_error(room_id, self.scope["user"])
        except ClientError as e:
            return await self.handle_client_error(e)

        self.room_id = room.id

        username = self.scope["user"].username

        try:
            await self.channel_layer.group_add(
                room.group_name,
                self.channel_name,
            )
        except Exception as e:
            print(f"Error adding to group: {e}")

        await self.send_json(
            {
                "join": str(room.id),
            }
        )
        await connect_user(room, self.scope["user"])
        await on_user_connected(room, self.scope["user"])

    async def chat_join(self, event):

        if event["username"]:
            await self.send_json(
                {
                    "room": event["room_id"],
                    "username": event["username"],
                    "user_id": event["user_id"],
                    "join": str(event["room_id"]),
                },
            )

    async def leave_room(self, room_id):

        room = await get_room_or_error(room_id, self.scope["user"])
        await disconnect_user(room, self.scope["user"])
        self.room_id = None
        await self.channel_layer.group_discard(room.group_name, self.channel_name)

        await self.send_json(
            {
                "leave": str(room.id),
            }
        )

    async def send_room(self, room_id, message, flag):

        try:
            if self.room_id != None:
                if str(room_id) != str(self.room_id):
                    raise ClientError("ROOM_ACESS_DENIED", "Room acess denied")
            else:
                raise ClientError("ROOM_ACESS_DENIED", "Room acess denied")
            room = await get_room_or_error(room_id, self.scope["user"])
            room_data = await sync_to_async(
                lambda: PrivateChatRoomSerializer(room).data
            )()
            connected_users = await sync_to_async(list)(room.connected_users.all())
        except ClientError as e:
            return await self.handle_client_error(e)

        try:
            user2 = None

            if room_data["user1"]["id"] == self.scope["user"].id:
                user2 = room_data["user2"]
            else:
                user2 = room_data["user1"]
            flag2 = False
            for user in connected_users:
                if user.id == user2["id"]:
                    flag2 = True
                    break

            if (not flag) and (not flag2):
                msg = message if len(message) < 10 else message[:10] + "..."
                await self.channel_layer.group_send(
                    str(user2["id"]),
                    {
                        "type": "add.notification",
                        "image": str(self.scope["user"].image.url),
                        "message": f'{self.scope["user"].username}: {msg}',
                        "category": "chat",
                    },
                )
            elif flag:
                await self.channel_layer.group_send(
                    str(user2["id"]),
                    {
                        "type": "add.notification",
                        "image": str(self.scope["user"].image.url),
                        "message": f'{self.scope["user"].username} has invited you to Play',
                        "href": message,
                        "category": "chat",
                    },
                )
        except ClientError as e:
            return await self.handle_client_error(e)

        username = self.scope["user"].username
        current_user = self.scope["user"]

        await unread_msg_when_not_connected(
            room,
            room.user1,
            connected_users,
            message,
        )
        await unread_msg_when_not_connected(room, room.user2, connected_users, message)
        await create_room_chat_message(room, self.scope["user"], message)

        await self.channel_layer.group_send(
            room.group_name,
            {
                "type": "chat.message",
                "username": self.scope["user"].username,
                "user_id": self.scope["user"].id,
                "message": message,
            },
        )

    async def chat_message(self, event):

        timestamp = calculate_timestamp(timezone.now())
        try:
            await self.send_json(
                {
                    "username": event["username"],
                    "message": event["message"],
                    "natural_timestamp": timestamp,
                }
            )
        except Exception as e:
            print(f"An error occurred: {e}")

    async def send_messages_payload(self, messages, new_page_number):

        await self.send_json(
            {
                "messages_payload": "messages_payload",
                "messages": messages,
                "username": self.scope["user"].username,
                "new_page_number": new_page_number,
            }
        )

    async def send_user_info_payload(self, user_info):

        try:
            await self.send_json({"type": "user_info", "payload": user_info})
        except Exception as e:
            print(f"Error sending user info payload: {str(e)}")

    async def handle_client_error(self, e):

        errorData = {}
        errorData["error"] = e.code
        if e.message:
            errorData["message"] = e.message
            await self.send_json(errorData)
        return


@sync_to_async
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


def get_user_info(room: PrivateChatRoom, user):

    other_user = room.user1 if room.user2 == user else room.user2
    try:
        serializer = UserSerializer(other_user)
        data = serializer.data
        return data
    except Exception as e:
        return None


@database_sync_to_async
def create_room_chat_message(room, user, messages):
    return RoomChatMessage.objects.create(user=user, room=room, messages=messages)


@database_sync_to_async
def get_room_chat_messages(room, page_number):
    try:
        qs = RoomChatMessage.objects.by_room(room)
        p = Paginator(qs, MESSAGE_PAGE_SIZE)

        payload = {}
        messages_data = None
        new_page_number = int(page_number)
        if new_page_number <= p.num_pages:
            new_page_number = new_page_number + 1
            s = RoomChatMessageEncoder()
            payload["messages"] = s.serialize(p.page(page_number).object_list)
        else:
            payload["messages"] = "None"
        payload["new_page_number"] = new_page_number
        return json.dumps(payload)
    except Exception as e:
        print("EXCEPTION: " + str(e))
    return None


class RoomChatMessageEncoder(Serializer):
    def get_dump_object(self, obj):
        dump_object = {}
        dump_object.update({"msg_id": str(obj.id)})
        dump_object.update({"user_id": str(obj.user.id)})
        dump_object.update({"username": str(obj.user.username)})
        dump_object.update({"message": str(obj.messages)})
        dump_object.update({"natural_timestamp": calculate_timestamp(obj.timestamp)})
        return dump_object


@database_sync_to_async
def connect_user(room, user):
    account = UserAccount.objects.get(pk=user.id)
    room.connect_user(account)
    room.save()


@database_sync_to_async
def disconnect_user(room, user):
    account = UserAccount.objects.get(pk=user.id)
    room.disconnect_user(account)
    room.save()


@database_sync_to_async
def unread_msg_when_not_connected(room, user, connected_users, message):
    if not user in connected_users:
        try:
            unread_msgs = UnreadChatRoomMessages.objects.get(room=room, user=user)
            unread_msgs.most_recent_message = message
            unread_msgs.count += 1
            unread_msgs.save()
        except UnreadChatRoomMessages.DoesNotExist:
            UnreadChatRoomMessages.objects.get(room=room, user=user, count=1).save()
            pass
        return


@database_sync_to_async
def on_user_connected(room, user):
    connected_users = room.connected_users.all()
    if user in connected_users:
        try:
            unread_msgs = UnreadChatRoomMessages.objects.get(room=room, user=user)
            unread_msgs.count = 0
            unread_msgs.save()
        except UnreadChatRoomMessages.DoesNotExist:
            UnreadChatRoomMessages.objects.get(room=room, user=user).save()
            pass
        return
