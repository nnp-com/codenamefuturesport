// utils/gameRules.ts

import {Sport, TeamMember, AttemptResult, MatchResult} from './types';

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

// Helper function to get SVS key
const getSVSKey = (attacker: Sport, defender: Sport): string => {
  const sportAbbr: Record<Sport, string> = {
    Baseball: 'BB',
    Basketball: 'BK',
    Soccer: 'SC',
  };
  return `${sportAbbr[attacker]}-${sportAbbr[defender]}`;
};

export const performAttempt = (attacker: TeamMember,
    defender: TeamMember): AttemptResult => {
  const offensiveStrength = attacker.offensiveStrength;
  const defensiveStrength = defender.defensiveStrength;
  const svsPoints = SVS_POINTS[getSVSKey(attacker.sport, defender.sport)];
  const diceRoll = Math.floor(Math.random() * 100) + 1; // d100 roll

  const endRoll = offensiveStrength - defensiveStrength + svsPoints + diceRoll;

  const sportRankings = POINT_RANKINGS[attacker.sport];
  for (const ranking of sportRankings) {
    if (endRoll >= ranking.min && endRoll <= ranking.max) {
      return {
        points: ranking.points,
        action: ranking.action,
        description: `${attacker.name} (${attacker.sport})
        ${ranking.action} against ${defender.name}
        (${defender.sport}) for ${ranking.points} points`,
      };
    }
  }

  // Default return statement if no conditions are met
  return {
    points: 0,
    action: 'miss',
    description: `${attacker.name} (${attacker.sport})
    missed against ${defender.name} (${defender.sport})`,
  };
};

// Function to calculate attempt result
export const calculateAttemptResult = (
    attacker: TeamMember,
    defender: TeamMember,
): { points: number; action: string } => {
  const offensiveStrength = attacker.offensiveStrength;
  const defensiveStrength = defender.defensiveStrength;
  const svsPoints = SVS_POINTS[getSVSKey(attacker.sport, defender.sport)];
  const diceRoll = Math.floor(Math.random() * 100) + 1; // d100 roll

  const endRoll = offensiveStrength - defensiveStrength + svsPoints + diceRoll;

  const sportRankings = POINT_RANKINGS[attacker.sport];
  for (const ranking of sportRankings) {
    if (endRoll >= ranking.min && endRoll <= ranking.max) {
      return {points: ranking.points, action: ranking.action};
    }
  }

  return {points: 0, action: 'miss'};
};

// Function to perform a round (6 attempts for each player)
export const performRound = (
    player1Team: TeamMember[],
    player2Team: TeamMember[],
): { player1Score: number; player2Score: number; events: string[] } => {
  let player1Score = 0;
  let player2Score = 0;
  const events: string[] = [];

  for (let i = 0; i < 6; i++) {
    // Player 1 attacks
    const attacker1 =
    player1Team[Math.floor(Math.random() * player1Team.length)];
    const defender1 =
    player2Team[Math.floor(Math.random() * player2Team.length)];
    const result1 = calculateAttemptResult(attacker1, defender1);
    player1Score += result1.points;
    events.push(`${attacker1.name} (${attacker1.sport})
        ${result1.action} against ${defender1.name}
        (${defender1.sport}) for ${result1.points} points`);

    // Player 2 attacks
    const attacker2 =
    player2Team[Math.floor(Math.random() * player2Team.length)];
    const defender2 =
    player1Team[Math.floor(Math.random() * player1Team.length)];
    const result2 = calculateAttemptResult(attacker2, defender2);
    player2Score += result2.points;
    events.push(`${attacker2.name} (${attacker2.sport})
        ${result2.action} against ${defender2.name}
        (${defender2.sport}) for ${result2.points} points`);
  }

  return {player1Score, player2Score, events};
};

export const performMatch = (
    player1Team: TeamMember[],
    player2Team: TeamMember[],
): Omit<MatchResult, 'player1Id' | 'player2Id'> => {
  let player1TotalScore = 0;
  let player2TotalScore = 0;
  const roundResults: MatchResult['roundResults'] = [];

  for (let round = 1; round <= 12; round++) {
    const isPlayer1Attacking = round % 2 === 1;
    const {player1Score, player2Score, events} = isPlayer1Attacking ?
    performRound(player1Team, player2Team) :
    performRound(player2Team, player1Team);

    const roundResult = {
      round,
      player1Score: isPlayer1Attacking ? player1Score : player2Score,
      player2Score: isPlayer1Attacking ? player2Score : player1Score,
      events,
    };

    roundResults.push(roundResult);

    player1TotalScore += roundResult.player1Score;
    player2TotalScore += roundResult.player2Score;
  }

  const winner = player1TotalScore > player2TotalScore ? 'player1' : 'player2';

  return {
    player1TotalScore,
    player2TotalScore,
    roundResults,
    winner,
  };
};
