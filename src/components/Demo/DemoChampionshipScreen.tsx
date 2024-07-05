'use client';

import React, { useEffect, useState } from 'react';
import { fetchMockChampionshipData } from '../../data/fetchMockData';
import { Match, TeamMember, RoundEvent, Sport } from '../../types/index';
import ChampionshipMatch from './DemoChampionshipMatch';
import useAuthStore from '../../stores/useAuthStore';
import { getFlavorText, getRandomEvent } from '../../utils/flavorTextUtils';

const ChampionshipScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  const generateMockRoundEvents = (attacker: TeamMember, defender: TeamMember): RoundEvent[] => {
    const events: RoundEvent[] = [];
    for (let i = 0; i < 4; i++) {  // Generate 4 events per round
      const event = getRandomEvent(attacker.sport);
      const isSuccessful = Math.random() > 0.5;  // 50% chance of success
      const { text, points } = getFlavorText(attacker.sport, defender.sport, isSuccessful, event);
      events.push({
        points: isSuccessful ? points : 0,
        description: text.replace('[Player One]', attacker.name).replace('[Player Two]', defender.name)
      });
    }
    return events;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...');
        const { mockMatch } = await fetchMockChampionshipData();
        console.log('Data fetched:', mockMatch);

        // Generate new events using the flavor text
        const newEvents = generateMockRoundEvents(mockMatch.currentRound.attacker, mockMatch.currentRound.defender);
        const updatedMatch: Match = {
          ...mockMatch,
          currentRound: {
            ...mockMatch.currentRound,
            events: newEvents
          }
        };

        setCurrentMatch(updatedMatch);
      } catch (error) {
        console.error('Error fetching mock championship data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      console.log('User found:', user);
      fetchData();
    } else {
      console.log('No user found');
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentMatch) {
    return <div>No current match. Please check back later.</div>;
  }

  return <ChampionshipMatch currentMatch={currentMatch} />;
};

export default ChampionshipScreen;


// import React, { useEffect, useState } from 'react';
// import { useAuthStore } from '../stores/useAuthStore';
// import { db } from '../lib/firebaseConfig';
// import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';

// interface Matchup {
//   player1: { userId: string; teamId: string };
//   player2: { userId: string; teamId: string };
//   startTime: FirebaseFirestore.Timestamp;
//   endTime: FirebaseFirestore.Timestamp;
//   currentRound: number;
//   currentAttempt: number;
//   player1Score: number;
//   player2Score: number;
//   rounds: Round[];
// }

// interface Round {
//   attempts: Attempt[];
// }

// interface Attempt {
//   attackingPlayer: string;
//   defendingPlayer: string;
//   attackingCard: string;
//   defendingCard: string;
//   score: number;
//   winner: 'player1' | 'player2';
//   flavorText: string;
// }

// const ChampionshipScreen: React.FC = () => {
//   const { user } = useAuthStore();
//   const [activeMatchup, setActiveMatchup] = useState<Matchup | null>(null);

//   useEffect(() => {
//     if (!user) return;

//     const championshipRef = doc(db, 'championships', 'current');
//     const matchupsRef = collection(championshipRef, 'matchups');
    
//     const q = query(
//       matchupsRef,
//       where('endTime', '>', new Date()),
//       where('player1.userId', '==', user.uid)
//     );

//     const unsubscribe = onSnapshot(q, (querySnapshot) => {
//       if (!querySnapshot.empty) {
//         setActiveMatchup(querySnapshot.docs[0].data() as Matchup);
//       } else {
//         setActiveMatchup(null);
//       }
//     });

//     return () => unsubscribe();
//   }, [user]);

//   if (!activeMatchup) {
//     return <div>No active matchup found.</div>;
//   }

//   const isPlayer1 = activeMatchup.player1.userId === user?.uid;
//   const currentPlayer = isPlayer1 ? activeMatchup.player1 : activeMatchup.player2;
//   const opponentPlayer = isPlayer1 ? activeMatchup.player2 : activeMatchup.player1;
//   const currentRound = activeMatchup.rounds[activeMatchup.currentRound - 1] || { attempts: [] };

//   return (
//     <div className="championship-screen">
//       <h1>Championship</h1>
//       <div className="matchup-info">
//         <h2>Current Matchup</h2>
//         <p>Round: {activeMatchup.currentRound}</p>
//         <p>Attempt: {activeMatchup.currentAttempt}</p>
//         <p>Score: {activeMatchup.player1Score} - {activeMatchup.player2Score}</p>
//       </div>
//       <div className="players-container">
//         <div className="player-cards">
//           {/* TODO: Display player cards */}
//         </div>
//         <div className="active-cards">
//           {/* TODO: Display active cards */}
//         </div>
//         <div className="opponent-cards">
//           {/* TODO: Display opponent cards */}
//         </div>
//       </div>
//       <div className="round-info">
//         <h3>Current Round</h3>
//         <p>Attacking: {activeMatchup.currentRound % 2 === 1 ? 'Player 1' : 'Player 2'}</p>
//         <div className="attempts">
//           {currentRound.attempts.map((attempt, index) => (
//             <div key={index} className="attempt">
//               <p>{attempt.flavorText}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChampionshipScreen;