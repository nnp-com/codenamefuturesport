import { Sport, TeamMember, AttemptResult, MatchResult, RoundResult } from './gameTypes';
import { getFlavorText } from '../utils/flavorTextUtils';
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
    {min: 0, max: 69, points: 0, action: 'catch'},
    {min: 70, max: 79, points: 0, action: 'block'},
    {min: 80, max: 89, points: 0, action: 'intercept'},
    {min: 90, max: 99, points: 0, action: 'dive'},
  ],
  Basketball: [
    {min: 0, max: 69, points: 0, action: 'block'},
    {min: 70, max: 79, points: 0, action: 'deflection'},
    {min: 80, max: 89, points: 0, action: 'steal'},
    {min: 90, max: 99, points: 0, action: 'rebound'},
  ],
  Soccer: [
    {min: 0, max: 69, points: 0, action: 'tackle'},
    {min: 70, max: 79, points: 0, action: 'save'},
    {min: 80, max: 89, points: 0, action: 'block'},
    {min: 90, max: 99, points: 0, action: 'interception'},
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
    const defenseRankings = DEFENSE_RANKINGS[defender.sport];
    for (const ranking of defenseRankings) {
      if (endRoll >= ranking.min && endRoll <= ranking.max) {
        console.log(`Defensive success: ${ranking.action}`);
        const flavorText = getFlavorText(attacker.sport, defender.sport, false, ranking.action);
        
        return {
          points: 0,
          action: ranking.action,
          description: replacePlayers(flavorText.text, defender.name, attacker.name)
        };
      }
    }
  } else {
    // Offensive success
    const sportRankings = POINT_RANKINGS[attacker.sport];
    for (const ranking of sportRankings) {
      if (endRoll >= ranking.min && endRoll <= ranking.max) {
        const flavorText = getFlavorText(attacker.sport, defender.sport, true, ranking.action);
        
        return {
          points: ranking.points,
          action: ranking.action,
          description: replacePlayers(flavorText.text, attacker.name, defender.name)
        };
      }
    }
  }

  // required return statement
  console.error(`Unexpected scenario in performAttempt: endRoll ${endRoll}, attacker ${attacker.sport}, defender ${defender.sport}`);
  return {
    points: 0,
    action: 'error',
    description: `An unexpected situation occurred between ${attacker.name} and ${defender.name}.`
  };
};

// Helper function to replace player names in flavor text
const replacePlayers = (text: string, attacker: string, defender: string): string => {
  return text.replace(/\[Player One\]([\s\S]*?)(\W*)(?=\s|$)/g, `${attacker}$1$2`)
             .replace(/\[Player Two\]([\s\S]*?)(\W*)(?=\s|$)/g, `${defender}$1$2`);
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