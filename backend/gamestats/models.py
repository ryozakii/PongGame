from django.db import models
from django.utils import timezone
from django.db.models import Q, Count
from itertools import chain
from datetime import timedelta
from django.apps import apps


class GameStatsManager(models.Manager):
    def create_for_user(self, user):
        stats = self.create(user=user)
        return stats


class Achievement(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    unlocked_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title


class GameStats(models.Model):
    user = models.OneToOneField("acounts.UserAccount", on_delete=models.CASCADE)
    xp = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    total_games = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    progress = models.FloatField(default=0.0)
    win_rate = models.FloatField(default=0.0)
    last_game_id = models.IntegerField(default=0)
    achievements = models.ManyToManyField(Achievement, related_name="users", blank=True)

    objects = GameStatsManager()

    def get_weekly_game_data(self):
        Games = apps.get_model("acounts", "Games")
        today = timezone.now().date()
        last_seven_days = [today - timedelta(days=i) for i in range(7)]

        games_as_player1 = Games.objects.filter(player1=self.user, created_at__date__in=last_seven_days)
        games_as_player2 = Games.objects.filter(player2=self.user, created_at__date__in=last_seven_days)
        all_games = games_as_player1 | games_as_player2

        game_counts = all_games.values('created_at__date').annotate(games_played=Count('id'))

        weekly_data = []
        for i in range(7):
            current_day = today - timedelta(days=i)
            day_name = current_day.strftime('%A')
            games_played = next((entry['games_played'] for entry in game_counts if entry['created_at__date'] == current_day), 0)
            weekly_data.append({
                'day': day_name,
                'gamesPlayed': games_played
            })

        return weekly_data

    @staticmethod
    def calculate_pingpong_score(stats, games):
        pingpong_wins = games.filter(winner=stats.user, pong=True).count()
        total_pingpong_games = games.filter(Q(player1=stats.user) | Q(player2=stats.user), pong=True).count()
        pingpong_win_rate = round((pingpong_wins / total_pingpong_games) * 100) if total_pingpong_games > 0 else 0
        return (pingpong_win_rate * 0.8) + (stats.xp * 0.2)

    @staticmethod
    def calculate_tictactoe_score(stats, games):
        tictactoe_wins = games.filter(winner=stats.user, pong=False).count()
        tictactoe_draws = games.filter(Q(player1=stats.user) | Q(player2=stats.user), winner__isnull=True, pong=False).count()
        total_tictactoe_games = games.filter(Q(player1=stats.user) | Q(player2=stats.user), pong=False).count()

        if total_tictactoe_games > 0:
            adjusted_wins = tictactoe_wins + (tictactoe_draws * 0.5)
            tictactoe_performance = (adjusted_wins / total_tictactoe_games) * 100
        else:
            tictactoe_performance = 0

        return (tictactoe_performance * 0.7) + (stats.xp * 0.3)

    @staticmethod
    def get_rankings(game_type):
        if game_type not in ["PingPong", "TicTacToe"]:
            raise ValueError("Invalid game type")

        Games = apps.get_model("acounts", "Games")
        is_pingpong = game_type == "PingPong"
        relevant_games = Games.objects.filter(pong=is_pingpong)

        player_ids = list(chain(
            relevant_games.values_list('player1_id', flat=True),
            relevant_games.values_list('player2_id', flat=True)
        ))

        game_stats = GameStats.objects.filter(user_id__in=player_ids)

        rankings = []
        for stats in game_stats:
            player_games = relevant_games.filter(Q(player1=stats.user) | Q(player2=stats.user))
            total_score = GameStats.calculate_pingpong_score(stats, player_games) if is_pingpong else GameStats.calculate_tictactoe_score(stats, player_games)
            rankings.append({
                "user": stats.user,
                "total_score": total_score
            })

        rankings.sort(key=lambda x: x["total_score"], reverse=True)
        top_rankings = rankings[:3]

        formatted_rankings = []
        for idx, rank in enumerate(top_rankings, start=1):
            formatted_rankings.append({
                "rank": idx,
                "username": rank["user"].username,
                "score": round(rank["total_score"]),
                "image": rank["user"].image.url if rank["user"].image else None,
            })

        return formatted_rankings

    def get_pingpong_rankings(self):
        return GameStats.get_rankings("PingPong")

    def get_tictactoe_rankings(self):
        return GameStats.get_rankings("TicTacToe")

    def all_last_game(self):
        Games = apps.get_model("acounts", "Games")
        games_as_player1 = Games.objects.filter(player1=self.user).order_by('-created_at')
        games_as_player2 = Games.objects.filter(player2=self.user).order_by('-created_at')
        all_games = (games_as_player1 | games_as_player2).distinct().order_by('-created_at')

        data = []
        for game in all_games:
            opponent = game.player2 if game.player1 == self.user else game.player1
            data.append({
                'id': game.id,
                'title': 'Ping Pong' if game.pong else 'Tic Tac Toe',
                'date': game.created_at.strftime('%Y-%m-%d %H:%M'),
                'score': (
                    game.score if game.pong else (
                        'Win' if game.winner == self.user else (
                            'Loss' if game.winner and game.winner != self.user else (
                                'Draw' if game.winner is None else 'N/A'
                            )
                        )
                    )
                ),
                'res': 'Win' if game.winner == self.user else ('Loss' if game.winner else 'Draw'),
                'player1': {
                    'id': game.player1.id,
                    'username': game.player1.username,
                    'image': game.player1.image.url if game.player1.image else None
                },
                'player2': {
                    'id': game.player2.id,
                    'username': game.player2.username,
                    'image': game.player2.image.url if game.player2.image else None
                },
            })

        return data

    def calculate_status_game(self):
        Games = apps.get_model("acounts", "Games")
        if self.last_game_id != 0:
            games_as_player1 = Games.objects.filter(player1=self.user, id__gt=self.last_game_id)
            games_as_player2 = Games.objects.filter(player2=self.user, id__gt=self.last_game_id)
        else:
            games_as_player1 = Games.objects.filter(player1=self.user)
            games_as_player2 = Games.objects.filter(player2=self.user)

        new_wins = 0
        new_draws = 0
        new_losses = 0

        all_games = games_as_player1 | games_as_player2

        for game in all_games:
            if game.winner == self.user:
                new_wins += 1
            elif game.winner is None:
                new_draws += 1
            else:
                new_losses += 1

        self.wins += new_wins
        self.draws += new_draws
        self.losses += new_losses
        self.total_games += len(all_games)

        self.xp += new_wins * 10
        self.xp += new_draws * 5

        current_level = 1
        xp_threshold = 10
        remaining_xp = self.xp

        if self.total_games > 0:
            self.win_rate = round((self.wins / self.total_games) * 100, 2)
        else:
            self.win_rate = 0.0

        while remaining_xp >= xp_threshold:
            remaining_xp -= xp_threshold
            current_level += 1
            xp_threshold += 5

        self.level = current_level
        self.progress = round((remaining_xp / xp_threshold) * 100)

        if all_games.exists():
            self.last_game_id = all_games.order_by('-id').first().id
        self.user.is_uptodate = True
        self.user.xp = self.xp
        self.user.save()

        self.save()
        return self.check_achievements()

    def check_achievements(self):
        Games = apps.get_model("acounts", "Games")

        tic_tac_toe_wins = Games.objects.filter(
            Q(player1=self.user) | Q(player2=self.user),
            pong=False,
            winner=self.user
        ).count()

        ping_pong_wins = Games.objects.filter(
            Q(player1=self.user) | Q(player2=self.user),
            pong=True,
            winner=self.user
        ).count()

        achievement_categories = {
            'Game Player': {
                'value': self.total_games,
                'milestones': [1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000],
                'description': "Play {} games total"
            },
            'Victory Master': {
                'value': self.wins,
                'milestones': [1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000],
                'description': "Win {} games"
            },
            'Draw Expert': {
                'value': self.draws,
                'milestones': [1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000],
                'description': "Achieve {} draws"
            },
            'Learning Experience': {
                'value': self.losses,
                'milestones': [1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000],
                'description': "Learn from {} losses"
            },
            'Level Up': {
                'value': self.level,
                'milestones': [2, 3, 5, 7, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 3000, 4000, 5000, 7000, 10000],
                'description': "Reach level {}"
            },
            'XP Milestone': {
                'value': self.xp,
                'milestones': [10, 20, 40, 75, 150, 300, 500, 800, 1200, 1800, 500, 3500, 5000, 7000, 10000, 15000, 20000, 30000, 50000, 75000, 100000, 150000, 200000, 300000, 500000, 750000, 1000000],
                'description': "Earn {} XP"
            },
            'Ping Pong Master': {
                'value': ping_pong_wins,
                'milestones': [1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000],
                'description': "Win {} Ping Pong games"
            },
            'Tic Tac Master': {
                'value': tic_tac_toe_wins,
                'milestones': [1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 60, 80, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000],
                'description': "Win {} Tic Tac Toe games"
            },
        }

        new_achievements = []

        for game_type in ["PingPong", "TicTacToe"]:
            rankings = self.get_rankings(game_type)
            for rank in rankings:
                if rank["username"] == self.user.username:
                    title = f"Top 3 {game_type}"
                    achievement, created = Achievement.objects.get_or_create(
                        title=title,
                        defaults={"description": f"Achieve a top 3 rank in {game_type}!"}
                    )
                    if achievement not in self.achievements.all():
                        self.achievements.add(achievement)
                        new_achievements.append({
                            'title': achievement.title,
                            'description': achievement.description,
                            'unlocked_date': achievement.unlocked_date
                        })
                    break


        for category, details in achievement_categories.items():
            value = details['value']
            milestones = details['milestones']

            for milestone in milestones:
                if value >= milestone:
                    title = f"{category} {milestone}"
                    achievement, created = Achievement.objects.get_or_create(
                        title=title,
                        defaults={'description': details['description'].format(milestone)}
                    )
                    if achievement not in self.achievements.all():
                        self.achievements.add(achievement)
                        new_achievements.append({
                            'title': achievement.title,
                            'description': achievement.description,
                            'unlocked_date': achievement.unlocked_date
                        })

        self.save()

        return new_achievements
    def get_achievements(self):
        """
        Retrieve all achievements for the user, sorted by the most recent.
        """
        achievements = self.achievements.all().order_by('-unlocked_date')
        return [
            {
                'id': achievement.id,
                'title': achievement.title,
                'description': achievement.description,
                'unlocked_date': achievement.unlocked_date.strftime('%Y-%m-%d %H:%M:%S')  # Format the date
            }
            for achievement in achievements
        ]