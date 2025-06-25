"use client";
import React, { useState, useEffect } from "react";
import style from "@styles/local_game.module.css";
import PreGame from "@components/PreGame";
import PongGame from "@components/PongGame";
import { Button } from "@/components/ui/button";
import Image from "next/image";
// import winner_png from '@assets/icons/winner.png'
import Lottie from "lottie-react";
import winner_animation from "@/assets/lottie/winner.json";

interface GameData {
  player1: string;
  player2: string;
  color: string;
  winScore: number;
}

const defaultGameData = {
  player1: "",
  player2: "",
  color: "#3b82f6",
  winScore: 3,
};

function Page() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameData, setGameData] = useState<GameData>(defaultGameData);
  const [winner, setWinner] = useState("");

  const handleGameStart = (data: GameData) => {
    setGameData(data);
    setGameStarted(true);
    setWinner("");
  };

  const handleMatchEnd = (winner: string) => {
    setWinner(winner);
    setGameStarted(false);
  };

  const handleReturnHome = () => {
    setWinner("");
    setGameData(defaultGameData);
    setGameStarted(false);
  };

  return (
    <div className={style.container}>
      {!gameStarted && !winner && <PreGame onGameStart={handleGameStart} />}
      {gameStarted && (
        <PongGame
          color_theme={gameData.color}
          player1={gameData.player1}
          player2={gameData.player2}
          winScore={gameData.winScore}
          onReturnToMenu={() => setGameStarted(false)}
          onGameEnd={handleMatchEnd}
        />
      )}
      {!gameStarted && winner && (
        <div className={style.winner_div}>
          <h2 className={style.winner_name}>{winner} Wins</h2>
          <Lottie animationData={winner_animation} loop autoplay style={{height: 400, width:400}}/>
          <Button onClick={handleReturnHome} className={style.winner_button}>
            Return Home
          </Button>
        </div>
      )}
    </div>
  );
}

export default Page;