"use client";
import React, { useState, useEffect } from "react";
import PreTournament from "@components/PreTournament";
import style from "@styles/local_game.module.css";
import Brackets from "@components/Brackets";

interface TournamentState {
  players: string[];
  color: string;
  winScore: number;
}

function Page() {
  const [tournamentStarted, setTournamentStarted] = useState<boolean>(false);
  const [tournamentData, setTournamentData] = useState<TournamentState | null>(null);

  useEffect(() => {
    const savedStarted = localStorage.getItem('tournamentStarted');
    const savedData = localStorage.getItem('tournamentData');
    
    if (savedStarted) {
      setTournamentStarted(JSON.parse(savedStarted));
    }
    if (savedData) {
      setTournamentData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tournamentStarted', JSON.stringify(tournamentStarted));
      localStorage.setItem('tournamentData', JSON.stringify(tournamentData));
    }
  }, [tournamentStarted, tournamentData]);

  const handleTournamentStart = (data: TournamentState) => {
    setTournamentData(data);
    setTournamentStarted(true);
  };

  return (
    <div className={style.container}>
      {!tournamentStarted ? (
        <PreTournament onGameStart={handleTournamentStart} />
      ) : (
        <Brackets 
          players={tournamentData!.players}
          color_theme={tournamentData!.color}
          winScore={tournamentData!.winScore}
        />
      )}
    </div>
  );
}

export default Page;