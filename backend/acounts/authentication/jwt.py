import jwt
from rest_framework import authentication, exceptions
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status

class InvalidTokenError(exceptions.AuthenticationFailed):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Invalid token'
    default_code = 'invalid_token'

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        # Get access token from cookie
        access_token = request.COOKIES.get(settings.JWT_AUTH['AUTH_COOKIE'])
        
        if not access_token:
            return None

        try:
            # Decode the access token
            payload = jwt.decode(
                access_token,
                settings.JWT_AUTH['SECRET_KEY'],
                algorithms=[settings.JWT_AUTH['ALGORITHM']]
            )
            
            # Verify token type
            if payload.get('token_type') != 'access':
                raise exceptions.AuthenticationFailed('Invalid token type')

            # Get user
            User = get_user_model()
            user = User.objects.get(id=payload['user_id'])
            
            # Check 2FA
            if user.is_2fa_enabled and not payload.get('is_2fa_verified', False):
                raise exceptions.AuthenticationFailed('2FA verification required')
            #print("kk")
            return (user, access_token)

        except jwt.ExpiredSignatureError:
            #print("kk")
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            #print("kk")
            raise exceptions.AuthenticationFailed('Invalid token')
        except User.DoesNotExist:
            #print("kk")
            raise exceptions.AuthenticationFailed('User not found')
        except Exception as e:
            #print("kk")
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')

    def authenticate_header(self, request):
        return 'Bearer realm="api"'