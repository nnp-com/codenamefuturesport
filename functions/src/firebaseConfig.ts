import * as admin from 'firebase-admin';
import {TeamMember, MatchResult, AttemptResult} from './types';

admin.initializeApp();

const db = admin.firestore();

export const createOngoingGame =
async (player1Id: string, player2Id: string): Promise<string> => {
  const ongoingGamesCollection = db.collection('ongoingGames');
  const gameDoc = await ongoingGamesCollection.add({
    player1Id,
    player2Id,
    startTime: admin.firestore.Timestamp.now(),
    currentAttempt: 0,
    player1Score: 0,
    player2Score: 0,
  });
  return gameDoc.id;
};

export const updateOngoingGame = async (gameId: string, attemptData: {
  attemptNumber: number;
  roundNumber: number;
  attacker: string;
  defender: string;
  isPlayer1Attacking: boolean;
  result: AttemptResult;
}) => {
  const gameDoc = db.collection('ongoingGames').doc(gameId);
  const gameData = (await gameDoc.get()).data();

  if (!gameData) {
    throw new Error(`No game data found for gameId: ${gameId}`);
  }

  const playerScoreField =
  attemptData.isPlayer1Attacking ? 'player1Score' : 'player2Score';

  await gameDoc.update({
    currentAttempt: attemptData.attemptNumber,
    [`attempts.${attemptData.attemptNumber}`]: attemptData,
    [playerScoreField]:
    admin.firestore.FieldValue.increment(attemptData.result.points),
  });
};

export const completeGame =
async (gameId: string, matchResult: MatchResult) => {
  const gameDoc = db.collection('ongoingGames').doc(gameId);
  const matchHistoryDoc = db.collection('matchHistory').doc(gameId);

  // Move the game data to match history
  const gameData = (await gameDoc.get()).data();
  await matchHistoryDoc.set({
    ...gameData,
    ...matchResult,
    endTime: admin.firestore.Timestamp.now(),
  });

  // Remove from ongoing games
  await gameDoc.delete();

  // Update player stats
  await updatePlayerStats(
      matchResult.player1Id,
      matchResult.player1TotalScore,
      matchResult.winner === matchResult.player1Id,
  );
  await updatePlayerStats(
      matchResult.player2Id,
      matchResult.player2TotalScore,
      matchResult.winner === matchResult.player2Id,
  );
};

const updatePlayerStats =
async (playerId: string, score: number, won: boolean) => {
  const playerDoc = db.collection('teams').doc(playerId);
  const playerData = (await playerDoc.get()).data();

  await playerDoc.update({
    totalPoints: (playerData?.totalPoints || 0) + score,
    legacyPoints: (playerData?.legacyPoints || 0) + score,
    championshipWins: won ? (playerData?.championshipWins || 0) +
    1 : (playerData?.championshipWins || 0),
  });
};

export const getUserTeamData = async (userId: string) => {
  const userDoc = await db.collection('teams').doc(userId).get();
  return userDoc.exists ? userDoc.data() as { members: TeamMember[] } : null;
};

export const getMatchHistory = async (matchId: string) => {
  const matchDoc = await db.collection('matchHistory').doc(matchId).get();
  return matchDoc.exists ? matchDoc.data() : null;
};

export {db};
