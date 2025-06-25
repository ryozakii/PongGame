"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import style from "@styles/pre_game.module.css";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { colors } from "@/type/game.types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface PreGameProps {
  onGameStart: (data: {
    player1: string;
    player2: string;
    color: string;
    winScore: number;
  }) => void;
}

function PreGame({ onGameStart }: PreGameProps) {
  const [color, setColor] = useState<number>(0);
  const [player1, setPlayer1] = useState("Player1");
  const [player2, setPlayer2] = useState("Player2");
  const [winScore, setWinScore] = useState(3);

  const getNextIndex = (currentIndex: number): number =>
    (currentIndex + 1) % colors.length;
  const getPreviousIndex = (currentIndex: number): number =>
    (currentIndex - 1 + colors.length) % colors.length;
  const { toast } = useToast();
  const handleWinScoreChange = (value: string) => {
    const scoreMap: { [key: string]: number } = {
      "option-one": 3,
      "option-two": 7,
      "option-three": 11,
    };
    setWinScore(scoreMap[value]);
  };
  const handleStartGame = () => {
    if (!checkPlayerNames()) return;
    onGameStart({
      player1,
      player2,
      color: colors[color],
      winScore,
    });
  };

  const checkPlayerNames = () => {
    const validNameRegex = /^[a-zA-Z0-9_]+$/;
    if (player1.trim().toLowerCase() === player2.trim().toLowerCase()) {
      toast({
        variant: "destructive",
        title: "Duplicate Player Names",
        description: "Please enter different names for Players",
      });
      return false;
    }
    if (player1.trim().toLowerCase() === "\\bot") {
      toast({
        variant: "destructive",
        title: "Invalid Player Name",
        description: "Player 1 name cannot be \\Bot",
      });
      return false;
    }
    if (player1.trim() === "" || player2.trim() === "") {
      toast({
        variant: "destructive",
        title: "Empty Player Name",
        description: "Player names cannot be empty",
      });
      return false;
    }
    if (player1.trim().length > 8 || player2.trim().length > 8) {
      toast({
        variant: "destructive",
        title: "Player Name Too Long",
        description: "Player names should be less than 10 characters",
      });
      return false;
    }
    if ( !validNameRegex.test(player1.trim()) || (!validNameRegex.test(player2.trim()) && player2.trim().toLowerCase() !== "\\bot")) {
      toast({
        variant: "destructive",
        title: "Invalid Player Name",
        description: "Player names can only contain letters, numbers, and underscores",
      });
      return false;
    }
    return true;
  };
  return (
    <div className={style.container}>
      <div className={style.main}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setColor(getPreviousIndex(color))}
          aria-label="Previous theme"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className={style.card}>
          <div className={style.players}>
            <Input
              className={style.player}
              type="text"
              placeholder="Player1"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              />

            <p className={style.vs}>VS</p>
            <Popover>
              <PopoverTrigger>
                <Input
                  className={style.player}
                  type="text"
                  placeholder="Player2"
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                />
              </PopoverTrigger>
              <PopoverContent className={style.hint}
              onClick={() => setPlayer2("\\Bot")}>
                Type "\Bot" to plat with AI
              </PopoverContent>
            </Popover>
          </div>
          <div className={style.content}>
            <div
              className={style.stadium}
              onClick={() => setColor(getNextIndex(color))}
            >
              <div
                className={`${style.paddle} ${style.left_paddle}`}
                style={{ backgroundColor: colors[color] }}
              ></div>
              <div
                className={style.ball}
                style={{ backgroundColor: colors[color] }}
              ></div>
              <div
                className={`${style.paddle} ${style.right_paddle}`}
                style={{ backgroundColor: colors[color] }}
              ></div>
            </div>
          </div>
          <div className={style.winingmethod}>
            <Label htmlFor="wining_method">Winning Score</Label>
            <RadioGroup
              id="wining_method"
              className={style.radiogroup}
              defaultValue="option-one"
              onValueChange={handleWinScoreChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-one" id="option-one" />
                <Label htmlFor="option-one">First to 3</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-two" id="option-two" />
                <Label htmlFor="option-two">First to 7</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-three" id="option-three" />
                <Label htmlFor="option-three">First to 11</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setColor(getNextIndex(color))}
          aria-label="Next theme"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className={style.startgame}>
        <Button variant="link" onClick={handleStartGame}>
          Play
        </Button>
      </div>
    </div>
  );
}

export default PreGame;
