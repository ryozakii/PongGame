from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import UnreadChatRoomMessages, PrivateChatRoom

@receiver(post_save, sender=PrivateChatRoom)
def create_unread_chatroom_messages_obj(sender, instance, created, **kwargs):
	#print("hello from create_unread_chatroom_messages_obj")
	if created:
		#print("hello from create_unread_chatroom_messages_obj it works")
		unread_msgs1 = UnreadChatRoomMessages(room=instance, user=instance.user1)
		unread_msgs1.save()
		#print("is passed")
		unread_msgs2 = UnreadChatRoomMessages(room=instance, user=instance.user2)
		unread_msgs2.save()