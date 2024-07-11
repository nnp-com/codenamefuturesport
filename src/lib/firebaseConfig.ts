import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, deleteDoc, getDocs, updateDoc, query, where, Timestamp, increment, writeBatch } from 'firebase/firestore';
import { TeamMember, MatchResult, Attempt, OngoingGame, AttemptResult, ChampionshipState, User, UserStats, StandingsEntry } from '../types/index';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const initializeUserInFirestore = async (userId: string, email: string, displayName: string, photoURL: string) => {
  const userDoc = doc(db, 'teams', userId);
  const userSnapshot = await getDoc(userDoc);

  if (!userSnapshot.exists()) {
    await setDoc(userDoc, {
      email,
      displayName,
      photoURL,
      members: [],
      isAdmin: false,
      championshipWins: 0,
      totalPoints: 0,
      legacyPoints: 0,
      bot: false,
      timeOut: true,
    });
  }
};

const getUserTeamData = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'teams', userId));
  if (userDoc.exists()) {
    return { uid: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
};

const updateUserTeamData = async (userId: string, teamMembers: TeamMember[]) => {
  const userDoc = doc(db, 'teams', userId);
  await updateDoc(userDoc, {
    members: teamMembers,
  });
};

const checkAdminStatus = async (userId: string) => {
  const userDoc = doc(db, 'teams', userId);
  const userSnapshot = await getDoc(userDoc);
  
  if (userSnapshot.exists()) {
    const userData = userSnapshot.data();
    return userData?.isAdmin || false;
  }
  return false;
};


// CURRENT ADMIN with Email
const setAdminStatus = async (userId: string, email: string) => {
  const adminEmails = ['simon@nevernotplay.com']; 
  const isAdmin = adminEmails.includes(email);
  const userDoc = doc(db, 'teams', userId);
  
  await setDoc(userDoc, { isAdmin }, { merge: true });
};

const addUserToLobby = async (userId: string) => {
  const lobbyDoc = doc(db, 'lobby', userId);
  await setDoc(lobbyDoc, {
    userId,
    joinedAt: new Date(),
  });
};

const checkChampionshipStatus = async () => {
  const championshipsCollection = collection(db, 'championships');
  const q = query(championshipsCollection, where('isActive', '==', true));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }

  return null;
};

const enterChampionship = async (userId: string) => {
  const userDoc = doc(db, 'teams', userId);
  const userSnapshot = await getDoc(userDoc);

  if (userSnapshot.exists()) {
    await setDoc(doc(db, 'enteredChampionship', userId), {
      ...userSnapshot.data(),
      userId,
      enteredAt: new Date(),
    });
  }
};

// const getWaitingListPlayers = async () => {
//   const waitingListRef = collection(db, 'waitingList');
//   const waitingListSnapshot = await getDocs(waitingListRef);
//   return waitingListSnapshot.docs.map(doc => doc.data());
// };

// const moveWaitingListToEntered = async () => {
//   const waitingListRef = collection(db, 'waitingList');
//   const waitingListSnapshot = await getDocs(waitingListRef);
  
//   const batch = writeBatch(db);
  
//   waitingListSnapshot.docs.forEach((waitingDoc) => {
//     const data = waitingDoc.data();
//     const newEnteredRef = doc(db, 'enteredChampionship', data.userId);
//     batch.set(newEnteredRef, data);
//     batch.delete(waitingDoc.ref);
//   });

//   await batch.commit();
// };



const getBotUsers = async () => {
  const q = query(collection(db, 'teams'), where('bot', '==', true));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const createBotUser = async (displayName: string, teamMembers: TeamMember[]) => {
  const botId = `bot_${Date.now()}`;
  const botEmail = 'bot@game.com';

  await setDoc(doc(db, 'teams', botId), {
    displayName,
    email: botEmail,
    members: teamMembers,
    isAdmin: false,
    championshipWins: 0,
    totalPoints: 0,
    legacyPoints: 0,
    photoURL: 'https://png.pngtree.com/png-vector/20220718/ourmid/pngtree-chat-bot-icon-vector-png-image_5570063.png',
    bot: true,
  });

  return botId;
};

const deleteBotUser = async (userId: string) => {
  // Check if the bot user is entered in the championship
  const enteredChampionshipDoc = doc(db, 'enteredChampionship', userId);
  const enteredChampionshipSnapshot = await getDoc(enteredChampionshipDoc);

  // If the bot user is entered in the championship, remove them
  if (enteredChampionshipSnapshot.exists()) {
    await deleteDoc(enteredChampionshipDoc);
  }

  // Delete the bot user from the teams collection
  await deleteDoc(doc(db, 'teams', userId));
};

const createOngoingGame = async (player1Id: string, player2Id: string): Promise<string> => {
  console.log('Creating ongoing game for players:', player1Id, player2Id);
  if (!player1Id || !player2Id) {
    console.error('Invalid player IDs:', player1Id, player2Id);
    throw new Error('Invalid player IDs');
  }

  try {
    const ongoingGamesCollection = collection(db, 'ongoingGames');
    const gameDoc = await addDoc(ongoingGamesCollection, {
      player1Id,
      player2Id,
      startTime: Timestamp.now(),
      currentAttempt: 0,
      currentRound: 1,
      player1Score: 0,
      player2Score: 0,
      attempts: {},
      isComplete: false,
      player1IsAttacker: true, // Player 1 starts as attacker
      activeAttacker: '',
      activeDefender: '',
      arena: `Arena ${(await getDocs(ongoingGamesCollection)).size + 1}`
    });
    console.log('Created ongoing game with ID:', gameDoc.id);
    return gameDoc.id;
  } catch (error) {
    console.error('Error creating ongoing game:', error);
    throw error;
  }
};

const getEnteredPlayers = async () => {
  const enteredCollection = collection(db, 'enteredChampionship');
  const enteredSnapshot = await getDocs(enteredCollection);
  
  const players = enteredSnapshot.docs.map(doc => {
    const data = doc.data();
    return { ...data, uid: doc.id };
  });
  return players;
};

const updateOngoingGame = async (gameId: string, attempt: Attempt) => {
  const gameDoc = doc(db, 'ongoingGames', gameId);
  const gameData = await getOngoingGame(gameId);

  if (!gameData) {
    throw new Error(`No game data found for gameId: ${gameId}`);
  }

  const playerScoreField = attempt.attackingPlayerId === gameData.player1Id ? 'player1Score' : 'player2Score';

  await updateDoc(gameDoc, {
    currentAttempt: attempt.attemptNumber,
    currentRound: attempt.roundNumber,
    [`attempts.${attempt.attemptId}`]: attempt,
    [playerScoreField]: increment(attempt.result.points),
  });
};

const updatePlayerStats = async (playerId: string, score: number, won: boolean) => {
  const playerDoc = doc(db, 'teams', playerId);
  await updateDoc(playerDoc, {
    totalPoints: increment(score),
    legacyPoints: increment(score),
    gameWins: increment(won ? 1 : 0),
    gameLosses: increment(won ? 0 : 1),
    totalGamesPlayed: increment(1),
  });
};

const getUserStats = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'teams', userId));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    return {
      championshipWins: userData.championshipWins ?? 0,
      gameWins: userData.gameWins ?? 0,
      gameLosses: userData.gameLosses ?? 0,
      totalGamesPlayed: userData.totalGamesPlayed ?? 0,
      totalPoints: userData.totalPoints ?? 0,
    };
  }
  // Return default values if the document doesn't exist
  return {
    championshipWins: 0,
    gameWins: 0,
    gameLosses: 0,
    totalGamesPlayed: 0,
    totalPoints: 0,
  };
};

const isUserInChampionship = async (userId: string): Promise<boolean> => {
  const enteredChampionshipRef = doc(db, 'enteredChampionship', userId);
  const enteredChampionshipDoc = await getDoc(enteredChampionshipRef);
  return enteredChampionshipDoc.exists();
};

const enterChampionshipWaitlist = async (userId: string): Promise<void> => {
  await addDoc(collection(db, 'waitingList'), {
    userId,
    enteredAt: Timestamp.now(),
  });
};

export const isUserInWaitlist = async (userId: string): Promise<boolean> => {
  const waitlistRef = collection(db, 'waitingList');
  const q = query(waitlistRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

const updateChampionshipWin = async (winnerId: string) => {
  const playerDoc = doc(db, 'teams', winnerId);
  await updateDoc(playerDoc, {
    championshipWins: increment(1),
  });
};

const completeGame = async (gameId: string, matchResult: MatchResult) => {
  const gameDoc = doc(db, 'ongoingGames', gameId);

  // Mark the game as complete
  await updateDoc(gameDoc, { 
    isComplete: true,
    endTime: Timestamp.now(),
    winner: matchResult.winner,
    player1TotalScore: matchResult.player1TotalScore,
    player2TotalScore: matchResult.player2TotalScore,
  });

  // Update player stats
  await updatePlayerStats(matchResult.player1Id, matchResult.player1TotalScore, matchResult.winner === matchResult.player1Id);
  await updatePlayerStats(matchResult.player2Id, matchResult.player2TotalScore, matchResult.winner === matchResult.player2Id);
};

const addMatchToHistory = async (matchResult: MatchResult) => {
  const matchHistoryCollection = collection(db, 'matchHistory');
  await addDoc(matchHistoryCollection, {
    ...matchResult,
    timestamp: Timestamp.now(),
  });
};

export const getOngoingGame = async (gameId: string): Promise<OngoingGame | null> => {
  const gameDoc = await getDoc(doc(db, 'ongoingGames', gameId));
  if (gameDoc.exists()) {
    return { id: gameDoc.id, ...gameDoc.data() } as OngoingGame;
  }
  return null;
};

const getOngoingGames = async (): Promise<OngoingGame[]> => {
  const gamesCollection = collection(db, 'ongoingGames');
  const q = query(gamesCollection, where('isComplete', '==', false));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OngoingGame));
};

const getMatchHistory = async (matchId: string) => {
  const matchDoc = doc(db, 'matchHistory', matchId);
  const matchSnapshot = await getDoc(matchDoc);
  return matchSnapshot.exists() ? matchSnapshot.data() : null;
};

const getAllCompletedMatches = async (): Promise<MatchResult[]> => {
  const q = query(collection(db, 'matchHistory'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as MatchResult);
};

const updateChampionshipState = async (state: ChampionshipState) => {
  const stateDoc = doc(db, 'championshipState', 'current');
  await setDoc(stateDoc, state, { merge: true });
};


const getChampionshipState = async (): Promise<ChampionshipState> => {
  const stateDoc = await getDoc(doc(db, 'championshipState', 'current'));
  if (stateDoc.exists()) {
    return stateDoc.data() as ChampionshipState;
  } else {
    return {
      currentStage: 0,
      matchesPlayed: [],
      remainingMatches: {},
      isFinished: true,
      standings: []
    };
  }
};

const getChampionshipStandings = async (): Promise<{
  detailed: StandingsEntry[];
  simplified: { userId: string; points: number; }[];
}> => {
  const players = await getEnteredPlayers() as User[];
  let standings: StandingsEntry[] = await Promise.all(players.map(async (player) => {
    const userData = await getUserTeamData(player.uid) as User;
    const userStats = await getUserStats(player.uid);
    return {
      userId: player.uid,
      user: userData,
      stats: {
        championshipWins: userStats?.championshipWins ?? 0,
        gameWins: userStats?.gameWins ?? 0,
        gameLosses: userStats?.gameLosses ?? 0,
        totalGamesPlayed: userStats?.totalGamesPlayed ?? 0,
        totalPoints: 0, // We'll calculate this from completed matches
      },
    };
  }));

  const completedMatches = await getAllCompletedMatches();

  for (const match of completedMatches) {
    const player1Standing = standings.find(s => s.userId === match.player1Id);
    const player2Standing = standings.find(s => s.userId === match.player2Id);

    if (player1Standing) player1Standing.stats.totalPoints += match.player1TotalScore;
    if (player2Standing) player2Standing.stats.totalPoints += match.player2TotalScore;
  }

  standings.sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);

  const simplifiedStandings = standings.map(s => ({
    userId: s.userId,
    points: s.stats.totalPoints
  }));

  return {
    detailed: standings,
    simplified: simplifiedStandings
  };
};

const deleteOngoingGame = async (gameId: string): Promise<void> => {
  await deleteDoc(doc(db, 'ongoingGames', gameId));
};

const clearOngoingGames = async (): Promise<void> => {
  const ongoingGamesRef = collection(db, 'ongoingGames');
  const ongoingGamesSnapshot = await getDocs(ongoingGamesRef);
  const batch = writeBatch(db);

  ongoingGamesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
  });

  await batch.commit();
};

const clearMatchHistory = async (): Promise<void> => {
  const matchHistoryRef = collection(db, 'matchHistory');
  const matchHistorySnapshot = await getDocs(matchHistoryRef);
  const batch = writeBatch(db);

  matchHistorySnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

const resetPlayerStats = async (playerId: string): Promise<void> => {
  const playerRef = doc(db, 'teams', playerId);
  await updateDoc(playerRef, {
    championshipWins: 0,
    gameWins: 0,
    gameLosses: 0,
    totalGamesPlayed: 0,
    totalPoints: 0,
    legacyPoints: 0,
  });
};


export {
  auth,
  db,
  initializeUserInFirestore,
  getUserTeamData,
  updateUserTeamData,
  checkAdminStatus,
  setAdminStatus,
  addUserToLobby,
  checkChampionshipStatus,
  enterChampionship,
  getEnteredPlayers,
  getBotUsers,
  createBotUser,
  deleteBotUser,
  createOngoingGame,
  updateOngoingGame,
  completeGame,
  addMatchToHistory,
  getMatchHistory,
  getOngoingGames,
  getAllCompletedMatches,
  getChampionshipStandings,
  updatePlayerStats,
  updateChampionshipState,
  getChampionshipState,
  deleteOngoingGame,
  clearMatchHistory,
  resetPlayerStats,
  clearOngoingGames,
  updateChampionshipWin,
  getUserStats,
  // getWaitingListPlayers,
  // moveWaitingListToEntered,
  isUserInChampionship,
  enterChampionshipWaitlist,
};