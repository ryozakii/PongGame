# Create your models here.
from django.db import models
from django.conf import settings
import uuid
from django.utils import timezone
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

class PrivateChatRoom(models.Model):
	"""
	A private room for people to chat in.
	"""
	user1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user1")
	user2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user2")

	is_active = models.BooleanField(default=True)
	connected_users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="connected_users")

	def connect_user(self, user):
		if not user in self.connected_users.all():
			self.connected_users.add(user)

	def disconnect_user(self, user):

		if user in self.connected_users.all():
			#print("hi user will be disconnected\n")
			self.connected_users.remove(user)

	@property
	def group_name(self):
		"""
		Channels Group name
		"""
		return f"PrivateChatRoom-{self.id}"

class RoomChatMessageManager(models.Manager):
	def by_room(self, room):
		qs = RoomChatMessage.objects.filter(room=room).order_by("-timestamp")
		return qs

class RoomChatMessage(models.Model):
    """
	Chat message created by a user inside a Room
	"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room = models.ForeignKey(PrivateChatRoom, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    messages = models.TextField(
        unique=False,
        blank=False,
        max_length=500,
)

    objects = RoomChatMessageManager()

    def __str__(self):
        return self.messages


class UnreadChatRoomMessages(models.Model):
	"""
	number of unread messages by a user in a room
	"""
	room                = models.ForeignKey(PrivateChatRoom, on_delete=models.CASCADE, related_name="room")

	user                = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

	count               = models.IntegerField(default=0)

	most_recent_message = models.CharField(max_length=500, blank=True, null=True)

	reset_timestamp     = models.DateTimeField()



	def __str__(self):
		return f"Messages that {str(self.user.username)} has not read yet."

	def save(self, *args, **kwargs):
		if not self.id:
			self.reset_timestamp = timezone.now()
		return super(UnreadChatRoomMessages, self).save(*args, **kwargs)

	@property
	def get_cname(self):
		return "UnreadChatRoomMessages"

	@property
	def get_other_user(self):
		"""
		Get the other user in the chat room
		"""
		if self.user == self.room.user1:
			return self.room.user2
		else:
			return self.room.user1
