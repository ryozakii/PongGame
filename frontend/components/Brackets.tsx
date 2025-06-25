"use client";
import React, { useState, useRef, useEffect } from "react";
import PongGame from "@/components/TournamentGame";
import { Button } from "@/components/ui/button";
import style from "@styles/brackets.module.css";
import { BracketsProps, Match, Winners } from "@/type/tournament.types";
import {
  GAME_CONSTANTS as gc,
  BRACKETS_CONSTANTS as bc,
} from "@constants/gameConstants";
import Lottie from "lottie-react";
import winner_animation from "@/assets/lottie/tournament.json";

const Brackets: React.FC<BracketsProps> = ({
  players,
  color_theme,
  winScore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(() => {
    const saved = localStorage.getItem('currentMatch');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [winners, setWinners] = useState<Winners>(() => {
    const saved = localStorage.getItem('tournamentWinners');
    return saved ? JSON.parse(saved) : {
      semifinal1: null,
      semifinal2: null,
      final: null,
    };
  });
  
  const [tournamentStage, setTournamentStage] = useState<"bracket" | "game" | "complete">(() => {
    return localStorage.getItem('tournamentStage') as "bracket" | "game" | "complete" || "bracket";
  });

  useEffect(() => {
    localStorage.setItem('currentMatch', JSON.stringify(currentMatch));
  }, [currentMatch]);

  useEffect(() => {
    localStorage.setItem('tournamentWinners', JSON.stringify(winners));
  }, [winners]);

  useEffect(() => {
    localStorage.setItem('tournamentStage', tournamentStage);
  }, [tournamentStage]);

  const padding = 50;
  const v_space =
    ((canvasRef.current?.height || gc.CANVAS_HEIGHT) -
      4 * bc.RECT_HEIGHT -
      2 * padding) /
    3;
  const h_space =
    ((canvasRef.current?.width || gc.CANVAS_WIDTH) -
      3 * bc.RECT_WIDTH -
      2 * padding) /
    2;
  const semi_final = padding + bc.RECT_WIDTH + h_space;
  const final = padding + 2 * bc.RECT_WIDTH + 2 * h_space;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#000";
    drawRectangle(
      ctx,
      padding,
      padding,
      players[0],
      "semifinal1",
      winners.semifinal1
    );
    drawRectangle(
      ctx,
      padding,
      padding + bc.RECT_HEIGHT + v_space,
      players[1],
      "semifinal1",
      winners.semifinal1
    );
    drawRectangle(
      ctx,
      padding,
      padding + 2 * bc.RECT_HEIGHT + 2 * v_space,
      players[2],
      "semifinal2",
      winners.semifinal2
    );
    drawRectangle(
      ctx,
      padding,
      padding + 3 * bc.RECT_HEIGHT + 3 * v_space,
      players[3],
      "semifinal2",
      winners.semifinal2
    );

    drawRectangle(
      ctx,
      semi_final,
      padding + bc.RECT_HEIGHT + v_space / 2 - bc.RECT_HEIGHT / 2,
      winners.semifinal1 || "...",
      "semifinal1",
      winners.final
    );
    drawRectangle(
      ctx,
      semi_final,
      canvas.height -
        (padding + bc.RECT_HEIGHT + v_space / 2) -
        bc.RECT_HEIGHT / 2,
      winners.semifinal2 || "...",
      "semifinal2",
      winners.final
    );
    drawRectangle(
      ctx,
      final,
      canvas.height / 2 - bc.RECT_HEIGHT / 2,
      winners.final || "...",
      "final",
      winners.final
    );
    ctx.beginPath();
    ctx.moveTo(padding + bc.RECT_WIDTH, padding + bc.RECT_HEIGHT / 2);
    ctx.lineTo(semi_final + bc.RECT_WIDTH / 2, padding + bc.RECT_HEIGHT / 2);
    ctx.lineTo(
      semi_final + bc.RECT_WIDTH / 2,
      padding + bc.RECT_HEIGHT + v_space / 2 - bc.RECT_HEIGHT / 2
    );
    ctx.moveTo(
      semi_final + bc.RECT_WIDTH / 2,
      padding + bc.RECT_HEIGHT + v_space / 2 + bc.RECT_HEIGHT / 2
    );
    ctx.lineTo(
      semi_final + bc.RECT_WIDTH / 2,
      padding + 2 * bc.RECT_HEIGHT + v_space - bc.RECT_HEIGHT / 2
    );
    ctx.lineTo(
      padding + bc.RECT_WIDTH,
      padding + 2 * bc.RECT_HEIGHT + v_space - bc.RECT_HEIGHT / 2
    );
    ctx.stroke();
    ctx.beginPath();
    const dy = 2 * (bc.RECT_HEIGHT + v_space);
    ctx.moveTo(padding + bc.RECT_WIDTH, dy + padding + bc.RECT_HEIGHT / 2);
    ctx.lineTo(
      semi_final + bc.RECT_WIDTH / 2,
      dy + padding + bc.RECT_HEIGHT / 2
    );
    ctx.lineTo(
      semi_final + bc.RECT_WIDTH / 2,
      dy + padding + bc.RECT_HEIGHT + v_space / 2 - bc.RECT_HEIGHT / 2
    );
    ctx.moveTo(
      semi_final + bc.RECT_WIDTH / 2,
      dy + padding + bc.RECT_HEIGHT + v_space / 2 + bc.RECT_HEIGHT / 2
    );
    ctx.lineTo(
      semi_final + bc.RECT_WIDTH / 2,
      dy + padding + 2 * bc.RECT_HEIGHT + v_space - bc.RECT_HEIGHT / 2
    );
    ctx.lineTo(
      padding + bc.RECT_WIDTH,
      dy + padding + 2 * bc.RECT_HEIGHT + v_space - bc.RECT_HEIGHT / 2
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(
      semi_final + bc.RECT_WIDTH,
      padding + bc.RECT_HEIGHT + v_space / 2
    );
    ctx.lineTo(
      final + bc.RECT_WIDTH / 2,
      padding + bc.RECT_HEIGHT + v_space / 2
    );
    ctx.lineTo(
      final + bc.RECT_WIDTH / 2,
      canvas.height / 2 - bc.RECT_HEIGHT / 2
    );
    ctx.moveTo(
      final + bc.RECT_WIDTH / 2,
      canvas.height / 2 + bc.RECT_HEIGHT - bc.RECT_HEIGHT / 2
    );
    ctx.lineTo(
      final + bc.RECT_WIDTH / 2,
      canvas.height - (padding + bc.RECT_HEIGHT + v_space / 2)
    );
    ctx.lineTo(
      semi_final + bc.RECT_WIDTH,
      canvas.height - (padding + bc.RECT_HEIGHT + v_space / 2)
    );
    ctx.stroke();

    if (winners.final) {
      ctx.fillStyle = "rgba(34,197,94,0.2)";
      ctx.fillRect(final + bc.RECT_WIDTH + 50, canvas.height / 2 - 40, 150, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "20px Arial";
      ctx.fillText(
        "Winner:",
        final + bc.RECT_WIDTH + 75,
        canvas.height / 2 - 10
      );
      ctx.fillStyle = "rgb(34,197,94)";
      ctx.fillText(
        winners.final,
        final + bc.RECT_WIDTH + 75,
        canvas.height / 2 + 20
      );
    }
  };

  const drawRectangle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    player: string,
    position: "semifinal1" | "semifinal2" | "final",
    winner: string | null
  ) => {
    ctx.strokeRect(x, y, bc.RECT_WIDTH, bc.RECT_HEIGHT);
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle =
      winner === player ? "rgb(34,197,94)" : winner ? "rgb(239,68,68)" : "#000";
    ctx.fillText(player, x + bc.RECT_WIDTH / 2, y + bc.RECT_HEIGHT / 2);
    if (!winner && isMatchAvailable(position) && player === "...") {
      ctx.fillStyle = color_theme;

      ctx.fillRect(x, y, bc.RECT_WIDTH, bc.RECT_HEIGHT);
      ctx.fillStyle = "#fff";
      ctx.font = "22px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PLAY", x + bc.RECT_WIDTH / 2, y + bc.RECT_HEIGHT / 2);
    }
  };

  const isMatchAvailable = (
    position: "semifinal1" | "semifinal2" | "final"
  ) => {
    if (position === "final") {
      return winners.semifinal1 && winners.semifinal2;
    }
    return true;
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    checkPlayButton(x, y);
  };

  const checkPlayButton = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (
      !winners.semifinal1 &&
      isClickOnPlayButton(
        x,
        y,
        semi_final,
        padding + bc.RECT_HEIGHT + v_space / 2 - bc.RECT_HEIGHT / 2
      )
    ) {
      startMatch(players[0], players[1], "semifinal1");
    } else if (
      !winners.semifinal2 &&
      isClickOnPlayButton(
        x,
        y,
        semi_final,
        canvas.height -
          (padding + bc.RECT_HEIGHT + v_space / 2) -
          bc.RECT_HEIGHT / 2
      )
    ) {
      startMatch(players[2], players[3], "semifinal2");
    } else if (
      !winners.final &&
      winners.semifinal1 &&
      winners.semifinal2 &&
      isClickOnPlayButton(x, y, final, canvas.height / 2 - bc.RECT_HEIGHT / 2)
    ) {
      startMatch(winners.semifinal1, winners.semifinal2, "final");
    }
  };

  const isClickOnPlayButton = (
    clickX: number,
    clickY: number,
    boxX: number,
    boxY: number
  ) => {
    const buttonX = boxX;
    const buttonY = boxY;
    return (
      clickX >= buttonX &&
      clickX <= buttonX + 150 &&
      clickY >= buttonY &&
      clickY <= buttonY + 50
    );
  };

  const startMatch = (
    player1: string,
    player2: string,
    position: "semifinal1" | "semifinal2" | "final"
  ) => {
    setCurrentMatch({ player1, player2, position });
    setTournamentStage("game");
  };

  const handleMatchEnd = (winner: string) => {
    if (!currentMatch) return;

    setWinners((prev) => ({
      ...prev,
      [currentMatch.position]: winner,
    }));

    if (currentMatch.position === "final") {
      setTournamentStage("complete");
    } else {
      setTournamentStage("bracket");
    }

    setCurrentMatch(null);
  };

  const resetTournament = () => {
    localStorage.clear();
    window.location.reload();
  };

  useEffect(() => {
    draw();
  }, [winners, players]);

  if (tournamentStage === "game" && currentMatch) {
    return (
      <PongGame
        color_theme={color_theme}
        player1={currentMatch.player1}
        player2={currentMatch.player2}
        winScore={winScore}
        onReturnToMenu={() => setTournamentStage("bracket")}
        onGameEnd={handleMatchEnd}
      />
    );
  }

  if (tournamentStage === "complete") {
    return (
      <div className={style.winner_div}>
        <h2 className={style.winner_name}>
          {winners.final} wins the tournament!
        </h2>
        {/* <Image src={trpphy} alt="winner" width={300} height={300} /> */}
        <Lottie animationData={winner_animation} loop autoplay style={{height: 400, width:400}}/>
        <Button
          className={style.winner_button}
          onClick={resetTournament}
        >
          New Tournament
        </Button>
      </div>
    );
  }

  return (
    <div className={style.main}>
      <canvas
        ref={canvasRef}
        width={gc.CANVAS_WIDTH}
        height={gc.CANVAS_HEIGHT}
        className={style.canvas}
        onClick={handleClick}
      />
    </div>
  );
};

export default Brackets;