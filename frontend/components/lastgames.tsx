'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Player {
  id: number;
  username: string;
  image: string;
}

interface Game {
  id: number;
  title: string;
  date: string;
  score: string;
  res: string;
  player1: Player;
  player2: Player;
}

interface GetUserProps {
  user: any;
}

export default function LastGames({ user }: GetUserProps) {
  const [lastGames, setLastGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/last-game/${user.id}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch games: ${response.status}`);
        }

        const data = await response.json() as Game[];

        setLastGames(data);

      } catch (err: any) {
        console.error('Error fetching games:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // if (error) {
  //   return (
  //     <Alert variant="default">
  //       <AlertCircle className="h-4 w-4" />
  //       <AlertTitle>Error</AlertTitle>
  //       <AlertDescription>{error}</AlertDescription>
  //     </Alert>
  //   );
  // }

  return (
    <Card className="w-full w-[600px] h-[500px] transition-all ">
      <CardHeader>
        <CardTitle className="text-4xl font-bold">Last Games</CardTitle>
      </CardHeader>
      <CardContent>
        {lastGames.length === 0 ? (
          <Alert variant="default" className="bg-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No games played</AlertTitle>
            <AlertDescription>
              There are no games played yet. Start a game to see it here!
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {lastGames.map((game) => (
                <Card key={game.id} className="h-31.5 rounded-xl overflow-hidden">
                  <CardContent className="p-3 h-full flex flex-col justify-center space-y-4">
                    {/* Top Section */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">{game.title}</h3>
                        <p className="text-xs text-muted-foreground">{game.date}</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-md ${
                          game.res === "Win" ? "bg-[#10B981]" : game.res === "Loss" ? "bg-[#E11D48]" : "bg-[#A0A0A0]"
                        }`}
                      >
                        <span className="text-lg font-bold text-white">{game.score}</span>
                      </div>
                    </div>
                    
                    {/* Player Section */}
                    <div className="flex items-center justify-around space-x-5">
                      {/* Player 1 */}
                      <div >

                      <Avatar className="h-14 w-14">
                        <AvatarImage src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${game.player1.image}`} alt={game.player1.username} />
                        <AvatarFallback>{game.player1.username[0]}</AvatarFallback>
                      </Avatar>
                      <h2 className="flex justify-center items-center">{game.player1.username}</h2>
                      </div>
                      
                      <span className="text-bg text-4xl font-bold ">vs</span>
                      
                      {/* Player 2 */}
                      <div >

                      <Avatar className="h-14 w-14">
                        <AvatarImage src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${game.player2.image}`} alt={game.player2.username} />
                        <AvatarFallback>{game.player2.username[0]}</AvatarFallback>
                      </Avatar>
                      <h2 className="flex justify-center items-center">{game.player2.username}</h2>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
