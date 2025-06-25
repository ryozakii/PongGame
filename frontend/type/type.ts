// Form data interface
export interface SignUpFormData {
    first_name: string
    last_name: string
    username: string
    email: string
    password: string
    re_password: string
  }
  
  // Expected API response interface
  export interface ApiResponse<T> {
    message: string;
    data?: T;
    requires_2fa?: boolean;
    qr_code?: string;
    error?: string;
  }
  
  export interface UseApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    callApi: (url: string, options?: RequestInit) => Promise<ApiResponse<T> | null>;
  }

  export interface FormInputProps {
    id: string
    label: string
    type?: string
    value: string
    placeholder: string
    error?: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }

  export interface ButtonProps {
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    onClick?: () => void
    loading?: boolean
    children: React.ReactNode
  }

  // types.ts
export interface PlayersState {
  player1: string;
  player2: string;
  player3: string;
  player4: string;
}

export interface TournamentState {
  players: string[];
  color: string;
  winScore: number;
}

export interface Match {
  player1: string;
  player2: string;
  matchId: string;
}

export interface Winners {
  semifinal1: string | null;
  semifinal2: string | null;
  final: string | null;
}

export interface PreTournamentProps {
  onGameStart: (data: TournamentState) => void;
}

export interface TournamentBracketProps {
  players: string[];
  color: string;
  winScore: number;
}

export interface PongGameProps {
  color_theme: string;
  player1: string;
  player2: string;
  winScore: number;
  onReturnToMenu: () => void;
  onGameEnd: (winner: string) => void;
}

export interface SVGMatchBoxProps {
  x: number;
  y: number;
  player1: string;
  player2: string;
  matchId: string;
  isPlayed: boolean;
  winner: string | null;
  color: string;
  onPlay: (player1: string, player2: string, matchId: string) => void;
}

export type TournamentStage = 'bracket' | 'game' | 'complete';

