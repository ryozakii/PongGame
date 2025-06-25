from django.urls import path
from .views import (
    SendFriendRequestView,
    AcceptFriendRequestView,
    CancelFriendRequestView,
    RemoveFriendView,
    ListFriendsView,
    ListPendingRequestsView,
    ListBlockingRequestsView,
    CancelFriendRequestByUser2View,
    FriendStatusView,
    FriendProfileView,
    BlockUserView,
    UnblockUserView,
)

urlpatterns = [
    # Friend profile
    path('profile/<int:friend_id>/', FriendProfileView.as_view(), name='friend_profile'),

    # Friend requests
    path('send-friend-request/<int:friend_id>/', SendFriendRequestView.as_view(), name='send_friend_request'),
    path('accept-friend-request/<int:friendship_id>/', AcceptFriendRequestView.as_view(), name='accept_friend_request'),
    path('cancel-friend-request/<int:user_id>/', CancelFriendRequestView.as_view(), name='cancel_friend_request'),
    path('cancel-friend-request/user2/<int:user_id>/', CancelFriendRequestByUser2View.as_view(), name='cancel_friend_request_user2'),

    # Friends list and management
    path('friends/', ListFriendsView.as_view(), name='list_friends'),
    path('remove-friend/<int:user_id>/', RemoveFriendView.as_view(), name='remove_friend'),

    # Pending requests
    path('pending-requests/', ListPendingRequestsView.as_view(), name='list_pending_requests'),

    # Blocking and unblocking
    path('block-user/<int:user_id>/', BlockUserView.as_view(), name='block_user'),
    path('unblock-user/<int:user_id>/', UnblockUserView.as_view(), name='unblock_user'),
    path('blocked-users/', ListBlockingRequestsView.as_view(), name='list_blocked_users'),

    # Friend status
    path('friend-status/<int:friend_id>/', FriendStatusView.as_view(), name='friend_status'),
]