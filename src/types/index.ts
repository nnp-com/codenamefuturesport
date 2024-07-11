import { Timestamp } from 'firebase/firestore';


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

export type Sport = "Basketball" | "Baseball" | "Soccer";

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  members: TeamMember[]; 
  championshipWins: number;  
  gameWins: number;          
  gameLosses: number;        
  totalGamesPlayed: number;
  totalPoints?: number;
  legacyPoints?: number;
  bot: boolean;
  email: string;
  isAdmin: boolean;
}

export interface MatchPlayer extends User {
  roundsWon: boolean[];
  totalPoints: number;
}

export interface RoundEvent {
  points: number;
  description: string;
}

export interface Round {
  number: number;
  attacker: TeamMember;
  defender: TeamMember;
  events: RoundEvent[];
  flavorText: string;
}

export interface MatchD {
  player1: MatchPlayer;
  player2: MatchPlayer;
  currentRound: Round;
}

export interface FlavorTextItem {
  id: number;
  event: string;
  points: number;
  text: string;
}

export interface FlavorTextCategory {
  successfulAttack: FlavorTextItem[];
  successfulDefense: FlavorTextItem[];
}

export interface FlavorTextData {
  [key: string]: FlavorTextCategory;
}

export interface MatchMock {
  player1: User;
  player2: User;
  currentRound: {
      number: number;
      attacker: TeamMember;
      defender: TeamMember;
      flavorText: string;
  };
}

// New types for game logic

export interface Attempt {
  attemptId: string;
  attemptNumber: number;
  roundNumber: number;
  attackingPlayerId: string;
  defendingPlayerId: string;
  attackerCardId: string;
  defenderCardId: string;
  isPlayer1Attacking: boolean;
  result: AttemptResult;
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
  matchId: string;
  player1Id: string;
  player2Id: string;
  player1TotalScore: number;
  player2TotalScore: number;
  winner: string;
  rounds: {
    [attemptId: string]: {
      roundNumber: number;
      attacker: string;
      defender: string;
      isPlayer1Attacking: boolean;
      result: AttemptResult;
    };
  };
}

export interface OngoingGame {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  currentAttempt: number;
  currentRound: number;
  isComplete: boolean;
  attempts: Record<string, Attempt>;
  arena: string;
  startTime: Timestamp;
}

export interface MatchHistory extends OngoingGame {
  endTime: Timestamp;
  winner: string;
}

export interface StandingsEntry {
  userId: string;
  user: User | null;
  stats: UserStats;
}

export interface UserStats {
  championshipWins: number;
  gameWins: number;
  gameLosses: number;
  totalGamesPlayed: number;
  totalPoints: number;
}

export interface Match {
  player1Id: string;
  player2Id: string;
}

export interface ChampionshipState {
  currentStage: number;
  matchesPlayed: MatchResult[];
  remainingMatches: {
      [stageIndex: string]: Match[]
  };
  isFinished: boolean;
  standings: { playerId: string, points: number }[];
}

