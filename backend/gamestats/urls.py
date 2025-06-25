from django.urls import path
from .views import (
    PingPongLeaderBoardView,
    TicTacToeLeaderBoardView,
    UserAchievementStatsView,
    UserGameStatsView,
    LastGamesView,
    GamesPerDayView  # Corrected typo here
)

urlpatterns = [
    path('ping-pong-leaderboard/', PingPongLeaderBoardView.as_view(), name='ping_pong_leaderboard'),
    path('tic-tac-toe-leaderboard/', TicTacToeLeaderBoardView.as_view(), name='tic_tac_toe_leaderboard'),
    path('stats/<int:user_id>/', UserAchievementStatsView.as_view(), name='user_stats'),
    path('game-stats/<int:user_id>/', UserGameStatsView.as_view(), name='game_stats'),  # Changed to user_id for consistency
    path('last-game/<int:user_id>/', LastGamesView.as_view(), name='last_game'),  # Changed to user_id for consistency
    path('games-per-day/<int:user_id>/', GamesPerDayView.as_view(), name='games_per_day'),  # Corrected typo and changed to user_id
]