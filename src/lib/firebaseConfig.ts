import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, deleteDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { TeamMember, Match, MatchResult } from '../types/index';

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
    });
  }
};

const getUserTeamData = async (userId: string) => {
  const userDoc = doc(db, 'teams', userId);
  const userSnapshot = await getDoc(userDoc);

  return userSnapshot.exists() ? userSnapshot.data() : null;
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

const getEnteredPlayers = async () => {
  const enteredCollection = collection(db, 'enteredChampionship');
  const enteredSnapshot = await getDocs(enteredCollection);
  
  return enteredSnapshot.docs.map(doc => doc.data());
};

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
  const ongoingGamesCollection = collection(db, 'ongoingGames');
  const gameDoc = await addDoc(ongoingGamesCollection, {
    player1Id,
    player2Id,
    startTime: new Date(),
    roundsCompleted: 0,
  });
  return gameDoc.id;
};

const updateOngoingGame = async (gameId: string, roundData: any) => {
  const gameDoc = doc(db, 'ongoingGames', gameId);
  await updateDoc(gameDoc, {
    [`rounds.${roundData.roundNumber}`]: roundData,
    roundsCompleted: roundData.roundNumber,
  });
};

const completeGame = async (gameId: string, matchResult: MatchResult) => {
  const gameDoc = doc(db, 'ongoingGames', gameId);
  const matchHistoryDoc = doc(db, 'matchHistory', gameId);

  // Move the game data to match history
  const gameData = (await getDoc(gameDoc)).data();
  await setDoc(matchHistoryDoc, {
    ...gameData,
    ...matchResult,
    endTime: new Date(),
  });

  // Remove from ongoing games
  await deleteDoc(gameDoc);

  // Update player stats
  await updatePlayerStats(matchResult.player1Id, matchResult.player1Score, matchResult.winner === matchResult.player1Id);
  await updatePlayerStats(matchResult.player2Id, matchResult.player2Score, matchResult.winner === matchResult.player2Id);
};

const updatePlayerStats = async (playerId: string, score: number, won: boolean) => {
  const playerDoc = doc(db, 'teams', playerId);
  const playerData = (await getDoc(playerDoc)).data();

  await updateDoc(playerDoc, {
    totalPoints: (playerData?.totalPoints || 0) + score,
    legacyPoints: (playerData?.legacyPoints || 0) + score,
    championshipWins: won ? (playerData?.championshipWins || 0) + 1 : (playerData?.championshipWins || 0),
  });
};

const getMatchHistory = async (matchId: string) => {
  const matchDoc = doc(db, 'matchHistory', matchId);
  const matchSnapshot = await getDoc(matchDoc);
  return matchSnapshot.exists() ? matchSnapshot.data() : null;
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
};


