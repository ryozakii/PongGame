
from rest_framework import exceptions
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
#from django.middleware.csrf import get_token
#from . import verify
# class DefaultAuthentication:
    
#     def __init__(self):
#         self.jwt_authentication = JWTAuthentication()

#     def authenticate(self, request):
#         header = self.jwt_authentication.get_header(request)
        
#         raw_token = None
#         if header is None:
#             raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE']) or None
#         else:
#             raw_token = JWTAuthentication().get_raw_token(header)
#         if raw_token is None:
#             return None
#         try:
#             validated_token = self.jwt_authentication.get_validated_token(raw_token)
#         except exceptions.AuthenticationFailed as e:
#             # Handle authentication failure gracefully
#             raise exceptions.AuthenticationFailed('Invalid token: %s' % e)
        
#         #----------------------------------------------------
#         # test for 2fa auth

#         user= self.jwt_authentication.get_user(validated_token)

#         # if user.is_2fa:
#         #     pass
#         # else:
#         #     pass
#         #----------------------------------------------------
#         return user, validated_token


#     def authenticate_header(self, request):
#         """
#         Return the value of the WWW-Authenticate header in response to a
#         request that was not authenticated.
#         """
#         return 'Authentication realm="api"'
