"use client";


import React, { useState, useEffect, use, Suspense } from 'react';
import PhotoGallery from '@/components/photpro';
import PerformanceStats from '@/components/winrate';
import TrendChart from '@/components/linearcurve';
import AchievementsList from '@/components/achievement';
import RecentGames from '@/components/lastgames';
import TopPlayers from '@/components/topthereplayer';
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { number } from 'zod';



interface FirstCardProps {
  user: any;
  isLoading: boolean;
  error: string | null;
  progress: number;
}



export default function Profile() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId'); 
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(50);
  const [CurrentUser, setCurrentUser] = useState(number);
  const router = useRouter();

  useEffect(() => {
    const currentUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/current-user/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
  
        if (!response.ok) {
          throw new Error(`Failed to fetch current user: ${response.status}`);
        }
  
        const data = await response.json();
        setCurrentUser(data.id);

      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    currentUser();
  }, []);
  
  
  if (CurrentUser?.toString() === userId) 
    window.location.href = '/Dashboard';
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/${userId}/`, 
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );

        if (response.status === 403) {
          window.location.href = '/Dashboard';
          return;
        }

        if (!response.ok) {
          throw new Error(`Profile load failed: ${response.status}`);
        }

        const data = await response.json();
        setUser(data);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Profile fetch error:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    if (userId) fetchUser();
}, [userId]);


  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (!user) {
    return <div>No user found</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="flex">
          <PhotoGallery user={user} isLoading={isLoading} error={error} progressr={progress} Me={false} userId={CurrentUser?.toString()}/>
        </div>
        <div className="flex">
          <PerformanceStats user={user} isLoading={isLoading} error={error} progress={progress}/>
        </div>
        <div className="flex">
          <TrendChart user={user}/>
        </div>
        <div className="flex">
          <AchievementsList user={user}/>
        </div>
        <div className="flex">
          <RecentGames user={user}/>
        </div>
        <div className="flex">
          <TopPlayers />
        </div>
      </div>
  </Suspense>
  );
}