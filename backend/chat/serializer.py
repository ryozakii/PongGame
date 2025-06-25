# chat/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from chat.models import PrivateChatRoom
from rest_framework import serializers
from chat.models import RoomChatMessage

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'image']

class FriendSerializer(serializers.Serializer):
    friend = UserSerializer()
    last_message = serializers.CharField(allow_blank=True)
    unread_count = serializers.IntegerField()

class PrivateChatRoomSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)

    class Meta:
        model = PrivateChatRoom
        fields = ['id', 'user1', 'user2', 'is_active']

class CreatePrivateChatSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True, help_text="ID of the user to chat with")



class RoomChatMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    user_id = serializers.IntegerField(source='user.id')
    natural_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = RoomChatMessage
        fields = ['id', 'user_id', 'username', 'content', 'profile_image', 'natural_timestamp']

    def get_natural_timestamp(self, obj):
        return calculate_timestamp(obj.timestamp)
