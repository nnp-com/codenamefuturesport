import { Sport, TeamMember, AttemptResult, MatchResult, RoundResult } from './gameTypes';
import flavorTextData from '../data/flavourText.json';

// Sport vs Sport (SVS) indicator points
export const SVS_POINTS: Record<string, number> = {
  'BB-BB': 10, 'BB-BK': 20, 'BB-SC': 40,
  'BK-BK': 10, 'BK-BB': 40, 'BK-SC': 20,
  'SC-SC': 10, 'SC-BB': 20, 'SC-BK': 40,
};

// Point rankings for each sport
export const POINT_RANKINGS = {
  Baseball: [
    {min: 100, max: 135, points: 10, action: 'single'},
    {min: 136, max: 165, points: 20, action: 'double'},
    {min: 166, max: 250, points: 30, action: 'triple'},
    {min: 251, max: 1000, points: 50, action: 'homerun'},
  ],
  Basketball: [
    {min: 100, max: 145, points: 10, action: 'rebound'},
    {min: 146, max: 225, points: 15, action: 'basket'},
    {min: 226, max: 1000, points: 30, action: 'three-pointer'},
  ],
  Soccer: [
    {min: 100, max: 145, points: 10, action: 'pass'},
    {min: 146, max: 285, points: 25, action: 'assist'},
    {min: 286, max: 1000, points: 65, action: 'goal'},
  ],
};

export const DEFENSE_RANKINGS = {
  Baseball: [
    {min: 0, max: 99, points: 0, action: 'catch'},
    {min: 0, max: 99, points: 0, action: 'block'},
    {min: 0, max: 99, points: 0, action: 'intercept'},
    {min: 0, max: 99, points: 0, action: 'dive'},
    {min: 0, max: 99, points: 0, action: 'leap'},
  ],
  Basketball: [
    {min: 0, max: 99, points: 0, action: 'block'},
    {min: 0, max: 99, points: 0, action: 'deflection'},
    {min: 0, max: 99, points: 0, action: 'save'},
    {min: 0, max: 99, points: 0, action: 'interception'},
  ],
  Soccer: [
    {min: 0, max: 99, points: 0, action: 'block'},
    {min: 0, max: 99, points: 0, action: 'deflection'},
    {min: 0, max: 99, points: 0, action: 'interception'},
    {min: 0, max: 99, points: 0, action: 'save'},
  ],
};

// Helper function to get SVS key
const getSVSKey = (attacker: Sport, defender: Sport): string => {
  const sportAbbr: Record<Sport, string> = {
    Baseball: 'BB',
    Basketball: 'BK',
    Soccer: 'SC',
  };
  return `${sportAbbr[attacker]}-${sportAbbr[defender]}`;
};

interface FlavorTextItem {
  id: number;
  event: string;
  points: number;
  text: string;
}

interface FlavorTextCategory {
  successfulAttack: FlavorTextItem[];
  successfulDefense: FlavorTextItem[];
}

interface FlavorTextData {
  [key: string]: FlavorTextCategory;
}

const typedFlavorTextData = (flavorTextData as FlavorTextData[])[0];

export const performAttempt = (attacker: TeamMember, defender: TeamMember): AttemptResult => {
  const offensiveStrength = attacker.offensiveStrength;
  const defensiveStrength = defender.defensiveStrength;
  const svsPoints = SVS_POINTS[getSVSKey(attacker.sport, defender.sport)];
  const diceRoll = Math.floor(Math.random() * 100) + 1; // d100 roll

  const endRoll = offensiveStrength - defensiveStrength + svsPoints + diceRoll;

  console.log(`Attempt: ${attacker.sport} attacking ${defender.sport}, endRoll: ${endRoll}`);

  if (endRoll < 100) {
    // Defensive success
    return {
      points: 0,
      action: 'defend',
      description: `${defender.name} successfully defended against ${attacker.name}'s attack.`
    };
  } else {
    // Offensive success
    const sportRankings = POINT_RANKINGS[attacker.sport];
    for (const ranking of sportRankings) {
      if (endRoll >= ranking.min && endRoll <= ranking.max) {
        return {
          points: ranking.points,
          action: ranking.action,
          description: `${attacker.name} scored ${ranking.points} points with a ${ranking.action} against ${defender.name}.`
        };
      }
    }
  }

  // This should never happen, but TypeScript requires a return statement
  console.error(`Unexpected scenario in performAttempt: endRoll ${endRoll}, attacker ${attacker.sport}, defender ${defender.sport}`);
  return {
    points: 0,
    action: 'error',
    description: `An unexpected situation occurred between ${attacker.name} and ${defender.name}.`
  };
};

export const performRound = (player1Team: TeamMember[], player2Team: TeamMember[]): RoundResult => {
  let player1Score = 0;
  let player2Score = 0;
  const events: string[] = [];

  for (let i = 0; i < 6; i++) {
    // Player 1 attacks
    const attacker1 = player1Team[Math.floor(Math.random() * player1Team.length)];
    const defender1 = player2Team[Math.floor(Math.random() * player2Team.length)];
    const result1 = performAttempt(attacker1, defender1);
    player1Score += result1.points;
    events.push(result1.description);

    // Player 2 attacks
    const attacker2 = player2Team[Math.floor(Math.random() * player2Team.length)];
    const defender2 = player1Team[Math.floor(Math.random() * player1Team.length)];
    const result2 = performAttempt(attacker2, defender2);
    player2Score += result2.points;
    events.push(result2.description);
  }

  return { player1Score, player2Score, events };
};

export const performMatch = (player1Team: TeamMember[], player2Team: TeamMember[]): Omit<MatchResult, 'player1Id' | 'player2Id'> => {
  let player1TotalScore = 0;
  let player2TotalScore = 0;
  const roundResults: MatchResult['roundResults'] = [];

  for (let round = 1; round <= 12; round++) {
    const { player1Score, player2Score, events } = performRound(player1Team, player2Team);

    roundResults.push({
      round,
      player1Score,
      player2Score,
      events,
    });

    player1TotalScore += player1Score;
    player2TotalScore += player2Score;
  }

  const winner = player1TotalScore > player2TotalScore ? 'player1' : 'player2';

  return {
    player1TotalScore,
    player2TotalScore,
    roundResults,
    winner,
  };
};