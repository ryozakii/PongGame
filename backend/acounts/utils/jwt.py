import jwt
from datetime import datetime, timedelta
from rest_framework import authentication, exceptions
from django.conf import settings
from django.contrib.auth import get_user_model
import logging
from rest_framework.response import Response
from rest_framework import status
logger = logging.getLogger(__name__)

def generate_access_token(user, is_2fa_verified=False):
    """Generate access token for user"""
    payload = {
        'user_id': user.id,
        'token_type': 'access',
        'exp': datetime.utcnow() + timedelta(days=settings.JWT_AUTH['ACCESS_TOKEN_LIFETIME_MINUTES']),
        'iat': datetime.utcnow(),
        'is_2fa_verified': is_2fa_verified
    }
    
    return jwt.encode(
        payload,
        settings.JWT_AUTH['SECRET_KEY'],
        algorithm=settings.JWT_AUTH['ALGORITHM']
    )


def generate_refresh_token(user):
    """Generate refresh token for user"""
    payload = {
        'user_id': user.id,
        'token_type': 'refresh',
        'exp': datetime.utcnow() + timedelta(days=settings.JWT_AUTH['REFRESH_TOKEN_LIFETIME_DAYS']),
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(
        payload,
        settings.JWT_AUTH['REFRESH_SECRET_KEY'],
        algorithm=settings.JWT_AUTH['ALGORITHM']
    )

def set_token_cookies(response, access_token, refresh_token):
    """Set access and refresh token cookies"""
    response.set_cookie(
        key=settings.JWT_AUTH['AUTH_COOKIE'],
        value=access_token,
        expires=datetime.utcnow() + timedelta(minutes=settings.JWT_AUTH['ACCESS_TOKEN_LIFETIME_MINUTES']),
        secure=settings.JWT_AUTH['AUTH_COOKIE_SECURE'],
        httponly=True,
        samesite=settings.JWT_AUTH['AUTH_COOKIE_SAMESITE'],
        path=settings.JWT_AUTH.get('AUTH_COOKIE_PATH', '/')
    )
    
    response.set_cookie(
        key=settings.JWT_AUTH['REFRESH_COOKIE'],
        value=refresh_token,
        expires=datetime.utcnow() + timedelta(days=settings.JWT_AUTH['REFRESH_TOKEN_LIFETIME_DAYS']),
        secure=settings.JWT_AUTH['AUTH_COOKIE_SECURE'],
        httponly=True,
        samesite=settings.JWT_AUTH['AUTH_COOKIE_SAMESITE'],
        path=settings.JWT_AUTH.get('REFRESH_COOKIE_PATH', '/api/auth/refresh/')
    )

def catch_all(exc, context):
    return Response({"error": "Something went wrong!"}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)