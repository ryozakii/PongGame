import React, { useState, useEffect, use } from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserPlus, UserMinus, UserX2, Shield, Clock, Ban } from "lucide-react";
import Image from 'next/image';

interface ProfileCardProps {
  user: any;
  isLoading: boolean;
  error: string | null;
  progressr: number;
  userId: string | null;
  Me: boolean;
}

export default function ProfileCard({ user, isLoading, error, progressr, Me, userId }: ProfileCardProps) {
  const [friendStatus, setFriendStatus] = useState<'none' | 'PENDING' | 'ACCEPTED' | 'BLOCKED'>('none');
  const [isUser1, setIsUser1] = useState(false);
  const [isUser2, setIsUser2] = useState(false);
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [online, setOnline] = useState(false);
  const [Error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number>(Date.now());
  const [bylock, setBylock] = useState(0);


  useEffect(() => {
    const fetchStatusFriend = async () => {
      setError("");
      if (Me) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/friend-status/${user.id}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
  
        const data = await response.json();
        if (!response.ok) {
          if (data.status === 'BLOCKED' && !data.byblock) {
            window.location.href = '/Dashboard';
            return;
          }
          setError(data.error || 'Failed to fetch friend status');
          toast.error(data.error || 'Failed to fetch friend status');
          return;
        }
  
        if (data.status === 'BLOCKED' && !data.byblock) {
          window.location.href = '/Dashboard';
          return;
        }

        setFriendStatus(data.status);
        setIsUser1(data.is_user1);
        setIsUser2(data.is_user2);
        setFriendshipId(data.friendship_id);
        setBylock(data.byblock || 0);
      } catch (error) {
        setError('An error occurred. Please try again.');
        toast.error('Failed to fetch friend status');
      }
    };

    fetchStatusFriend();
  }, [user.id, Me, status]);
  useEffect(() => {
    const fetchOnlineStatus = async () => {
      setError("");
      if (Me) return;
      console.log("fetching online status");
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notification/${user.id}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
  
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Failed to fetch online status');
          toast.error(data.error || 'Failed to fetch online status');
          return;
        }
  
        setOnline(data.status);
        setStatus((prev) => Date.now());
      } catch (error) {
        setError('An error occurred. Please try again.');
        toast.error('Failed to fetch online status');
      }
    }
    const interval = setInterval(() => {
      fetchOnlineStatus();
    }, 3000);
    fetchOnlineStatus();
    return () => clearInterval(interval);
  }, []);
  const acceptFriendRequest = async () => {
    if (Me || !friendshipId) return;
    setError("");
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accept-friend-request/${friendshipId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to accept friend request');
        toast.error(data.error || 'Failed to accept friend request');
        return;
      }
  
      setFriendStatus('ACCEPTED');
      toast.success("Friend request accepted!");
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error("Failed to accept friend request");
    }
  };
  
  const sendFriendRequest = async (userId: number) => {
    if (Me) return;
    setError("");
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/send-friend-request/${userId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to send friend request');
        toast.error(data.error || 'Failed to send friend request');
        return;
      }
      console.log(data);
  
      setFriendStatus(data.status);

      toast.success(`Friend request sent to ${user.username}`);
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error('Failed to send friend request');
    }
  };
  
  const blockUser = async (userId) => {
    if (Me) return;
    setError("");
    setBylock(0);
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/block-user/${userId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      const data = await response.json();
      
      if (response.status === 403) {
        // We've been blocked by the other user
        toast.error("You have been blocked by this user");
        window.location.href = '/Dashboard';
        return;
      }
  
      if (!response.ok) {
        setError(data.error || 'Failed to block user');
        toast.error(data.error || 'Failed to block user');
        return;
      }
  
      setFriendStatus(data.status);
      setBylock(data.byblock);
      toast.success(`${user.username} has been blocked`);
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error('Failed to block user');
    }
  };
  
  const removeFriend = async (userId: number) => {
    if (Me) return;
    setError("");
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/remove-friend/${userId}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to remove friend');
        toast.error(data.error || 'Failed to remove friend');
        return;
      }
  
      setFriendStatus(data.status);
      setIsUser1(data.is_user1);
      setIsUser2(data.is_user2);
      toast.success(`You are no longer friends with ${user.username}`);
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error('Failed to remove friend');
    }
  };
  
  const cancelFriendRequest = async (userId: number) => {
    if (Me) return;
    setError("");
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cancel-friend-request/${userId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to cancel friend request');
        toast.error(data.error || 'Failed to cancel friend request');
        return;
      }
  
      setFriendStatus(data.status);
      setIsUser1(data.is_user1);
      setIsUser2(data.is_user2);
      toast.success("Friend request cancelled");
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error("Failed to cancel friend request");
    }
  };
  
  const cancelFriendRequest2 = async (userId: number) => {
    if (Me) return;
    setError("");
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cancel-friend-request/user2/${userId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to cancel friend request');
        toast.error(data.error || 'Failed to cancel friend request');
        return;
      }
  
      setFriendStatus(data.status);
      setIsUser1(data.is_user1);
      setIsUser2(data.is_user2);
      toast.success("Friend request cancelled");
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error("Failed to cancel friend request");
    }
  };
  
  const unblockUser = async (userId: number) => {
    if (Me) return;
    setError("");
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/unblock-user/${userId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to unblock user');
        toast.error(data.error || 'Failed to unblock user');
        return;
      }
  
      setFriendStatus(data.status);
      setIsUser1(data.is_user1);
      setIsUser2(data.is_user2);
      toast.success("User unblocked successfully");
    } catch (error) {
      setError('An error occurred. Please try again.');
      toast.error("Failed to unblock user");
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full transition-all duration-300 ease-in-out hover:shadow-lg">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card">
      <CardHeader className="relative p-6 pb-0">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar with Online Status */}
          <div className="relative">
            <div className="p-1 rounded-full border-2 border-primary">
              <Avatar className="w-32 h-32">
                {user?.image ? (
                  <AvatarImage
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${user.image}`}
                    alt={user.username}
                  />
                ) : (
                  <AvatarFallback className="text-4xl bg-muted">
                    {user?.username[0]?.toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            {<span className={`absolute bottom-2 right-2 w-4 h-4 ${(online || Me) ? 'bg-emerald-500' : 'bg-red-500'} rounded-full ring-2 ring-white`} />}
          </div>
          
          {/* User Info */}
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <h2 className="text-3xl font-bold tracking-tight">{user?.username}</h2>
            <p className="text-muted-foreground">
              Level {user?.gamestats?.level || 0}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <Progress
            value={user?.gamestats?.progress || 0}
            max={100}
            className="h-2 transition-all"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Level {user?.gamestats?.level || 0}</span>
            <span>{user?.gamestats?.progress || 0}% Complete</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{user?.gamestats?.total_games || 0}</p>
            <p className="text-sm text-muted-foreground">Total Games</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold">{user?.gamestats?.win_rate || 0}%</p>
            <p className="text-sm text-muted-foreground">Win Rate</p>
          </div>
        </div>

        {/* Friend Actions */}
        {!Me && (
          <div className="flex flex-wrap gap-2 justify-end">
            {friendStatus === 'ACCEPTED' && (
              <Button 
                variant="outline" 
                onClick={() => removeFriend(user.id)}
                className="flex gap-2"
              >
                <UserMinus className="h-4 w-4" />
                Remove Friend
              </Button>
            )}

            {friendStatus === 'PENDING' && (
              <>
                {isUser2 && (
                  <Button 
                    variant="outline" 
                    onClick={acceptFriendRequest}
                    className="flex gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Accept Request
                  </Button>
                )}
                {isUser1 && (
                  <Button 
                    variant="outline" 
                    className="flex gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Pending
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => {isUser1 ? cancelFriendRequest(user.id) : cancelFriendRequest2(user.id)}}
                  className="flex gap-2 text-destructive"
                >
                  <UserX2 className="h-4 w-4" />
                  {isUser1 ? 'Cancel Request' : 'Decline Request'}
                </Button>
              </>
            )}

            {friendStatus === 'none' && (
              <Button 
                variant="outline" 
                onClick={() => sendFriendRequest(user.id)}
                className="flex gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Friend
              </Button>
            )}

            {friendStatus !== 'BLOCKED' && (

              <Button 
                variant="outline" 
                onClick={() => blockUser(user.id)}
                className="flex gap-2 text-destructive"
              >
                <Ban className="h-4 w-4" />
                Block User
              </Button>
            )}
          </div>
        )}
        {Error && (
          <div className="flex justify-center items-center h-full">
            <div className="text-red-500 text-sm p-2 rounded bg-red-50">
              {Error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



