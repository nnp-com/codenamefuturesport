import { Timestamp, FieldValue } from 'firebase/firestore';

export type Sport = 'Baseball' | 'Basketball' | 'Soccer';

export interface Player {
    id: string;
    name: string;
    sport: Sport;
    starTier: number;
    offensiveStrength: number;
    defensiveStrength: number;
}

export interface TeamMember extends Player {
    position: number;
}

export interface User {
    uid: string;
    displayName: string;
    team: TeamMember[];
    championshipWins?: number;
    totalPoints?: number;
    legacyPoints?: number;
}

export interface AttemptResult {
    points: number;
    action: string;
    description: string;
}

export interface RoundResult {
    player1Score: number;
    player2Score: number;
    events: string[];
}

export interface MatchResult {
    player1Id: string;
    player2Id: string;
    player1TotalScore: number;
    player2TotalScore: number;
    winner: string;
    roundResults: Array<{
        round: number;
        player1Score: number;
        player2Score: number;
        events: string[];
    }>;
}

export interface OngoingGame {
    id?: string;
    player1Id: string;
    player2Id: string;
    startTime: Timestamp;
    currentAttempt: number;
    player1Score: number;
    player2Score: number;
    arena: string;
    attempts: {
      [attemptId: string]: {
        attemptNumber: number;
        roundNumber: number;
        attacker: string;
        defender: string;
        isPlayer1Attacking: boolean;
        result: AttemptResult;
      };
    };
    isComplete: boolean;
  }

export interface MatchHistory extends OngoingGame {
    endTime: Timestamp;
    winner: string;
}
