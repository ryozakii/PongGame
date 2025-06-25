"use client";
import React, { useState, useRef, useEffect } from "react";
import style from "@styles/local_game.module.css";
import { GAME_CONSTANTS as ctc } from "@constants/gameConstants";
import { model, feedForward } from "@type/model";
import { KeyState, Paddle, Ball, PongGameProps } from "@type/game.types";

function getRandomAngle(
  minAngle: number,
  maxAngle: number,
  excluded: number[]
) {
  let angle = 0;
  while (excluded.includes(angle)) {
    angle =
      (Math.random() * (maxAngle - minAngle) + minAngle) * (Math.PI / 180);
  }
  return angle;
}

const PongGame: React.FC<PongGameProps> = ({
  color_theme,
  player1,
  player2,
  winScore,
  onGameEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const start = useRef<boolean>(false);
  const score1 = useRef<number>(0);
  const score2 = useRef<number>(0);
  const keyState = useRef<KeyState>({});
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string>("");

  const createPaddle = (x: number, y: number): Paddle => ({
    x,
    y,
    width: ctc.PADDLE_WIDTH,
    height: ctc.PADDLE_HEIGHT,
    vy: ctc.PADDLE_VELOCITY,
    color: color_theme,
    draw(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    },
    update(direction: number) {
      const newY = this.y + direction * this.vy;
      if (
        newY >= 0 &&
        newY <= (canvasRef.current?.height || ctc.CANVAS_HEIGHT) - this.height
      ) {
        this.y = newY;
      }
    },
  });

  const leftPaddle = useRef<Paddle>(
    createPaddle(0, ctc.CANVAS_HEIGHT / 2 - ctc.PADDLE_HEIGHT / 2)
  );
  const rightPaddle = useRef<Paddle>(
    createPaddle(
      ctc.CANVAS_WIDTH - ctc.PADDLE_WIDTH,
      ctc.CANVAS_HEIGHT / 2 - ctc.PADDLE_HEIGHT / 2
    )
  );

  const ball = useRef<Ball>({
    x: ctc.CANVAS_WIDTH / 2,
    y: ctc.CANVAS_HEIGHT / 2,
    x0: ctc.CANVAS_WIDTH / 2,
    y0: ctc.CANVAS_HEIGHT / 2,
    vx: ctc.INITIAL_BALL_VELOCITY,
    vy: ctc.INITIAL_BALL_VELOCITY,
    radius: ctc.BALL_RADIUS,
    color: color_theme,
    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();
    },
    update(canvasWidth: number, canvasHeight: number, paddles: Paddle[]) {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y + this.radius >= canvasHeight) this.vy = -Math.abs(this.vy);
      if (this.y - this.radius < 0) this.vy = Math.abs(this.vy);
      if (this.vx < 0) {
        if (
          this.y + this.vy >= paddles[0].y - 5 &&
          this.y + this.vy <= paddles[0].y + 5 + paddles[0].height
        ) {
          if (this.x - this.radius <= paddles[0].x + paddles[0].width) {
            this.vx = Math.min(
              this.vx * ctc.SPEED_INCREASE_FACTOR,
              ctc.MAX_BALL_SPEED
            );
            this.vy = Math.min(
              this.vy * ctc.SPEED_INCREASE_FACTOR,
              ctc.MAX_BALL_SPEED
            );
            this.vx *= -1;
            const middle_y = paddles[0].y + paddles[0].height / 2;
            const difference_in_y = middle_y - this.y;
            const reduction_factor =
              paddles[0].height / 2 / ctc.INITIAL_BALL_VELOCITY;
            const y_vel = difference_in_y / reduction_factor;
            this.vy = -1 * y_vel;
          }
        }
      } else {
        if (
          this.y + this.vy >= paddles[1].y - 5 &&
          this.y + this.vy <= paddles[1].y + 5 + paddles[1].height
        ) {
          if (this.x + this.radius >= paddles[1].x) {
            this.vx = Math.min(
              this.vx * ctc.SPEED_INCREASE_FACTOR,
              ctc.MAX_BALL_SPEED
            );
            this.vy = Math.min(
              this.vy * ctc.SPEED_INCREASE_FACTOR,
              ctc.MAX_BALL_SPEED
            );
            this.vx *= -1;
            const middle_y = paddles[1].y + paddles[1].height / 2;
            const difference_in_y = middle_y - this.y;
            const reduction_factor =
              paddles[1].height / 2 / ctc.INITIAL_BALL_VELOCITY;
            const y_vel = difference_in_y / reduction_factor;
            this.vy = -1 * y_vel;
          }
        }
      }

      if (this.x < 0) {
        score2.current += 1;
        if (score2.current >= winScore) {
          setGameOver(true);
          setWinner(player2);
          onGameEnd(player2);
        } else {
          start.current = false;
          this.resetBall();
          paddles[0].y = ctc.CANVAS_HEIGHT / 2 - ctc.PADDLE_HEIGHT / 2;
          paddles[1].y = ctc.CANVAS_HEIGHT / 2 - ctc.PADDLE_HEIGHT / 2;
        }
      } else if (this.x > canvasWidth) {
        score1.current += 1;
        if (score1.current >= winScore) {
          setGameOver(true);
          setWinner(player1);
          onGameEnd(player1);
        } else {
          start.current = false;
          this.resetBall();
          paddles[0].y = ctc.CANVAS_HEIGHT / 2 - ctc.PADDLE_HEIGHT / 2;
          paddles[1].y = ctc.CANVAS_HEIGHT / 2 - ctc.PADDLE_HEIGHT / 2;
        }
      }
    },
    resetBall() {
      this.x = this.x0;
      this.y = this.y0;
      const angle = getRandomAngle(-30, 30, [0]);
      const x_vel = Math.abs(Math.cos(angle) * ctc.INITIAL_BALL_VELOCITY);
      const y_vel = Math.sin(angle) * ctc.INITIAL_BALL_VELOCITY;
      this.vy = y_vel;
      this.vx = -x_vel;
    },
  });

  useEffect(() => {
    draw();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver]);

  const updateAIPaddle = (left: boolean = false, right: boolean = true) => {
    if (!start.current) return;
    if (right) {
      console.log(ball.current.vx);
      if (ball.current.vx > 0 && ball.current.x > 100) {
        const outputs = feedForward(
          [ball.current.x, ball.current.y, rightPaddle.current.y],
          model
        );
        const [middle, up, down] = outputs;

        const maxOutput = Math.max(up, middle, down);
        if (maxOutput === up) rightPaddle.current.update(-1);
        else if (maxOutput === down) rightPaddle.current.update(1);
      }
    }
    if (left) {
      if (ball.current.vx < 0 && ball.current.x < 500) {
        const outputs = feedForward(
          [ball.current.x, ball.current.y, leftPaddle.current.y],
          model
        );
        const [middle, up, down] = outputs;

        const maxOutput = Math.max(up, middle, down);
        if (maxOutput === up) leftPaddle.current.update(-1);
        else if (maxOutput === down) leftPaddle.current.update(1);
      }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = `rgba(${parseInt(color_theme.slice(1, 3), 16)},
      ${parseInt(color_theme.slice(3, 5), 16)},
      ${parseInt(color_theme.slice(5, 7), 16)},
      0.3)`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "40px sans-serif";
    ctx.fillStyle = color_theme;
    ctx.textAlign = "center";
    ctx.fillText(`${score1.current}`, canvas.width / 2 - 100, 50);
    ctx.fillText(`${score2.current}`, canvas.width / 2 + 100, 50);

    if (start.current) {
      ball.current.update(canvas.width, canvas.height, [
        leftPaddle.current,
        rightPaddle.current,
      ]);
      leftPaddle.current.draw(ctx);
      rightPaddle.current.draw(ctx);
      ball.current.draw(ctx);
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color_theme;
      ctx.font = "40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        gameOver ? `${winner} Wins!` : "Press space to play",
        canvas.width / 2,
        canvas.height / 2
      );
    }

    handlePaddleMovement();
    requestAnimationFrame(draw);
  };

  const handlePaddleMovement = () => {
    if (player2 === "\\Bot") {
      if (
        keyState.current["ArrowUp"] ||
        keyState.current["w"] ||
        keyState.current["W"]
      )
        leftPaddle.current.update(-1);
      if (
        keyState.current["ArrowDown"] ||
        keyState.current["s"] ||
        keyState.current["S"]
      )
        leftPaddle.current.update(1);
      updateAIPaddle();
    } else {
      if (keyState.current["ArrowUp"]) rightPaddle.current.update(-1);
      if (keyState.current["ArrowDown"]) rightPaddle.current.update(1);
      if (keyState.current["w"] || keyState.current["W"])
        leftPaddle.current.update(-1);
      if (keyState.current["s"] || keyState.current["S"])
        leftPaddle.current.update(1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    keyState.current[e.key] = true;
    if (e.code === "Space" && !gameOver) {
      start.current = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keyState.current[e.key] = false;
  };
  return (
    <div className={style.canvas} ref={containerRef}>
      <div className={style.header}>
        <div className={style.player}>{player1}</div>
        <div className={style.vs}>VS</div>
        <div className={style.player}>{player2}</div>
      </div>
      <canvas
        className={style.game}
        ref={canvasRef}
        width={ctc.CANVAS_WIDTH}
        height={ctc.CANVAS_HEIGHT}
      />
    </div>
  );
};

export default PongGame;
