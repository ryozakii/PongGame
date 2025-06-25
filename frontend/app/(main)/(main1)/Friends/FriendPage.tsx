"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from 'next/link';

interface User {
  id: Number;
  username: string;
  level: number;
  progress: number;
  avatar: string;
  friendship_id: Number;
  status: "ACCEPTED" | "PENDING" | "BLOCKED";
}

export default function FriendManagement() {
  const [activeTab, setActiveTab] = useState<string>("invites");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let endpoint = "";
      if (activeTab === "friends") endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/friends/`;
      if (activeTab === "invites") endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pending-requests/`;
      if (activeTab === "blacklist") endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/blocked-users/`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  return (
    <div className="w-full max-w-[95vw] h-[80vh] bg-background">
      <Card className="w-full h-full">
        <CardContent className="p-8 h-full">
          <Tabs
            defaultValue="invites"
            onValueChange={setActiveTab}
            className="w-full h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="friends">Friends List</TabsTrigger>
              <TabsTrigger value="invites">Invites List</TabsTrigger>
              <TabsTrigger value="blacklist">Black List</TabsTrigger>
            </TabsList>
            <TabsContent value="friends" className="flex-grow mt-0 overflow-hidden">
              <FriendList users={users} isLoading={isLoading} error={error} setUsers={setUsers} />
            </TabsContent>
            <TabsContent value="invites" className="flex-grow mt-0 overflow-hidden">
              <FriendList users={users} isLoading={isLoading} error={error} setUsers={setUsers} />
            </TabsContent>
            <TabsContent value="blacklist" className="flex-grow mt-0 overflow-hidden">
              <FriendList users={users} isLoading={isLoading} error={error} setUsers={setUsers} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function FriendList({ users, isLoading, error, setUsers }: { users: User[]; isLoading: boolean; error: string | null; setUsers: React.Dispatch<React.SetStateAction<User[]>> }) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleApiError = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json();
      return errorData.error || errorData.message || 'Operation failed';
    }
    return null;
  };

  const acceptFriendRequest = async (userId: Number) => {
    try {
      setLocalError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accept-friend-request/${userId}/`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const errorMessage = await handleApiError(response);
      if (!response.ok){
        setLocalError("No pending friend request found from the specified user.");
      }


      setUsers(prevUsers => prevUsers.filter(user => user.friendship_id !== userId));
    } catch (err: any) {
      console.error('Error:', err);
      setLocalError(err.message);
    }
  };

  const cancelFriendRequestByUser2 = async (userId: number) => {
    try {
      setLocalError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cancel-friend-request/user2/${userId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const errorMessage = await handleApiError(response);
      if (!response.ok){
        setLocalError("No pending friend request found from the specified user.");
      }

      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (err: any) {
      console.error('Error:', err);
      setLocalError(err.message);
    }
  };

  const blockUser = async (userId: Number) => {
    try {
      setLocalError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/block-user/${userId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const errorMessage = await handleApiError(response);
      if (!response.ok){
        setLocalError("User not found.");
      }


      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (err: any) {
      console.error('Error:', err);
      setLocalError(err.message);
    }
  };

  const unblockUser = async (userId: Number) => {
    try {
      setLocalError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/unblock-user/${userId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const errorMessage = await handleApiError(response);
      if (!response.ok){
        setLocalError("User not found in the block list.");
      }


      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (err: any) {
      console.error('Error:', err);
      setLocalError(err.message);
    }
  };

  const removeFriend = async (userId: Number) => {
    try {
      setLocalError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/remove-friend/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const errorMessage = await handleApiError(response);

      if (!response.ok){
        console.log(errorMessage.message);
         setLocalError("Friendship not found.");
      }

      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (err: any) {
      console.error('Error:', err);
      setLocalError("Friendship not found.");
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error || localError) return (
    <div className="space-y-2">
      {error && <p className="text-red-500">Error: {error}</p>}
      {localError && <p className="text-red-500">Error: {localError}</p>}
    </div>
  );
  if (users.length === 0) return <p>No users found.</p>;

  return (
    <ScrollArea className="h-[calc(80vh-120px)] pr-4">
      <div className="space-y-4">
        {(error || localError) && (
          <div className="mb-4">
            {error && <p className="text-red-500">{error}</p>}
            {localError && <p className="text-red-500">{localError}</p>}
          </div>
        )}
        {users.map((user) => (
          <div key={String(user.id)} className="flex items-center justify-between py-4 border-b last:border-b-0">
            <div className="flex items-center space-x-8">
              <Link href={{ pathname: '/profile', query: { userId: user.id.toString()}}}>
                <Avatar className="h-14 w-14">
                  <AvatarImage src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${user.avatar}`} alt={user.username} />
                  <AvatarFallback>os</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <h3 className="text-xl font-semibold">{user.username}</h3>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-base text-muted-foreground">lvl {user.level}</span>
                  <Progress value={user.progress} className="w-64 h-2.5" />
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {user.status === "ACCEPTED" && (
                <>
                  <Button variant="outline" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => {removeFriend(user.id)}}>
                    Unfriend
                  </Button>
                  <Button variant="outline" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => {blockUser(user.id)}}>
                    Block
                  </Button>
                </>
              )}
              {user.status === "PENDING" && (
                <>
                  <Button variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => acceptFriendRequest(user.friendship_id)}>
                    Accept
                  </Button>
                  <Button variant="outline" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => cancelFriendRequestByUser2(user.id as number)}>
                    Decline
                  </Button>
                  <Button variant="outline" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => {blockUser(user.id)}}>
                    Block
                  </Button>
                </>
              )}
              {user.status === "BLOCKED" && (
                <Button variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {unblockUser(user.id)}}>
                  Unblock
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}