"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, Tooltip } from "recharts"; // Import Tooltip
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,

} from "@/components/ui/chart";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const description = "A bar chart showing games played per day over the last 7 days";

const chartConfig = {
  gamesPlayed: {
    label: "Games Played",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface GetUserProps {
  user: any;
}

function Component({ user }: GetUserProps) {
  const [chartData, setChartData] = useState<{ day: string; gamesPlayed: number }[]>([]);
  let totalGamesbool = false;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/games-per-day/${user.id}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch chart data");
        const data = (await response.json()) as { day: string; gamesPlayed: number }[];

        setChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };
    fetchData();
  }, [user.id]);

  const totalGamesPlayeds = (chartData: { day: string; gamesPlayed: number }[]) => {
    let totalGamesPlayed = 0;
    for (const day of chartData) {
      totalGamesPlayed += day.gamesPlayed;
    }
    totalGamesbool = true;

    return totalGamesPlayed;
  };

  return (
    <div>
      <Card className="w-full w-[600px] h-[500px] transition-all">
        <CardHeader>
          <CardTitle>Games Played Per Day</CardTitle>
          <CardDescription>Last 7 Days</CardDescription>
        </CardHeader>
        {chartData.length === 0 ? (
          <CardContent>
            <Alert variant="default" className="bg-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No games played</AlertTitle>
              <AlertDescription>
                Start playing to see your games played per day
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 20,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                {/* Add Tooltip here */}
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "8px",
                  }}
                  formatter={(value, name) => [`${value} games`, name]} // Customize tooltip content
                />
                <Bar dataKey="gamesPlayed" fill="var(--color-gamesPlayed)" radius={8}>
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        )}
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            Total Games: {!totalGamesbool && totalGamesPlayeds(chartData)}
          </div>
          <div className="leading-none text-muted-foreground">
            Showing games played for each day of the week
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Component;