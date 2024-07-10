'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../stores/useAuthStore';
import { getEnteredPlayers, getOngoingGames } from '../../lib/firebaseConfig';
import Image from 'next/image';

interface ChampionshipResult {
    message: string;
}

const Lobby: React.FC = () => {
  const router = useRouter();
  const [enteredPlayers, setEnteredPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOngoingGames, setCheckingOngoingGames] = useState(true);

  useEffect(() => {
    const checkOngoingGamesAndFetchPlayers = async () => {
      try {
        // Check for ongoing games
        const ongoingGames = await getOngoingGames();
        if (ongoingGames.length > 0) {
          router.push('/hub');
          return;
        }
        setCheckingOngoingGames(false);

        // Fetch entered players
        const players = await getEnteredPlayers();
        setEnteredPlayers(players);
      } catch (error) {
        console.error('Error checking games or fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOngoingGamesAndFetchPlayers();
  }, [router]);

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  if (checkingOngoingGames || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">Championship Lobby</h1>
      <h3 className="mb-4 px-6 py-3">
        ... waiting for players to join
      </h3>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {enteredPlayers.length === 0 ? (
          <p>No players have entered the championship yet.</p>
        ) : (
          <ul>
            {enteredPlayers.map((player, index) => (
              <li key={index} className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center">
                  <Image
                    src={player.photoURL}
                    alt={`${player.displayName}'s profile picture`}
                    width={40}
                    height={40}
                    className="rounded-full mr-4"
                  />
                  <span className="font-semibold">{getFirstName(player.displayName)}</span>
                </div>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Ready
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Lobby;