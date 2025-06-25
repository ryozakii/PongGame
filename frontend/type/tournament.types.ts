export interface BracketsProps {
    players: string[];
    color_theme: string;
    winScore: number;
  }
  
  export interface Match {
    player1: string;
    player2: string;
    position: "semifinal1" | "semifinal2" | "final";
  }
  
  export interface Winners {
    semifinal1: string | null;
    semifinal2: string | null;
    final: string | null;
  }
  