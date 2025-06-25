from collections import defaultdict
from rest_framework import serializers
from acounts.models import UserAccount
from .models import GameStats, Achievement


class GameStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameStats
        fields = ['level', 'progress', 'wins', 'losses', 'draws', 'total_games', 'xp', 'win_rate']


class MultiAchievementJSONSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'title', 'description', 'created_at']

    def to_representation(self, instance):
        """
        Customize the JSON output format for a single achievement.
        """
        representation = super().to_representation(instance)

        # Format the created_at timestamp
        if representation.get('created_at'):
            representation['created_at'] = instance.created_at.strftime('%Y-%m-%d %H:%M:%S')

        # Parse the achievement category and level from the title
        title_parts = representation['title'].split()
        if len(title_parts) >= 2 and title_parts[-1].isdigit():
            representation['category'] = ' '.join(title_parts[:-1])
            representation['level'] = int(title_parts[-1])
        else:
            representation['category'] = representation['title']
            representation['level'] = None

        return {
            'id': representation['id'],
            'title': representation['title'],
            'description': representation['description'],
            'metadata': {
                'category': representation['category'],
                'level': representation['level'],
                'created_at': representation['created_at']
            }
        }

    @classmethod
    def format_achievement_list(cls, achievements, user_achievements=None):
        """
        Format a list of achievements, optionally marking which ones are unlocked.

        Args:
            achievements: QuerySet or list of Achievement objects
            user_achievements: Optional QuerySet of achievements unlocked by the user
        """
        serializer = cls(achievements, many=True)
        achievements_data = serializer.data

        # Group achievements by category
        categorized = defaultdict(list)

        for achievement in achievements_data:
            category = achievement['metadata']['category']

            # Add unlocked status if user_achievements is provided
            if user_achievements is not None:
                achievement['unlocked'] = any(
                    ua.id == achievement['id'] for ua in user_achievements
                )

            categorized[category].append(achievement)

        # Sort achievements within each category by level
        for category in categorized:
            categorized[category].sort(key=lambda x: (x['metadata']['level'] or 0))

        # Convert defaultdict to regular dict and add metadata
        result = {
            'achievements': {
                'total_count': len(achievements_data),
                'unlocked_count': len(user_achievements) if user_achievements is not None else None,
                'categories': dict(categorized)
            }
        }

        return result