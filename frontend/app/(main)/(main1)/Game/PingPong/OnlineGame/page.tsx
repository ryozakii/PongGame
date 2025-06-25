"use client";

import React, { useRef, useEffect, useState,useMemo} from 'react';
import "./styles.css";
import GameInfo from "@components/gameInfo";
import { set } from 'zod';
import {useSearchParams} from 'next/navigation';
import { Suspense } from "react";
const GameState = {
  GAME_IN_PROGRESS : 1,
  GAME_ENDED : 2,
  GAME_NOT_STARTED : 3
}
const ping_pong = {ball_x: 400, ball_y: 300, player1_y: 250, player2_y: 250, player1_score: 0, player2_score: 0, state: GameState.GAME_NOT_STARTED, ball_speed_x: 3, ball_speed_y: 1};
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;

const PingPongGame = () => {
  // const params = useSearchParams().get('name');
  const param = useRef(null);
  //  console.log("query",params);
  const socketRef = useRef(null);
  const gameState: any = useRef(ping_pong);
  const canvasRef = useRef(null);
  const playerType = useRef('player1');
  const previousGameState = useRef(null);
  const opponent = useRef(null);
  const [message, setMessage] = useState('Ping Pong');
  const [Play, setPlay] = useState(false);
  const move = useRef('stop');
  const hash = useSearchParams().get('hash');

  let gameMenuButtonPress = () => {
    if (socketRef.current != null)
      {
        if (gameState.current.state == GameState.GAME_NOT_STARTED)
        {
          socketRef.current.close();
          setPlay(false)
          socketRef.current = null;
          // setSocket(null);
          // console.log("wroks")
          return ;
        }
      
          return ;
      }
    setPlay(true);
    setMessage('Waiting for opponent');
    gameState.current = ping_pong;  
    opponent.current = null;
    if (hash)
      {
        socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/ws/ping_pong/${hash}/`,['json',localStorage.getItem("access")]);
      }
    else
    socketRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/ws/ping_pong/`,['json',localStorage.getItem("access")]);
    const ws = socketRef.current;
    ws.onmessage = (event) => {

      const data = JSON.parse(event.data);
      switch(data.type) {
        case 'game_init':
          setMessage('vs');
          opponent.current = data.player2;
          playerType.current = data.player;
          // setPlayers({'player1' : data.player1, 'player2' : data.player2});
          gameState.current = data.game_state;
          const loop = ()=> {
            gameLoop();
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && gameState.current.state == GameState.GAME_IN_PROGRESS)
              requestAnimationFrame(loop);
          }
          loop();
          break;
        case 'game_state':
          gameState.current = data.game_state;
          break;
        case 'game_end':
          setPlay(false);
          setMessage(data.winner != playerType.current ? 'You Lose' : 'You Win!');
          canvasRef.current.getContext('2d',{ alpha: false }).clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          // gameState.cur  rent = data.game_state;
          // gameState.current.state = GameState.GAME_NOT_STARTED;
          gameState.current = ping_pong
          socketRef.current.close();
          socketRef.current = null;
          break;
      }
    };
    ws.onopen = () => {
      console.log('WebSocket Connected');
    };
    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      socketRef.current = null;
      setPlay(false);
    };
  }
  useEffect(() => {
   
    const handleKeyDown = (e) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)
      {
        if (((e.key === 'ArrowUp' || e.key === 'w') && move.current != 'up')){
          move.current = 'up';
          socketRef.current.send(JSON.stringify({
          type: 'paddle_move',
          move: 'up'
        }));
      }
        if ((e.key === 'ArrowDown' || e.key === 's') && move.current != 'down'){ 
          move.current = 'down';
          socketRef.current.send(JSON.stringify({
            type: 'paddle_move',
            move: 'down'
          }));
        
      }
    }
  }
    const handleKeyUp = (e) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)
      {
        if (((e.key === 'ArrowUp' || e.key === 'w') || e.key === 'ArrowDown' || e.key === 's') && move.current != 'stop'){
          move.current = 'stop';
          socketRef.current.send(JSON.stringify({
          type: 'paddle_move',
          move: 'stop'
        }));
      }
    }
  }
  const handleswitch = (e) => {
    console.log('blur');
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)
    {
      if ( move.current != 'stop'){
        move.current = 'stop';
        socketRef.current.send(JSON.stringify({
        type: 'paddle_move',
        move: 'stop'
      }));
    }
  }
}
    window.addEventListener("blur", handleswitch);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleswitch);  
      if (socketRef.current != null)
        {
          socketRef.current.close();
          socketRef.current = null;
        }
    }
  },[]);

  let gameLoop = () => {
    // console.log('gameLoop');
    if (gameState.current.state != GameState.GAME_IN_PROGRESS || !canvasRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d',{ alpha: false });
    if (previousGameState.current != null)
    {
      ctx.clearRect(0, previousGameState.current.player1_y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.clearRect(CANVAS_WIDTH - PADDLE_WIDTH, previousGameState.current.player2_y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.clearRect(previousGameState.current.ball_x - BALL_RADIUS - 5, previousGameState.current.ball_y - BALL_RADIUS - 5, 2 * BALL_RADIUS + 10, 2 * BALL_RADIUS + 10);
      
      ctx.clearRect(CANVAS_WIDTH / 4, 0, 50, 50);
      ctx.clearRect(3 * CANVAS_WIDTH / 4, 0, 50, 50);
    }
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, gameState.player1_y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.player2_y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(0, gameState.current.player1_y,PADDLE_WIDTH, PADDLE_HEIGHT, 10);
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.current.player2_y, PADDLE_WIDTH, PADDLE_HEIGHT, 10);
    ctx.beginPath();
    ctx.arc(gameState.current.ball_x, gameState.current.ball_y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
    ctx.font = '24px Audiowide';
    ctx.fillText(gameState.current.player1_score.toString(), CANVAS_WIDTH / 4, 50);
    ctx.fillText(gameState.current.player2_score.toString(), 3 * CANVAS_WIDTH / 4, 50);
    previousGameState.current = gameState.current;
  };
  let gameMenuStyle = `max-w-[100%] mt-2 ${Play && gameState.current?.state == GameState.GAME_IN_PROGRESS ? 'hidden' : ''} select-none flex  border-2 border-black rounded w-[810px]  text-1xl md:text-3xl 2xl:text-5xl 2xl:border-[6px] aspect-[14/1]`
  let gameMenuElementsStyle = ` ${Play && gameState.current?.state == GameState.GAME_NOT_STARTED ?  'dots ' : ''} ${Play && gameState.current?.state == GameState.GAME_IN_PROGRESS ? 'hidden' : ''} active:border-[1px] select-none text-black no-underline bg-black  text-white  grow flex justify-center items-center hover:border-2 hover:border-black cursor-pointer text-xl md:text-2xl lg:text-4xl  hover:text-2xl hover:md:text-3xl hover:lg:text-5xl `;
  let c1 = useMemo(() => {
    return <GameInfo message={message} Opponent={opponent.current} playerType = {playerType.current} />
  }, [message,playerType]);

  useEffect(() => {
      if (hash)
    gameMenuButtonPress();
    },[hash]);
  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex flex-col items-center justify-center max-w-[90vw]    ">
      <div className='z-0 relative'>{c1}</div> 
      
      <canvas 
        ref={canvasRef}
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        className="border-4 rounded border-black bg-black aspect-[800/600] w-full max-w-[810px] "
      />
      <main className={gameMenuStyle } >
      <div className={gameMenuElementsStyle} onClick = {gameMenuButtonPress}>{Play ? '' : "Find Game"} </div>
      </main>
      </div>
      </Suspense>
  );
};

export default PingPongGame;