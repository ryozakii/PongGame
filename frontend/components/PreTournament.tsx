"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import styles from "@/styles/pre_game.module.css";
import { PlayersState, PreTournamentProps } from "@/type/type";
import { useToast } from "@/hooks/use-toast"
import {colors} from "@/type/game.types";

const PreTournament: React.FC<PreTournamentProps> = ({ onGameStart }) => {
  const [colorIndex, setColorIndex] = useState<number>(0);
  const [players, setPlayers] = useState<PlayersState>({
    player1: "",
    player2: "",
    player3: "",
    player4: "",
  });
  const [winScore, setWinScore] = useState<number>(3);
  const { toast } = useToast()

  const handleWinScoreChange = (value: string): void => {
    const scoreMap: Record<string, number> = {
      'option-one': 3,
      'option-two': 5,
      'option-three': 7
    };
    setWinScore(scoreMap[value]);
  };

  const handlePlayerChange = (playerKey: keyof PlayersState, value: string): void => {
    setPlayers(prev => ({
      ...prev,
      [playerKey]: value
    }));
  };

  const checkForDuplicateNames = (): string[] => {
    const playerNames = Object.values(players);
    const trimmedNames = playerNames.map(name => name.trim().toLowerCase());
    const uniqueNames = new Set(trimmedNames);
    
    // If there are duplicates, uniqueNames.size will be less than playerNames.length
    if (uniqueNames.size !== playerNames.length) {
      // Find the duplicate names
      const duplicates: string[] = [];
      const seen = new Set<string>();
      
      trimmedNames.forEach((name, index) => {
        if (seen.has(name)) {
          duplicates.push(playerNames[index]);
        } else {
          seen.add(name);
        }
      });
      
      return duplicates;
    }
    
    return [];
  };

  const handleStartTournament = (): void => {
    if (Object.values(players).some(name => !name.trim())) {
      toast({
        variant: "destructive",
        title: "Missing Player Names",
        description: "Please enter an alias for all players",
      });
      return;
    }

    const longNames = Object.values(players).filter(name => name.trim().length > 8);
    if (longNames.length > 0) {
      toast({
        variant: "destructive",
        title: "Names Too Long",
        description: `Player names must be 8 characters or less. Please shorten: ${longNames.join(', ')}`,
      });
      return;
    }

    const duplicateNames = checkForDuplicateNames();
    if (duplicateNames.length > 0) {
      toast({
        variant: "destructive",
        title: "Duplicate Player Names",
        description: `The following names are used multiple times: ${duplicateNames.join(', ')}. Please ensure all player names are unique.`,
      });
      return;
    }

    onGameStart({
      players: [players.player1, players.player2, players.player3, players.player4],
      color: colors[colorIndex],
      winScore
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.card}>
          <div className={styles.players}>
            {(['player1', 'player2'] as const).map((playerKey) => (
              <Input
                key={playerKey}
                className={styles.player}
                type="text"
                placeholder={`Player ${playerKey.slice(-1)}`}
                value={players[playerKey]}
                onChange={(e) => handlePlayerChange(playerKey, e.target.value)}
              />
            ))}
          </div>
          <div className={styles.players}>
            {(['player3', 'player4'] as const).map((playerKey) => (
              <Input
                key={playerKey}
                className={styles.player}
                type="text"
                placeholder={`Player ${playerKey.slice(-1)}`}
                value={players[playerKey]}
                onChange={(e) => handlePlayerChange(playerKey, e.target.value)}
              />
            ))}
          </div>
          <div className={styles.content}>
            <div
              className={styles.stadium}
              onClick={() => setColorIndex((prev) => (prev + 1) % colors.length)}
            >
              <div
                className={`${styles.paddle} ${styles.left_paddle}`}
                style={{ backgroundColor: colors[colorIndex] }}
              />
              <div
                className={styles.ball}
                style={{ backgroundColor: colors[colorIndex] }}
              />
              <div
                className={`${styles.paddle} ${styles.right_paddle}`}
                style={{ backgroundColor: colors[colorIndex] }}
              />
            </div>
          </div>
          <div className={styles.winingmethod}>
            <Label htmlFor="wining_method">Winning Score</Label>
            <RadioGroup
              id="wining_method"
              className={styles.radiogroup}
              defaultValue="option-one"
              onValueChange={handleWinScoreChange}
            >
              {[
                { value: 'option-one', label: 'First to 3' },
                { value: 'option-two', label: 'First to 5' },
                { value: 'option-three', label: 'First to 7' }
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={value} />
                  <Label htmlFor={value}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>
      <div className={styles.startgame}>
        <Button variant="link" onClick={handleStartTournament}>
          Start Tournament
        </Button>
      </div>
    </div>
  );
};

export default PreTournament;