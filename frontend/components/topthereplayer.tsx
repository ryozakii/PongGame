import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Trophy, AlertCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function GameDashboard() {
  const [pingPongPlayers, setPingPongPlayers] = useState([]);
  const [ticTacToePlayers, setTicTacToePlayers] = useState([]);

  useEffect(() => {
    const fetchPingPongPlayers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ping-pong-leaderboard/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch ping pong leaderboard");
        const data = await response.json();
        // console.log("PingPongPlayers:", data);
        setPingPongPlayers(data);
      } catch (error) {
        console.error("Error fetching ping pong leaderboard:", error);
      }
    };

    fetchPingPongPlayers();  // Call the function
  }, []);

  useEffect(() => {
    const fetchTicTacToePlayers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tic-tac-toe-leaderboard/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch tic tac toe leaderboard");
        const data = await response.json();
        // console.log("TicTacToePlayers:", data);
        setTicTacToePlayers(data);
      } catch (error) {
        console.error("Error fetching tic tac toe leaderboard:", error);
      }
    };

    fetchTicTacToePlayers();  // Call the function
  }, []);

  return (
    <Card className="w-full md:w-[600px] min-h-[500px] transition-all">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Top Players Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="PingPong" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="PingPong">PingPong Top 3</TabsTrigger>
            <TabsTrigger value="TicTacToe">TicTacToe Top 3</TabsTrigger>
          </TabsList>
          <TabsContent value="PingPong">
            <LeaderBoard title="PingPong Leaderboard" players={pingPongPlayers} />
          </TabsContent>
          <TabsContent value="TicTacToe">
            <LeaderBoard title="TicTacToe Leaderboard" players={ticTacToePlayers} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function LeaderBoard({ title, players }) {
  if (!players || players.length === 0) {
    return (
      <div className="space-y-4 ">
        <h3 className="text-xl font-semibold text-center">{title}</h3>
        <Alert className="bg-muted">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle >No data available</AlertTitle>
          <AlertDescription>
            {title.includes("PingPong") 
              ? "No PingPong games have been played yet." 
              : "No TicTacToe games have been played yet."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center">{title}</h3>
      <div className="grid gap-4">
        {players.map((player) => (
          <Card key={player.rank} className="overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  {player.rank === 1 ? <Trophy className="h-5 w-5" /> : player.rank}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${player.image}`} alt={player.username} />
                  <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{player.username}</p>
                  <p className="text-sm text-muted-foreground">Rank #{player.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{player.score}</p>
                <p className="text-sm text-muted-foreground">xp</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}