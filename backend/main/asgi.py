# mysite/asgi.py
import os
import django

django.setup()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from asgiref.sync import sync_to_async
from rest_framework import exceptions
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "main.settings")
# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# from tictac.routing import websocket_urlpatterns
# from pingpong.routing import websocket_urlpatterns
import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.conf import settings
import jwt
from channels.exceptions import DenyConnection,StopConsumer
class AuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        ##print("test")
        super().__init__(inner)
        self.jwt_authentication = JWTAuthentication()

    @database_sync_to_async
    def get_user(self, validated_token):
        try:
            return self.jwt_authentication.get_user(validated_token)
        except AuthenticationFailed:
            return AnonymousUser()

    async def __call__(self, scope, receive, send):
        try:
            headers = dict(scope.get("headers", []))
            raw_token = None
            ##print("headers",headers)
            # await send({
            #             "type": "websocket.close",
            #             "code": 4004,  # Close the connection
            #         })
            # send back the headers
            # return none
            # Try to get token from Authorization header

            if b"sec-websocket-protocol" in headers:
                try:
                    ##print("works")
                    raw_token = headers[b"sec-websocket-protocol"].decode()[6:]
                    print("raw",raw_token)
                    # del headers[b"sec-websocket-protocol"]
                    ##print("raw_token = ",raw_token)
                except:
                    # send message to online client

                    raise StopConsumer("invalid auth")
                    # scope["user"] = AnonymousUser()
            elif b"authorization" in headers:
                try:
                    ##print("worksaa")
                    auth_header = headers[b"authorization"]
                    prefix, token = auth_header.split()
                    ##print("prefix ===== ",prefix)
                    ##print("token ===== ",token)
                    raw_token = token.decode()
                except ValueError:
                    await send({
                    "type": "websocket.close",
                    "code": 4001  # Custom close code for "Authentication Failed"
                })
                    raise StopConsumer("invalid auth")

                    # scope["user"] = AnonymousUser()
                    # return await super().__call__(scope, receive, send)
            else:
                # Try to get token from cookies

                cookies = scope.get("cookies", {})
                raw_token = cookies.get('Authorization')
            if not raw_token:
                await send({
                    "type": "websocket.close",
                    "code": 4001  # Custom close code for "Authentication Failed"
                })
                raise StopConsumer("invalid auth")

                
                # scope["user"] = AnonymousUser()
                # return await super().__call__(scope, receive, send)
            try:
                ##print('raw_token2 ', raw_token)
                payload = jwt.decode(
                    raw_token,
                    settings.JWT_AUTH['SECRET_KEY'],
                    algorithms=[settings.JWT_AUTH['ALGORITHM']]
                )
                if payload.get('token_type') != 'access':
                    raise StopConsumer("invalid auth")
                # Get user
                ##print('payload ', payload)
                User = await sync_to_async(get_user_model)()
                user = await sync_to_async(lambda: User.objects.get(id=payload['user_id']))()
                if user.is_2fa_enabled and not payload.get('is_2fa_verified', False):
                    raise StopConsumer("invalid auth")
                # user ="eqweqwe"
                scope["user"] = user
                # if not b"sec-websocket-protocol" in headers:
                #     scope["headers"] += [(b"sec-websocket-protocol", b"json")]
                return await super().__call__(scope, receive, send)
            except (InvalidToken, AuthenticationFailed):
                await send({
                    "type": "websocket.close",
                    "code": 4001  # Custom close code for "Authentication Failed"
                })
                raise StopConsumer("invalid auth")

        except Exception as e:
            # Catch-all for unexpected exceptions
            ##print(f"Unexpected error: {e}")
            await send({
                "type": "websocket.close",
                "code": 4001, 
            })
            ##print( e)

from django.core.cache import cache
from pingpong.consumers import PingPongConsumer#,PingPongConsumer1v1
# from pingpong.consumers import TournamentConsumer
# from tictac.consumers import Test
from tictac.consumers import TicTacConsumer#,TicTacConsumer1v1
from notification.consumers import NotificationConsumer
from chat.consumers import ChatConsumer,StatusConsumer
from django.urls import path
from channels.security.websocket import OriginValidator
from channels.middleware import BaseMiddleware
# from tictac.consumers import Matchmaking1v1
class RateLimitMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        ip_address = scope["client"][0]
        key = f"ws_rate_limit_{ip_address}"
        connection_count = cache.get(key, 0)

        if connection_count >= 10:  # Allow max 10 connections
            await send({
                "type": "websocket.close",
                "code": 4004,  # Close the connection
            })
        else:
            cache.set(key, connection_count + 1, timeout=60)  # 1 min timeout
            return await super().__call__(scope, receive, send)

websocket_urlpatterns = [
    path("ws/ping_pong/", PingPongConsumer.as_asgi()),
    path("ws/tic_tac/", TicTacConsumer.as_asgi()),
    path("ws/tic_tac/<str:room_name>/", TicTacConsumer.as_asgi()),
    path("ws/ping_pong/<str:room_name>/", PingPongConsumer.as_asgi()),
    path('ws/chat/<room_id>/', ChatConsumer.as_asgi()),
    # path('ws/tournament/', TournamentConsumer.as_asgi()),
    path('ws/notification/', NotificationConsumer.as_asgi()),
    path('ws/status/',StatusConsumer.as_asgi())
    # path("ping_pong/<str:room_name>/", PingPongConsumer1v1.as_asgi()),
    # path("tic_tac/<str:room_name>/", TicTacConsumer1v1.as_asgi()),
]
from .settings import ALLOWED_HOSTS
application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": (
            AuthMiddlewareStack(AuthMiddleware(URLRouter(
                websocket_urlpatterns
                ))))
        ,
        #remember to check if csrf is necessary 
        # "websocket":URLRouter(websocket_urlpatterns)
        # ,
    }
)
