from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UserAccount, Games
from friends.models import Friendship
from gamestats.models import GameStats, Achievement


class UserAccountAdmin(UserAdmin):
    model = UserAccount
    list_display = (
        'username', 'email', 'first_name', 'last_name', 
        'is_staff', 'is_active', 'is_superuser', 'image', 'is_uptodate'
    )
    list_filter = ('is_staff', 'is_active', 'is_superuser')
    
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password', 'image', 'is_uptodate')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'first_name', 'last_name', 
                'password1', 'password2', 'is_staff', 'is_active', 
                'is_superuser', 'is_uptodate'
            )}
        ),
    )
    
    search_fields = ('email', 'first_name', 'last_name', 'username')
    ordering = ('username',)


class GamesAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'pong', 'player1', 'player2', 'created_at', 
        'winner', 'score', 'xp'
    )
    list_filter = ('pong', 'created_at', 'winner')
    search_fields = ('player1__username', 'player2__username', 'winner__username')
    ordering = ('-created_at',)


# Register models with their respective admin classes
admin.site.register(UserAccount, UserAccountAdmin)
admin.site.register(Games, GamesAdmin)
