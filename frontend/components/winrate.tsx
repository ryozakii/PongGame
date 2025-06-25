"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Label, Tooltip } from "recharts"; 
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useEffect, useState } from "react";

const COLORS = {
  loss: "#E11D48",
  draw: "#A0A0A0",
  win: "#10B981",
};
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Component({ user, isLoading, error, progress }) {
  const [winRate, setWinRate] = useState(0.0);
  const [chartData, setChartData] = useState([
    { name: "Win", value: 0 },
    { name: "Loss", value: 0 },
    { name: "Draw", value: 0 },
  ]);
  const [totalGames, setTotalGames] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsDataLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/game-stats/${user.id}/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch game stats");

        const data = await response.json();
        const { wins, losses, draws, total_games, win_rate } = data;

        setChartData([
          { name: "Win", value: wins },
          { name: "Loss", value: losses },
          { name: "Draw", value: draws },
        ]);
        setWinRate(win_rate);
        setTotalGames(total_games);
      } catch (error) {
        console.error("Error fetching game stats:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  if (isLoading || isDataLoading) {
    return (
      <Card className="w-full transition-all duration-300 ease-in-out hover:shadow-lg">
        <CardHeader className="p-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Skeleton className="h-64 w-64 rounded-full" />
        </CardContent>
        <CardFooter className="p-6">
          <Skeleton className="h-4 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full transition-all duration-300 ease-in-out ">
      <CardHeader className="p-6">
        <CardTitle className="text-2xl font-bold">Performance Ratio</CardTitle>
        <CardDescription>Total Games Played</CardDescription>
      </CardHeader>

      {totalGames === 0 ? (
        <CardContent className="p-6">
          <Alert variant="default" className="bg-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No games played</AlertTitle>
            <AlertDescription>
              Start playing to see your performance statistics here
            </AlertDescription>
          </Alert>
        </CardContent>
      ) : (
        <>
          <CardContent className="flex items-center justify-center p-6">
            <PieChart width={280} height={280}>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg bg-background p-2 shadow-lg ring-1 ring-border">
                        <p className="font-medium">{`${payload[0].name}: ${payload[0].value} games`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name.toLowerCase()]}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    const { cx, cy }:any = viewBox;
                    return (
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground"
                      >
                        <tspan
                          x={cx}
                          y={cy - 10}
                          className="text-3xl font-bold"
                        >
                          {totalGames}
                        </tspan>
                        <tspan
                          x={cx}
                          y={cy + 15}
                          className="fill-muted-foreground text-sm"
                        >
                          Total Games
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </CardContent>

          <CardFooter className="flex-col gap-2 p-6">
            <div className="flex items-center gap-2 font-medium">
              Win Rate: {winRate}%
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              Based on your total games played
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
