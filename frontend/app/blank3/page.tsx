"use client";
import React, { useRef, useEffect, useState } from 'react';

const GameState = {
  GAME_IN_PROGRESS : 1,
  GAME_ENDED : 2,
  GAME_NOT_STARTED : 3
}
const ping_pong = {ball_x: 400, ball_y: 300, player1_y: 250, player2_y: 250, player1_score: 0, player2_score: 0, state: GameState.GAME_NOT_STARTED, keys : {w: false, s: false, ArrowUp: false, ArrowDown: false}}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;

const PingPongGame = () => {
  const canvasRef = useRef(null);
 
  const gameState = useRef(ping_pong);
  // const socketRef = useRef(null);
  console.log("rendering");
  useEffect(() => {

  let gameLoop = () => {
    const canvas = canvasRef.current;
    const state = gameState.current;
    const ctx = canvas.getContext('2d');

    if (gameState.current.keys['ArrowUp'] || gameState.current.keys['w']) {
      gameState.current.player1_y -= 10;
    }
    if (gameState.current.keys['ArrowDown'] || gameState.current.keys['s']) {
      gameState.current.player1_y += 10;
    }
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.roundRect(0, state.player1_y,PADDLE_WIDTH, PADDLE_HEIGHT, 10);
    ctx.fill();
    ctx.beginPath();  
    ctx.roundRect(CANVAS_WIDTH - PADDLE_WIDTH, state.player2_y, PADDLE_WIDTH, PADDLE_HEIGHT, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(state.ball_x, state.ball_y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow ';
    ctx.fill();
    ctx.font = '24px Audiowide';
    ctx.fillText(state.player1_score.toString(), CANVAS_WIDTH / 4, 50);
    ctx.fillText(state.player2_score.toString(), 3 * CANVAS_WIDTH / 4, 50);
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 's' || e.key === 'ArrowDown') {
      gameState.current.keys[e.key] = true;
    }
  }
  const handleKeyUp = (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 's' || e.key === 'ArrowDown') {
    gameState.current.keys[e.key] = false;
  }
}
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
  // const handleKeyUp = (e) => {
  //   if (e.key === 'ArrowUp' || e.key === 'w') {
  //     gameState.current.player1_y -= 10;
  //   }
  //   if (e.key === 'ArrowDown' || e.key === 's') {
  //     gameState.current.player1_y += 10;
  //   }
  // }
  // window.addEventListener('keyup', handleKeyUp);
}, []);
  return (
    <div>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
    </div>
  )
};
export default PingPongGame;