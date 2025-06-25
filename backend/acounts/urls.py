
from django.urls import path, include, re_path     
from .views import SignUpView , LoginView, DeleteCookie,UserDetailView, VerifyEmailView,UserView, RequestPasswordResetView, ResetPasswordView,Auth42, Enable2FAView, Disable2FAView , ChangePasswordView, UserSettingView, GetAllUserView, GetCurrentUserView, UserProfileView, UpdateProfileView,Check2FAStatusView, HealthCheckView
from rest_framework_simplejwt.views import(
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
urlpatterns = [
    # Authentication URLs
    path('register', SignUpView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('logout/', DeleteCookie.as_view(), name='logout'),
    path('auth/', Auth42.as_view(), name='auth'),
    path('user/<str:user_id>/', UserDetailView.as_view(), name='user-detail'),
    # JWT URLs
    path('jwt/create/', TokenObtainPairView.as_view(), name='jwt_create'),
    path('jwt/refresh/', TokenRefreshView.as_view(), name='jwt_refresh'),
    path('jwt/verify/', TokenVerifyView.as_view(), name='jwt_verify'),

    # User URLs
    path('user/', UserView.as_view(), name='user'),
    path('2fa/enable/', Enable2FAView.as_view(), name='enable_2fa'),
    path('2fa/disable/', Disable2FAView.as_view(), name='disable_2fa'),

    path('current-user/', GetCurrentUserView.as_view(), name='current_user'),
    path('all-users/', GetAllUserView.as_view(), name='list_users'),
    path('user-profile/', UserProfileView.as_view(), name='user_profile'),
    path('update-profile/', UpdateProfileView.as_view(), name='update_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('settings/', UserSettingView.as_view(), name='view_settings'),
    path('2fa/status/', Check2FAStatusView.as_view(), name='check_2fa_status'),
    path('health-check/', HealthCheckView.as_view(), name='health_check'),
    path('verify-email/<str:token>', VerifyEmailView.as_view()),
    path('request-reset-password', RequestPasswordResetView.as_view()),
    path('reset-password/<str:token>', ResetPasswordView.as_view()),
]
    # path('auth/', include('djoser.urls')),    
    #     path('auth/', include('djoser.urls.jwt')),   
    # path('signup/', views.SignUpView.as_view(),name='signup'),                                           
                                                    
