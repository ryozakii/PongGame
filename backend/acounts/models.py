from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from gamestats.models import GameStats
from django.core.validators import MinLengthValidator, RegexValidator
import re

class UserAccountManager(BaseUserManager):

    def validate_password(self, password):
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter")
        if not re.search(r'\d', password):
            raise ValidationError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Password must contain at least one special character")

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')

        self.validate_password(password)
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

    def add_friend(self, user1, user2):
        """Method to add a friend relationship between two users."""
        if user1 == user2:
            raise ValueError("A user cannot be friends with themselves.")

        # Check if the friendship already exists
        if Friendship.objects.filter(user1=user1, user2=user2).exists() or \
           Friendship.objects.filter(user1=user2, user2=user1).exists():
            return None  # Friendship already exists

        try:
            # Create the friendship
            friendship = Friendship.objects.create(user1=user1, user2=user2)
            return friendship
        except IntegrityError:
            return None


class UserAccount(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    username = models.CharField(
        max_length=15,
        unique=True,
        validators=[
            MinLengthValidator(3),
            RegexValidator(
                regex=r"^[A-Za-z0-9-_]+$",
                message="Username can only contain letters and digits.",
                code="invalid_username",
            ),
        ],
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    image = models.ImageField(upload_to='images/', null=True, blank=True, default='images/strong.png')
    is_uptodate = models.BooleanField(default=True)
    xp = models.IntegerField(default=0)
    is_2fa_enabled = models.BooleanField(default=False)
    otp_secret = models.CharField(max_length=32, null=True, blank=True)
    otp_enabled_at = models.DateTimeField(null=True, blank=True)
    from42 = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    password_reset_token = models.CharField(max_length=100, blank=True, null=True)
    password_reset_expires = models.DateTimeField(null=True)

    objects = UserAccountManager()

    USERNAME_FIELD = 'email'  # Use email as the primary field for authentication
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Ensure GameStats is created
        GameStats.objects.get_or_create(user=self)

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        return self.first_name

    def __str__(self):
        return self.username


class Games(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    pong = models.BooleanField(default=False)
    player1 = models.ForeignKey(UserAccount, related_name='player1', on_delete=models.CASCADE)
    player2 = models.ForeignKey(UserAccount, related_name='player2', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    winner = models.ForeignKey(UserAccount, related_name='winner', null=True, on_delete=models.CASCADE, blank=True)
    score = models.CharField(max_length=255, null=True, blank=True)
    xp = models.IntegerField(default=0)

    def __str__(self):
        return str(self.id)
