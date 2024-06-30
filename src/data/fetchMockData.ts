import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebaseConfig';
import { User, MatchPlayer, Match, TeamMember, Round, RoundEvent } from '../types/index';

const getRandomOpponent = (users: User[], excludeUserId: string): User => {
  const filteredUsers = users.filter(user => user.uid !== excludeUserId);
  const randomIndex = Math.floor(Math.random() * filteredUsers.length);
  return filteredUsers[randomIndex];
};

const getRandomTeamMember = (team: TeamMember[]): TeamMember => {
  const randomIndex = Math.floor(Math.random() * team.length);
  return team[randomIndex];
};

const generateMockRoundEvents = (attacker: TeamMember, defender: TeamMember): RoundEvent[] => {
  const events: RoundEvent[] = [
    {
      points: Math.floor(Math.random() * 50) + 10,
      description: `${attacker.name} launches a powerful ${attacker.sport} move against ${defender.name}!`
    },
    {
      points: Math.floor(Math.random() * 30) + 5,
      description: `${defender.name} tries to block, but ${attacker.name} scores again!`
    }
  ];
  return events;
};

export const fetchMockChampionshipData = async (): Promise<{ mockMatch: Match; users: User[] }> => {
  try {
    console.log('Fetching mock championship data...');
    const querySnapshot = await getDocs(collection(db, 'teams'));
    const users: User[] = querySnapshot.docs.map(doc => ({
      uid: doc.id,
      displayName: doc.data().displayName,
      photoURL: doc.data().photoURL || '',  // Include photoURL
      team: doc.data().members || [],
      championshipWins: doc.data().championshipWins || 0,
      totalPoints: doc.data().totalPoints || 0,
      legacyPoints: doc.data().legacyPoints || 0,
    }));

    console.log('Users fetched:', users);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    console.log('Current user:', currentUser);

    const loggedInUser = users.find(user => user.uid === currentUser.uid);
    if (!loggedInUser) {
      throw new Error('Logged in user not found in database');
    }

    console.log('Logged in user:', loggedInUser);

    if (users.length < 2) {
      throw new Error('Not enough users to create a championship match');
    }

    const opponent = getRandomOpponent(users, loggedInUser.uid);

    const attacker = getRandomTeamMember(loggedInUser.team);
    const defender = getRandomTeamMember(opponent.team);

    const mockRound: Round = {
      number: 1,
      attacker,
      defender,
      events: generateMockRoundEvents(attacker, defender),
      flavorText: `${attacker.name} is facing off against ${defender.name} in an intense ${attacker.sport} showdown!`
    };

    const mockMatch: Match = {
      player1: {
        ...loggedInUser,
        roundsWon: [true, false, true, false, false, false, false, false, false, false, false, false],
        totalPoints: 100
      },
      player2: {
        ...opponent,
        roundsWon: [false, true, false, true, true, false, false, false, false, false, false, false],
        totalPoints: 75
      },
      currentRound: mockRound
    };

    console.log('Mock match created:', mockMatch);

    return { mockMatch, users };
  } catch (error) {
    console.error('Error fetching mock championship data:', error);
    throw error;
  }
};