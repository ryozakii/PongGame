export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  color: string;
  draw: (ctx: CanvasRenderingContext2D) => void;
  update: (direction: number) => void;
}

export interface Ball {
  x0: number;
  y0: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  draw: (ctx: CanvasRenderingContext2D) => void;
  update: (
    canvasWidth: number,
    canvasHeight: number,
    paddles: Paddle[]
  ) => void;
  resetBall: () => void;
}

export interface PongGameProps {
  color_theme: string;
  player1: string;
  player2: string;
  winScore: number;
  onReturnToMenu: () => void;
  onGameEnd: (winner: string) => void;
}



export interface KeyState {
  [key: string]: boolean;
}

export const colors: string[] = [
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#14b8a6", // teal
  "#10b981", // green
  "#22c55e", // green
  "#84cc16", // green
  "#34d399", // light green
  "#6ee7b7", // light teal
  "#16a34a", // green
  "#f43f5e", // pink
  "#ec4899", // pink
  "#e11d48", // dark pink
  "#f97316", // orange
  "#f59e0b", // yellow
  "#eab308", // yellow
  "#f59e0b", // yellow
  "#e5e7eb", // light gray
  "#71717a", // grayish
  "#6366f1", // purple
  "#8b5cf6", // purple
  "#a855f7", // purple
  "#9333ea", // purple
  "#c026d3", // magenta
  "#d946ef", // pink
  "#ef4444", // bright red
  "#4ade80", // light green
  "#4b5563", // dark gray
  "#374151", // dark gray
  "#1f2937", // dark gray
  "#111827", // dark gray
  "#0ea5e9", // light blue
  "#e5e7eb", // light gray
  "#9ca3af", // light gray
  "#d1d5db", // light gray
  "#6b7280", // gray
];