from rest_framework import serializers
from .models import UserAccount
from gamestats.serializers import GameStatsSerializer
from rest_framework.serializers import Serializer, EmailField, CharField, ImageField
from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError

class SignUpSerializer(serializers.ModelSerializer):
    # Add image field with allow_null=True
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = UserAccount
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "image",
            "from42",
            "is_active",
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'is_active': {'default': True},
            'from42': {'default': False},
            'username': {'required': True}
        }

    def validate(self, attrs):
        try:
            password_validation.validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})  
        if 'email' in attrs and UserAccount.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email has already been used."})
        if 'username' in attrs and attrs['username'] and UserAccount.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username has already been used."})
        return attrs

    def create(self, validated_data):
        # Remove image from validated_data if it's a string
        if 'image' in validated_data and isinstance(validated_data['image'], str):
            validated_data.pop('image')

        password = validated_data.pop('password', None)
        user = super().create(validated_data)

        if password:
            user.set_password(password)
        user.save()

        return user

class UserAccountSerializer(serializers.ModelSerializer):
    gamestats = GameStatsSerializer()

    class Meta:
        model = UserAccount
        fields = ['id', 'image', 'username', 'gamestats']


class UserSerializer(serializers.HyperlinkedModelSerializer):
    gamestats = GameStatsSerializer(read_only=True)  # Include GameStats data

    class Meta:
        model = UserAccount
        fields = ['id', 'from42','username', 'email', 'first_name', 'last_name', 'image', 'gamestats']


class UserSerializerSearch(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ['username', 'first_name', 'last_name', 'id', 'image']

from django.core.validators import MinLengthValidator, RegexValidator
class UpdateProfileSerializer(Serializer):
    # email = EmailFixeld(required=False)
    username = CharField(
        required=False,
        max_length=15,
        validators=[
            MinLengthValidator(3),
            RegexValidator(
                regex=r"^[A-Za-z0-9-_]+$",  # Allows only alphabets and digits
                message="Username can only contain letters and digits.",
                code="invalid_username",
            ),
        ],
    )
    firstName = CharField(required=False, max_length=30)
    lastName = CharField(required=False, max_length=30)
    image = ImageField(required=False)
