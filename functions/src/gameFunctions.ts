import * as functions from 'firebase-functions';
import {
  db,
  createOngoingGame,
  updateOngoingGame,
  completeGame,
  getUserTeamData,
} from './firebaseConfig';
import {performMatch, performAttempt} from './gameRules';
import {MatchResult, AttemptResult} from './types';

export const startChampionship = functions.pubsub
    .schedule('every 7 days')
    .onRun(async (context: functions.EventContext) => {
      await runChampionship();
      return null;
    });
/**
 * Runs the championship by pairing players and starting games.
 * After all games are started, it clears the enteredChampionship collection.
 *
 * @async
 * @function runChampionship
 * @return {Promise<void>} A promise that resolves when
 * the championship has been run and the collection cleared.
 */
async function runChampionship() {
  const enteredChampionshipRef = db.collection('enteredChampionship');
  const snapshot = await enteredChampionshipRef.get();

  const players = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

  // Pair players and start games
  for (let i = 0; i < players.length; i += 2) {
    if (i + 1 < players.length) {
      await startGame(players[i].id, players[i + 1].id);
    }
  }

  // Clear the enteredChampionship collection
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

const startGame = async (player1Id: string, player2Id: string) => {
  const gameId = await createOngoingGame(player1Id, player2Id);

  // Schedule attempt executions
  for (let attempt = 1; attempt <= 72;
    attempt++) { // 12 rounds * 6 attempts per round
    await new Promise((resolve) =>
      setTimeout(resolve, 10 * 60 * 1000),
    ); // Wait 10 minutes per attempt
    await executeAttempt(gameId, attempt);
  }

  await finalizeGame(gameId);
};

const executeAttempt = async (gameId: string, attemptNumber: number) => {
  const gameDoc = await db.collection('ongoingGames').doc(gameId).get();
  const gameData = gameDoc.data();

  if (!gameData) {
    console.error(`No game data found for gameId: ${gameId}`);
    return;
  }

  const player1Team = await getUserTeamData(gameData.player1Id);
  const player2Team = await getUserTeamData(gameData.player2Id);

  if (!player1Team || !player2Team) {
    console.error('Failed to get player team data');
    return;
  }

  const roundNumber = Math.floor((attemptNumber - 1) / 6) + 1;
  const isPlayer1Attacking = Math.floor((attemptNumber - 1) / 6) % 2 === 0;

  const attackerTeam = isPlayer1Attacking ?
  player1Team.members : player2Team.members;
  const defenderTeam = isPlayer1Attacking ?
  player2Team.members : player1Team.members;

  const attacker = attackerTeam[Math.floor(Math.random() *
    attackerTeam.length)];
  const defender = defenderTeam[Math.floor(Math.random() *
    defenderTeam.length)];

  const attemptResult: AttemptResult = performAttempt(attacker, defender);

  await updateOngoingGame(gameId, {
    attemptNumber,
    roundNumber,
    attacker: attacker.id,
    defender: defender.id,
    isPlayer1Attacking,
    result: attemptResult,
  });
};

const finalizeGame = async (gameId: string) => {
  const gameDoc = await db.collection('ongoingGames').doc(gameId).get();
  const gameData = gameDoc.data();

  if (!gameData) {
    console.error(`No game data found for gameId: ${gameId}`);
    return;
  }

  const player1Team = await getUserTeamData(gameData.player1Id);
  const player2Team = await getUserTeamData(gameData.player2Id);

  if (!player1Team || !player2Team) {
    console.error('Failed to get player team data');
    return;
  }

  const matchResult = performMatch(player1Team.members, player2Team.members);

  const finalResult: MatchResult = {
    player1Id: gameData.player1Id,
    player2Id: gameData.player2Id,
    player1TotalScore: matchResult.player1TotalScore,
    player2TotalScore: matchResult.player2TotalScore,
    winner: matchResult.winner === 'player1' ?
    gameData.player1Id : gameData.player2Id,
    roundResults: matchResult.roundResults,
  };

  await completeGame(gameId, finalResult);
};

export const manuallyTriggerChampionship = functions.https.onCall(
    async (data, context) => {
    // Check if the user is an admin
      if (!context.auth || !(await isUserAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only admins can trigger the championship.',
        );
      }

      await runChampionship();
      return {message: 'Championship started successfully.'};
    },
);

export const stopChampionship =
functions.https.onCall(async (data, context) => {
  if (!context.auth || !(await isUserAdmin(context.auth.uid))) {
    throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can stop the championship.',
    );
  }

  // Stop all ongoing games
  const ongoingGamesSnapshot = await db.collection('ongoingGames').get();
  const batch = db.batch();
  ongoingGamesSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  return {message: 'Championship stopped successfully.'};
});

export const resetDatabase = functions.https.onCall(async (data, context) => {
  if (!context.auth || !(await isUserAdmin(context.auth.uid))) {
    throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can reset the database.',
    );
  }

  // Clear ongoingGames
  await clearCollection('ongoingGames');

  // Clear matchHistory
  await clearCollection('matchHistory');

  // Clear enteredChampionship
  await clearCollection('enteredChampionship');

  // Reset user stats in teams collection
  const teamsSnapshot = await db.collection('teams').get();
  const batch = db.batch();
  teamsSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      championshipWins: 0,
      totalPoints: 0,
      legacyPoints: 0,
    });
  });
  await batch.commit();

  return {message: 'Database reset successfully.'};
});

/**
 * Clears all documents from the specified Firestore collection.
 *
 * @param {string} collectionName - The name of the collection to clear.
 * @return {Promise<void>} A promise
 * that resolves when the collection is cleared.
 */
async function clearCollection(collectionName: string): Promise<void> {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

const isUserAdmin = async (userId: string): Promise<boolean> => {
  const userDoc = await db.collection('teams').doc(userId).get();
  const userData = userDoc.data();
  return userData?.isAdmin || false;
};
