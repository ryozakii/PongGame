from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from acounts.serializers import UserSerializer
import time
import asyncio
import json
from django.core.cache import cache
import random
from .models import Notification
from .serializers import NotificationSerializer
cache.set("online_users", [], timeout=None)
class NotificationConsumer(AsyncJsonWebsocketConsumer):
    # users = set()
    async def add_user_to_cache(self,user_id):
        online_users = cache.get("online_users", [])  # Default to an empty list
        online_users.append(user_id)
        # #print("online users ===== ",online_users)
        cache.set("online_users", online_users)
        await self.channel_layer.group_add(
            str(self.user.get('id')),
            self.channel_name
        )
    
    # async def find_user(self,username):
    #     online_users = cache.get("online_users", [])
    #     for user in online_users:
    #         if username in user:
    #             return True
    #     return Falsegr
    async def remove_user_from_cache(self,user_id):
        online_users = cache.get("online_users", [])
        if user_id in online_users:
            online_users.remove(user_id)
            cache.set("online_users", online_users)
        await self.channel_layer.group_discard(
            str(self.user.get('id')),
            self.channel_name
        )
            
            
    async def connect(self):
        #print('user ==', self.scope.get('user'))
        if b"sec-websocket-protocol" in dict(self.scope.get("headers", {})):
            await self.accept(subprotocol="json")
        else:
            await self.accept()
        #print('channel name ',self.channel_name)
        self.user = await sync_to_async(lambda: UserSerializer(self.scope.get('user')).data)()
        # NotificationConsumer.users.add(self.user.get('username'))
        await self.add_user_to_cache(self.user.get('id'))
        #print("Connected t o websocket y  a 3ami")
        await self.channel_layer.send(self.channel_name, {
            "type": "send_notification",
        })

    async def disconnect(self, close_code):
        await self.remove_user_from_cache(self.user.get('id'))

    async def receive(self, text_data):
        pass

    async def send_notification(self, event):
        # notification = await sync_to_async(lambda: Notification.objects.get(user=self.scope.get('user')))()
        # notifications = await sync_to_async(lambda: NotificationSerializer(notification).data)()
        # notifications = await sync_to_async(Notifications.objects.filter(   )
        notifications = await sync_to_async(Notification.objects.filter)(user=self.scope.get('user'))
        #sort
        notifications = await sync_to_async(lambda : notifications.order_by('-timestamp'))()
        notifications = await sync_to_async(lambda : NotificationSerializer(notifications, many=True).data)()
        # #print("notifications = ",notifications)
        await self.send_json({'type' : 'update','count' : len(notifications),'notifications' : notifications})
        
    async def add_notification(self, event):
        notification = await sync_to_async(lambda: Notification.objects.create(user=self.scope.get('user'),message=event.get('message'),category=event.get('category'),image =event.get('image'),href=event.get('href')))()
        await sync_to_async(notification.save)()
        await self.channel_layer.send(self.channel_name, {
            "type": "send_notification",
        })
        # count = random.randint(0, 100)
        # try:
        #     Notifications = await sync_to_async(lambda: Notification.objects.get(user=self.scope.get('user')))()
        # except Notification.DoesNotExist:
        #     Notifications = await sync_to_async(lambda: Notification.objects.create(user=self.scope.get('user')))()
        # if not 'value' in event:
        #     Notifications.count = Notifications.count + 1
        # await sync_to_async(Notifications.save)()
        # #print("Notifications = ",Notifications)
        # #print("event = ",event)
        # await self.send_json({'type' : 'update','count' : Notifications.count,'notifications' : []})
    async def clear_notification(self, event):
        #print("clear notification")
        try:
             notifications = await sync_to_async(Notification.objects.filter)(user=self.scope.get('user'))
        except Notification.DoesNotExist:
            return
        await sync_to_async(notifications.delete)()
        await self.channel_layer.send(self.channel_name, {
            "type": "send_notification",
        })
        # await self.send_json({'type' : 'update','count' : 0,'notifications' : []})
        # await sync_to_async(Notifications.save)()
        # await self.send_json({'type' : 'update','count' : Notifications.count,'notifications' : []})