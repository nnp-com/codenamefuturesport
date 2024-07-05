// types/index.ts

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
  team: TeamMember[];
  championshipWins?: number;
  totalPoints?: number;
  legacyPoints?: number;
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

export interface Match {
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

export interface AttemptResult {
  points: number;
  action: string;
}

export interface RoundResult {
  player1Score: number;
  player2Score: number;
  events: string[];
}

export interface MatchResult {
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  winner: string;
  roundResults: Array<{
      round: number;
      player1Score: number;
      player2Score: number;
      events: string[];
  }>;
}

export interface OngoingGame {
  player1Id: string;
  player2Id: string;
  startTime: Date;
  roundsCompleted: number;
  rounds?: {
      [roundNumber: number]: RoundResult;
  };
}

export interface MatchHistory extends OngoingGame, MatchResult {
  endTime: Date;
}