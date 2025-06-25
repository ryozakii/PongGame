"use client"
import React, { useState, useEffect } from 'react';
import PhotoGallery from '@/components/photpro';
import PerformanceStats from '@/components/winrate';
import TrendChart from '@/components/linearcurve';
import AchievementsList from '@/components/achievement';
import RecentGames from '@/components/lastgames';
import TopPlayers from '@/components/topthereplayer';
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from '@hooks/useContext';

interface DashboardProps {
  user: any;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(50);
  const userGlobal = useUser();
  
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUser(data);
        setIsLoading(false);
        userGlobal.IsUpdated = !userGlobal.IsUpdated;
      } catch (error: any) {
        console.error('Error fetching user:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [userGlobal]);

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <div className="space-y-6">
          {/* Stats Cards Loading State */}
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
          {/* Chart Loading State */}
          <Skeleton className="h-[300px] w-full rounded-xl" />
          {/* Bottom Grid Loading State */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="flex">
          <PhotoGallery user={user} isLoading={isLoading} error={error} progressr={progress} userId={null} Me={true}/>
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
    </div>
  );
}