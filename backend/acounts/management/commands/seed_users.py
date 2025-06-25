from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
import pyotp
import random

UserAccount = get_user_model()

class Command(BaseCommand):
    help = 'Seed database with sample users'

    def handle(self, *args, **options):
        self.stdout.write('Starting users seeding...')

        # Delete all existing users except superuser
        # UserAccount.objects.filter(is_superuser=False).delete()

        # Create regular users
        regular_users = [
            {
                'email': 'user1@example.com',
                'username': 'user1',
                'first_name': 'User',
                'last_name': 'One',
                'password': 'password123',
                'is_2fa_enabled': False,
            },
            {
                'email': 'user2@example.com',
                'username': 'user2',
                'first_name': 'User',
                'last_name': 'Two',
                'password': 'password123',
                'is_2fa_enabled': True,  # This user will have 2FA enabled
            }
        ]

        # Create 42 users
        fortytwo_users = [
            {
                'email': '42user1@42.fr',
                'username': '42user1',
                'first_name': '42User',
                'last_name': 'One',
                'password': 'password123',
                'from42': True,
                'is_2fa_enabled': False,
            },
            {
                'email': '42user2@42.fr',
                'username': '42user2',
                'first_name': '42User',
                'last_name': 'Two',
                'password': 'password123',
                'from42': True,
                'is_2fa_enabled': True,  # This user will have 2FA enabled
            }
        ]

        # Create all users
        for user_data in regular_users + fortytwo_users:
            try:
                # Check if user already exists
                if not UserAccount.objects.filter(email=user_data['email']).exists():
                    user = UserAccount.objects.create(
                        email=user_data['email'],
                        username=user_data['username'],
                        first_name=user_data['first_name'],
                        last_name=user_data['last_name'],
                        is_active=True,
                        from42=user_data.get('from42', False),
                        xp=random.randint(0, 1000),  # Random XP
                    )
                    user.set_password(user_data['password'])
                    
                    # Setup 2FA if enabled
                    if user_data['is_2fa_enabled']:
                        user.is_2fa_enabled = True
                        user.otp_secret = pyotp.random_base32()
                        user.otp_enabled_at = timezone.now()

                    user.save()
                    self.stdout.write(self.style.SUCCESS(f'Successfully created user: {user.email}'))
                else:
                    self.stdout.write(self.style.WARNING(f'User already exists: {user_data["email"]}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating user {user_data["email"]}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS('Users seeding completed!'))