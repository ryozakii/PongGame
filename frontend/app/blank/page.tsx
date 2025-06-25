"use client";
import React, { useRef, useEffect, useState } from 'react';

const PingPongGame = () => {
  const canvasRef = useRef(null);
  const [playerAScore, setPlayerAScore] = useState(0);
  const [playerBScore, setPlayerBScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Game configuration
  const config = {
    width: 800,
    height: 500,
    paddleWidth: 15,
    paddleHeight: 100,
    ballRadius: 10,
    paddleSpeed: 10,
    ballSpeed: 5
  };

  // Game state
  const gameState = useRef({
    ball: {
      x: config.width / 2,
      y: config.height / 2,
      dx: config.ballSpeed,
      dy: config.ballSpeed
    },
    playerA: {
      y: config.height / 2 - config.paddleHeight / 2
    },
    playerB: {
      y: config.height / 2 - config.paddleHeight / 2
    },
    keys: {
      w: false,
      s: false,
      ArrowUp: false,
      ArrowDown: false
    }
  });

  // Draw game elements
  const drawGame = (ctx) => {
    // Clear canvas
    ctx.clearRect(0, 0, config.width, config.height);

    // Draw background
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, config.width, config.height);

    // Draw center line
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(config.width / 2, 0);
    ctx.lineTo(config.width / 2, config.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = 'white';
    ctx.fillRect(0, gameState.current.playerA.y, config.paddleWidth, config.paddleHeight);
    ctx.fillRect(config.width - config.paddleWidth, gameState.current.playerB.y, config.paddleWidth, config.paddleHeight);

    // Draw ball
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.arc(gameState.current.ball.x, gameState.current.ball.y, config.ballRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Update game logic
  const updateGame = () => {
    const ball = gameState.current.ball;
    const playerA = gameState.current.playerA;
    const playerB = gameState.current.playerB;
    const keys = gameState.current.keys;

    // Move paddles
    if (keys.w && playerA.y > 0) {
      playerA.y -= config.paddleSpeed;
    }
    if (keys.s && playerA.y < config.height - config.paddleHeight) {
      playerA.y += config.paddleSpeed;
    }
    if (keys.ArrowUp && playerB.y > 0) {
      playerB.y -= config.paddleSpeed;
    }
    if (keys.ArrowDown && playerB.y < config.height - config.paddleHeight) {
      playerB.y += config.paddleSpeed;
    }

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - config.ballRadius < 0 || ball.y + config.ballRadius > config.height) {
      ball.dy = -ball.dy;
    }

    // Ball collision with paddles
    const leftPaddleCollision = 
      ball.x - config.ballRadius < config.paddleWidth && 
      ball.y > playerA.y && 
      ball.y < playerA.y + config.paddleHeight;

    const rightPaddleCollision = 
      ball.x + config.ballRadius > config.width - config.paddleWidth && 
      ball.y > playerB.y && 
      ball.y < playerB.y + config.paddleHeight;

    if (leftPaddleCollision || rightPaddleCollision) {
      ball.dx = -ball.dx;
    }

    // Scoring
    if (ball.x < 0) {
      setPlayerBScore(prev => {
        const newScore = prev + 1;
        if (newScore >= 10) setGameOver(true);
        return newScore;
      });
      resetBall();
    } else if (ball.x > config.width) {
      setPlayerAScore(prev => {
        const newScore = prev + 1;
        if (newScore >= 10) setGameOver(true);
        return newScore;
      });
      resetBall();
    }
  };

  // Reset ball to center
  const resetBall = () => {
    const ball = gameState.current.ball;
    ball.x = config.width / 2;
    ball.y = config.height / 2;
    
    // Randomize direction
    const angle = Math.random() * Math.PI / 2 - Math.PI / 4;
    ball.dx = config.ballSpeed * Math.cos(angle);
    ball.dy = config.ballSpeed * Math.sin(angle);
  };

  // Reset entire game
  const resetGame = () => {
    // Reset scores
    setPlayerAScore(0);
    setPlayerBScore(0);
    
    // Reset ball and paddles
    gameState.current.ball.x = config.width / 2;
    gameState.current.ball.y = config.height / 2;
    gameState.current.playerA.y = config.height / 2 - config.paddleHeight / 2;
    gameState.current.playerB.y = config.height / 2 - config.paddleHeight / 2;
    
    // Reset game state
    setGameOver(false);
  };

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const gameLoop = () => {
      if (!gameOver) {
        updateGame();
        drawGame(ctx);
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    // Keyboard event listeners
    const handleKeyDown = (e) => {
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        gameState.current.keys[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        gameState.current.keys[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Start game loop
    gameLoop();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="mb-4 text-2xl">
        Ping Pong Game
      </div>
      <div className="mb-4 text-xl">
        Player A: {playerAScore} | Player B: {playerBScore}
      </div>
      
      <canvas 
        ref={canvasRef}
        width={config.width}
        height={config.height}
        className="border-2 border-white"
      />

      {gameOver && (
        <div className="mt-4 text-center">
          <div className="text-2xl mb-2">
            {playerAScore >= 10 ? 'Player A Wins!' : 'Player B Wins!'}
          </div>
          <button 
            onClick={resetGame}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Play Again
          </button>
        </div>
      )}

      <div className="mt-4 text-sm text-center">
        <p>Player A Controls: W (Up), S (Down)</p>
        <p>Player B Controls: Up Arrow (Up), Down Arrow (Down)</p>
      </div>
    </div>
  );
};

export default PingPongGame;