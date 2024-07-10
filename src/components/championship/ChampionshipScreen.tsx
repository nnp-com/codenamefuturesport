'use client';

import React, { useEffect, useState } from 'react';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import { db, getUserTeamData } from '../../lib/firebaseConfig';
import { OngoingGame, User } from '../../types/index';
import ChampionshipMatch from './ChampionshipMatch';
import useAuthStore from '../../stores/useAuthStore';

const ChampionshipScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [currentGame, setCurrentGame] = useState<OngoingGame | null>(null);
  const [player1Data, setPlayer1Data] = useState<User | null>(null);
  const [player2Data, setPlayer2Data] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setError("No user logged in");
      setLoading(false);
      return;
    }

    const fetchUserGame = async () => {
      const ongoingGamesRef = collection(db, 'ongoingGames');
      const q = query(
        ongoingGamesRef,
        where('player1Id', '==', user.uid),
        where('isComplete', '==', false)
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        if (!querySnapshot.empty) {
          const gameDoc = querySnapshot.docs[0];
          const gameData = { id: gameDoc.id, ...gameDoc.data() } as OngoingGame;

          setCurrentGame(gameData);

          try {
            const p1Data = await getUserTeamData(gameData.player1Id) as User;
            const p2Data = await getUserTeamData(gameData.player2Id) as User;

            setPlayer1Data(p1Data);
            setPlayer2Data(p2Data);
          } catch (error) {
            console.error("Error fetching player data:", error);
            setError("Failed to load player data");
          }
        } else {
          setCurrentGame(null);
          setPlayer1Data(null);
          setPlayer2Data(null);
          setError("No ongoing games found");
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching ongoing games:", error);
        setError("Failed to load game data");
        setLoading(false);
      });

      return unsubscribe;
    };

    fetchUserGame();
  }, [user]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  if (!currentGame || !player1Data || !player2Data) {
    return <div className="text-center mt-8">No current match. Please check back later.</div>;
  }

  return (
    <ChampionshipMatch
      game={currentGame}
      player1={player1Data}
      player2={player2Data}
    />
  );
};

export default ChampionshipScreen;