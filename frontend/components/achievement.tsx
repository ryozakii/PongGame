import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Trophy } from "lucide-react";


interface Achievement {
  id: number;
  title: string;
  description: string;
  unlocked_date: string;
}

export default function Achievement(user) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stats/${user.user.id}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch achievements");
        const data = await response.json() as Achievement[];
      
        setAchievements(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching achievements:", error);
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  return (
    <Card className="w-full md:w-[600px] min-h-[500px] transition-all">
      <CardHeader>
        <CardTitle className="text-4xl font-bold">Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : achievements.length === 0 ? (
          <Alert className="bg-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No achievements unlocked</AlertTitle>
            <AlertDescription>
              Start playing to unlock achievements and see them here!
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {achievements.map((achievement) => {
                const Icon = Trophy;
                return (
                  <Card key={achievement.id} className="h-31.5 rounded-xl overflow-hidden">
                    <CardContent className="p-3 h-full flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-col">
                        <h3 className="text-lg font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlocked: {achievement.unlocked_date}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}