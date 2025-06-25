from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import get_object_or_404
from acounts.models import UserAccount
from .models import GameStats
from acounts.authentication.jwt import JWTAuthentication
from .serializers import GameStatsSerializer


class UserAchievementStatsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = get_object_or_404(UserAccount, id=user_id)
        gamestats = get_object_or_404(GameStats, user=user)
        new_achievements = gamestats.get_achievements()
        return Response(new_achievements, status=200)


class PingPongLeaderBoardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_object_or_404(UserAccount, id=request.user.id)
        gamestats, created = GameStats.objects.get_or_create(user=user)
        try:
            data = gamestats.get_pingpong_rankings()
        except Exception as e:
            return Response({"error": str(e)}, status=404)
        return Response(data, status=200)


class TicTacToeLeaderBoardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = get_object_or_404(UserAccount, id=request.user.id)
        gamestats, created = GameStats.objects.get_or_create(user=user)
        try:
            data = gamestats.get_tictactoe_rankings()
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        return Response(data, status=200)


class LastGamesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = get_object_or_404(UserAccount, id=user_id)
        gamestats, created = GameStats.objects.get_or_create(user=user)
        data = gamestats.all_last_game()
        return Response(data, status=200)


class GamesPerDayView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = get_object_or_404(UserAccount, id=user_id)
        gamestats, created = GameStats.objects.get_or_create(user=user)
        data = gamestats.get_weekly_game_data()
        return Response(data, status=200)


class UserGameStatsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = get_object_or_404(UserAccount, id=user_id)
        gamestats, created = GameStats.objects.get_or_create(user=user)
        if not user.is_uptodate:
            gamestats.calculate_status_game()
        serializer = GameStatsSerializer(gamestats)
        return Response(serializer.data, status=200)