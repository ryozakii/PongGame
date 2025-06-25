from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status, viewsets, generics
from .models import UserAccount
from django.contrib.auth import authenticate
from .serializers import SignUpSerializer, UserSerializer
# from .utils.jwt import generate_tokens_for_user
import json
from django.views.generic.edit import DeleteView

from main import settings
from acounts.models import UserAccount
# ----------------------------------------------------------
from django.http import HttpResponse

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.db.models import Q
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.middleware.csrf import get_token
from django.conf import settings
import os
import requests
from .models import UserAccount
from .serializers import (
    SignUpSerializer,
    UserSerializerSearch,
    UserAccountSerializer,
    UserSerializer,
    UpdateProfileSerializer,

)
from gamestats.models import GameStats
from friends.models import Friendship
# from .authenticate import JWTAuthentication
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.utils.decorators import method_decorator
from django.core.exceptions import ValidationError


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .authentication.jwt import JWTAuthentication ,InvalidTokenError
from .utils.two_factor import (
    generate_otp_secret,
    verify_otp_code,
    generate_otp_qr_code
)

from PIL import Image


# from .utils import validate_password
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
import secrets
from datetime import timedelta

# from .middlewares import csrf_exempt_view
# logger = logging.getLogger('django')
# @method_decorator(csrf_exempt_view, name='dispatch')


class SignUpView(generics.GenericAPIView):
    serializer_class = SignUpSerializer

    def post(self, request: Request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            new_user = serializer.save()
            token = secrets.token_urlsafe()
            new_user.email_verification_token = token
            new_user.save()
            verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"
            send_mail(
                'Verify your email',
                f'Click here to verify your email: {verification_url}',
                settings.DEFAULT_FROM_EMAIL,
                [new_user.email]
            )
            response = {
                'message': 'User Created Successfully',
                'data': serializer.data
            }
            return Response(data=response, status=status.HTTP_201_CREATED)
        return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    def get(self, request, token):
        user = get_object_or_404(UserAccount, email_verification_token=token)
        user.email_verified = True
        user.email_verification_token = None
        user.save()
        return Response({'message': 'Email verified successfully'})

class RequestPasswordResetView(APIView):
    def post(self, request):
        email = request.data.get('email')
        user = get_object_or_404(UserAccount, email=email)
        
        token = secrets.token_urlsafe()
        user.password_reset_token = token
        user.password_reset_expires = timezone.now() + timedelta(hours=1)
        user.save()
        
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"
        send_mail(
            'Reset your password',
            f'Click here to reset your password: {reset_url}',
            settings.DEFAULT_FROM_EMAIL,
            [email]
        )
        return Response({'message': 'Password reset instructions sent'})

class ResetPasswordView(APIView):
    def post(self, request, token):
        user = get_object_or_404(UserAccount, 
                                password_reset_token=token,
                                password_reset_expires__gt=timezone.now())
        
        password = request.data.get('password')
        user.set_password(password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.save()
        
        return Response({'message': 'Password reset successfully'})


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


from .utils.jwt import generate_access_token, generate_refresh_token, set_token_cookies

class LoginView(APIView):

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        otp_token = request.data.get('otp_token')

        if not email or not password:
            return Response({
                'message': 'Please provide both email and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(email=email, password=password)

        if not user:
            return Response({
                'message': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.email_verified:
            return Response({
                'message': 'Please verify your email before logging in'
            }, status=status.HTTP_403_FORBIDDEN)

        if not user.is_2fa_enabled:
            access_token = generate_access_token(user, is_2fa_verified=True)
            refresh_token = generate_refresh_token(user)

            response = Response({
                'message': 'Successfully logged in',
                'data': {
                    'access': access_token
                }
            })

            set_token_cookies(response, access_token, refresh_token)
            return response

        if user.is_2fa_enabled and not otp_token:
            qr_code = generate_otp_qr_code(user.email, user.otp_secret)
            return Response({
                'error': '2FA required',
                'requires_2fa': True,
                # 'qr_code': qr_code,
                'message': 'Please enter your 2FA code'
            }, status=status.HTTP_200_OK)

        if not verify_otp_code(user.otp_secret, otp_token):
            return Response({
                'message': 'Invalid 2FA code'
            }, status=status.HTTP_401_UNAUTHORIZED)

        access_token = generate_access_token(user, is_2fa_verified=True)
        refresh_token = generate_refresh_token(user)

        response = Response({
            'message': 'Successfully logged in',
            'data': {
                'access': access_token
            }
        })

        set_token_cookies(response, access_token, refresh_token)
        return response


class DeleteCookie(APIView):
    authentication_classes = []

    def get(self, request, format=None):
        response = Response()
        response.data = {"Message": "Cookies deleted"}
        response.delete_cookie('Authorization')
        return response

from django.core.files.base import ContentFile
from urllib.parse import urlparse
from pathlib import Path
import random
from django.db.models import Q
import string

def generate_random_password(length=12):
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

class Auth42(APIView):
    def generate_tokens(self, user, is_2fa_verified=False):
        """Generate access token for user"""
        access_token = generate_access_token(
            user,
            is_2fa_verified=is_2fa_verified
        )
        refresh_token = generate_refresh_token(user)
        return access_token, refresh_token
    def update_user_image(self, user, image_url):
        try:
            # Only update if the user has no image or the image URL is different
            if not user.image or urlparse(image_url).path.split('/')[-1] != user.image.name.split('/')[-1]:
                # Download the image from the URL
                response = requests.get(image_url)
                if response.status_code == 200:
                    # Get the filename from the URL
                    filename = Path(urlparse(image_url).path).name
                    # Save the image to the ImageField
                    user.image.save(
                        filename,
                        ContentFile(response.content),
                        save=True
                    )
                    return True
        except Exception as e:
            print(f"Error updating image: {e}")
            return False
        return True
    def successful_login(self, request, user, isTrue=False):
        if user.is_2fa_enabled:
            qr_code = generate_otp_qr_code(user.email, user.otp_secret)
            return Response({
                'error': '2FA required',
                'requires_2fa': True,
                # 'qr_code': qr_code,
                'message': 'Please enter your 2FA code'
            }, status=status.HTTP_200_OK)

        access_token, refresh_token = self.generate_tokens(user)
        if isTrue :
            response = Response({
            'message': 'Successfully logged in',
            'warning': f'your username alrady exist but not 42 user for that we change it to {user.username} feel free to change it in Setting',
            'data': {
                'access': access_token
            }
            })
        response = Response({
            'message': 'Successfully logged in',
            'data': {
                'access': access_token
            }
        })

        # Set tokens in cookies
        set_token_cookies(response, access_token, refresh_token)
        return response

    def get(self, request, format=None):
        code = self.request.query_params.get('code')
        otp_token = self.request.query_params.get('otp_token')
        test = False

        # If we have an OTP token, use stored user info from session
        if otp_token:
            user_data = request.session.get('42_user_info')
            if not user_data:
                return Response({
                    "error": "Authentication session expired"
                }, status=status.HTTP_401_UNAUTHORIZED)

            user = UserAccount.objects.filter(username=user_data['login']).first()
            if user and user.is_2fa_enabled:
                if not verify_otp_code(user.otp_secret, otp_token):
                    return Response({
                        "error": "Invalid 2FA code"
                    }, status=status.HTTP_401_UNAUTHORIZED)

                access_token, refresh_token = self.generate_tokens(user, is_2fa_verified=True)
                response = Response({
                    'message': 'Successfully logged in',
                    'data': {
                        'access': access_token
                    }
                })
                set_token_cookies(response, access_token, refresh_token)
                request.session.pop('42_user_info', None)
                return response

        # Normal OAuth flow with code
        try:
            # Exchange code for 42 access token
            token_data = {
                "grant_type": "authorization_code",
                "client_id": settings.API_AUTH['42_CLIENT_ID'],
                "client_secret": settings.API_AUTH['42_CLIENT_SECRET'],
                "code": code,
                "redirect_uri": settings.API_AUTH['REDIRECT_URL'],
            }

            print("Requesting 42 token with data:", {**token_data, 'client_secret': '[HIDDEN]'})

            token_response = requests.post(
                "https://api.intra.42.fr/oauth/token",
                data=token_data
            )

            if not token_response.ok:
                return Response({
                    "error": f"Failed to get access token: {token_response.text}"
                }, status=status.HTTP_400_BAD_REQUEST)

            token_data = token_response.json()
            ft_access_token = token_data.get('access_token')

            if not ft_access_token:
                return Response({
                    "error": "No access token in response"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get user info
            user_info = requests.get(
                "https://api.intra.42.fr/v2/me",
                headers={"Authorization": f"Bearer {ft_access_token}"}
            )

            if not user_info.ok:
                return Response({
                    "error": "Failed to get user info"
                }, status=status.HTTP_400_BAD_REQUEST)

            user_data = user_info.json()
            request.session['42_user_info'] = user_data

            # Check existing user
            user = UserAccount.objects.filter(email=user_data['email']).first()
            user1 = UserAccount.objects.filter(username=user_data['login']).exclude(email=user_data['email']).first()
            print("user1",user1)

            if user1 :
                if not user1.from42:
                    random_char = random.choice(string.ascii_letters)
                    user_data['login'] = user_data['login'] + random_char
                    test = True

            if user:
                image_url = user_data['image']['link']
                self.update_user_image(user, image_url)
                if not user.from42:
                    return Response({
                        "error": "User exists but is not a 42 user"
                    }, status=status.HTTP_400_BAD_REQUEST)

                if user.is_2fa_enabled:
                    qr_code = generate_otp_qr_code(user.email, user.otp_secret)
                    return Response({
                        'error': '2FA required',
                        'requires_2fa': True,
                        # 'qr_code': qr_code,
                        'message': 'Please enter your 2FA code'
                    }, status=status.HTTP_200_OK)

                return self.successful_login(request, user,test)

            # Create new user
            new_user_data = {
                "username": user_data['login'],
                "email": user_data['email'],
                "first_name": user_data['first_name'],
                "last_name": user_data['last_name'],
                "password": generate_random_password(),
                "from42": True,
                "is_active": True
            }
            # image_url = user_data['image']['link']
            # self.update_user_image(new_user_data, image_url)

            serializer = SignUpSerializer(data=new_user_data)
            if not serializer.is_valid():
                return Response({
                    "message": "Failed to create user",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            new_user = serializer.save()
            image_url = user_data['image']['link']
            self.update_user_image(new_user, image_url)
            print("new_user", new_user)
            return self.successful_login(request, new_user)

        except Exception as e:
            print("Error in Auth42:", str(e))
            return Response(
                {"error": f"Authentication failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST)  # change this


class UserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        """Custom exception handler for the view"""
        if isinstance(exc, InvalidTokenError):
            # Return the prepared response from the authentication class
            return getattr(exc, 'response', Response(
                {'error': str(exc)},
                status=status.HTTP_401_UNAUTHORIZED
            ))
        return super().handle_exception(exc)

    def get(self, request):
        try:
            user = request.user
            return Response(UserSerializer(user).data)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'An unexpected error occurred'},
                status=status.HTTP_400_BAD_REQUEST  # Change to desired status
            )


class Enable2FAView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Initiate 2FA setup"""
        user = request.user
        
        if user.is_2fa_enabled:
            return Response(
                {"error": "2FA is already enabled"},
                status=status.HTTP_400_BAD_REQUEST
            )

        secret = generate_otp_secret()
        qr_code = generate_otp_qr_code(user.email, secret)

        request.session['temp_otp_secret'] = secret

        return Response({
            "message": "2FA setup initiated",
            "secret": secret,
            "qr_code": qr_code
        })

    def put(self, request):
        user = request.user
        otp_code = request.data.get('otp_code')
        temp_secret = request.session.get('temp_otp_secret')

        if not temp_secret:
            return Response(
                {"error": "2FA setup not initiated or session expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not verify_otp_code(temp_secret, otp_code):
            return Response(
                {"error": "Invalid 2FA code"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save the OTP secret and enable 2FA
        user.otp_secret = temp_secret
        user.is_2fa_enabled = True
        user.otp_enabled_at = timezone.now()
        user.save()

        # Clean up session data
        del request.session['temp_otp_secret']

        # Generate a new JWT token with updated 2FA verification status
        new_token = generate_access_token(user, is_2fa_verified=True)
        refresh_token = generate_refresh_token(user)


        # Set the new JWT token in the response cookie
        response = Response({
            "message": "2FA enabled successfully",
            "token": new_token  # Optional: Include the token in the response body if needed
        })
        set_token_cookies(response, new_token, refresh_token)
        # Set the new JWT token in the cookie

        return response


class Check2FAStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'is_2fa_enabled': user.is_2fa_enabled,
            'message': '2FA is enabled' if user.is_2fa_enabled else '2FA is not enabled'
        })

class Disable2FAView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        otp_code = request.data.get('otp_code')

        if not user.is_2fa_enabled:
            return Response(
                {"error": "2FA is not enabled"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not verify_otp_code(user.otp_secret, otp_code):
            return Response(
                {"error": "Invalid 2FA code"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user.is_2fa_enabled = False
        user.otp_secret = None
        user.otp_enabled_at = None
        user.save()

        return Response({
            "message": "2FA disabled successfully"
        })


class GetCurrentUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_object_or_404(UserAccount, id=request.user.id)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDetailView(APIView):
    # permission_classes = [IsAuthenticated]
    def get(self, request, user_id):
        try:
            user = UserAccount.objects.get(id=user_id)
            return Response(
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                status=status.HTTP_200_OK,
            )
        except UserAccount.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


class GetAllUserView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = UserAccount.objects.filter(is_staff=False, is_superuser=False)
        current_user = request.user

        blocked_me_ids = Friendship.objects.filter(
            user2=current_user, 
            status=Friendship.BLOCKED
        ).values_list('user1', flat=True)

        blocked_by_me_ids = Friendship.objects.filter(
            user1=current_user, 
            status=Friendship.BLOCKED
        ).values_list('user2', flat=True)

        users = users.exclude(
            id__in=blocked_me_ids
        ).exclude(
            id__in=blocked_by_me_ids
        ).exclude(
            id=current_user.id
        )

        serializer = UserSerializerSearch(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserSettingView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_object_or_404(UserAccount, id=request.user.id)
        data = {
            'firstname': user.first_name,
            'lastname': user.last_name,
            'username': user.username,
            'email': user.email,
            'from42': user.from42,
            'image': user.image.url if user.image else None,
        }
        return JsonResponse(data, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_object_or_404(UserAccount, id=request.user.id)
        gamestats, created = GameStats.objects.get_or_create(user=user)
        if not user.is_uptodate:
            gamestats.calculate_status_game()
        serializer = UserAccountSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_object_or_404(UserAccount, id=request.user.id)
        gamestats, created = GameStats.objects.get_or_create(user=user)
        if not user.is_uptodate:
            gamestats.calculate_status_game()
        serializer = UserAccountSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @staticmethod
    def validate_image(file):
        """
        Validate whether the uploaded file is a valid image.
        """
        try:
            img = Image.open(file)
            img.verify()  
            return True
        except Exception:
            return False

    def patch(self, request):
        user = get_object_or_404(UserAccount, id=request.user.id)

        serializer = UpdateProfileSerializer(data=request.data)
        
        if not serializer.is_valid():
            if 'username' in serializer.errors and 'invalid_username' in serializer.errors['username'][0]:
                return Response({'error': 'Username can only contain letters and digits.'}, status=status.HTTP_400_BAD_REQUEST)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data


        if 'username' in data:
            username = data['username']
            if username != user.username and UserAccount.objects.filter(username=username).exists():
                return Response({'error': 'Username is already in use.'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username

        if 'firstName' in data:
            user.first_name = data['firstName']
        if 'lastName' in data:
            user.last_name = data['lastName']


        if 'image' in request.FILES:
            image_file = request.FILES['image']
            if not self.validate_image(image_file):
                return Response({'error': 'Invalid image file.'}, status=status.HTTP_400_BAD_REQUEST)

            default_image_name = UserAccount._meta.get_field('image').default

            if user.image and user.image.name != default_image_name:
                try:
                    user.image.delete() 

                except Exception as e:
                    return Response(
                        {"error": f"Error deleting old image: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            user.image = image_file

        user.save()

        updated_data = {
            'username': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'email': user.email,
            'image': user.image.url if user.image and user.image.name else None,
            'fullName': f"{user.first_name} {user.last_name}".strip(),
        }

        return Response(
            {
                'message': f'Profile for {user.email} updated successfully',
                'data': updated_data,
            },
            status=status.HTTP_200_OK
        )


class ChangePasswordView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = get_object_or_404(UserAccount, id=request.user.id)
        data = request.data

        if 'old_password' not in data or 'new_password' not in data:
            return Response(
                {'error': 'Old password and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if old_password == new_password:
            return Response(
                {'error': 'New password cannot be the same as the old password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'error': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {'message': f'Password for {user.email} changed successfully.'},
            status=status.HTTP_200_OK
        )


class HealthCheckView(APIView):
   permission_classes = []  
   
   def get(self, request):
       try:
           with connection.cursor() as cursor:
               cursor.execute("SELECT 1")
           
           return Response({"status": "healthy"})
       except Exception as e:
           return Response(
               {"status": "unhealthy", "error": str(e)},
               status=status.HTTP_503_SERVICE_UNAVAILABLE
           )
