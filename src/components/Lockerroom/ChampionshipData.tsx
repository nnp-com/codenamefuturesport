'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import useAuthStore from '../../stores/useAuthStore';
import { OngoingGame, User, TeamMember, StandingsEntry } from '../../types';
import { getOngoingGames, getUserTeamData, getChampionshipStandings, isUserInChampionship } from '../../lib/firebaseConfig';

interface ChampionshipComponentProps {
  teamMembers: TeamMember[];
}

const ChampionshipComponent: React.FC<ChampionshipComponentProps> = ({ teamMembers }) => {
  const router = useRouter();
  const { user, enterChampionship } = useAuthStore();
  const [currentGame, setCurrentGame] = useState<OngoingGame | null>(null);
  const [opponent, setOpponent] = useState<User | null>(null);
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [isChampionshipActive, setIsChampionshipActive] = useState(false);
  const [hasEnteredChampionship, setHasEnteredChampionship] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchChampionshipData = async () => {
      if (user) {
        const userEnteredChampionship = await isUserInChampionship(user.uid);
        setHasEnteredChampionship(userEnteredChampionship);

        const ongoingGames = await getOngoingGames();
        setIsChampionshipActive(ongoingGames.length > 0);

        if (userEnteredChampionship && ongoingGames.length > 0) {
          const currentUserGame = ongoingGames.find(game => game.player1Id === user.uid || game.player2Id === user.uid);
          setCurrentGame(currentUserGame || null);

          if (currentUserGame) {
            const opponentId = currentUserGame.player1Id === user.uid ? currentUserGame.player2Id : currentUserGame.player1Id;
            const opponentData = await getUserTeamData(opponentId) as User;
            setOpponent(opponentData);
          }

          const standingsData = await getChampionshipStandings();
          setStandings(standingsData.detailed.slice(0, 3)); // Only take top 3
        }
      }
    };

    fetchChampionshipData();
  }, [user]);

  const handleEnterChampionship = async () => {
    if (teamMembers.length === 0) {
      alert("Please select a team before entering the championship.");
      return;
    }
    setShowModal(true);
  };

  const confirmEnterChampionship = async () => {
    await enterChampionship();
    setHasEnteredChampionship(true);
    setShowModal(false);
  };

  const handleEnterHub = () => {
    router.push('/hub');
  };

  const handleViewLobby = () => {
    router.push('/lobby');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h2 className="text-xl font-bold mb-4">Championship</h2>
      {!hasEnteredChampionship ? (
        <div className="text-center">
          <p className="mb-4">Think your team has what it takes? <br/><span className="font-bold">Prove it! </span><br/>Join the Championship and let’s see if you can rise to the top!</p>
          <button 
            onClick={handleEnterChampionship}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Enter Championship
          </button>
        </div>
      ) : !isChampionshipActive ? (
        <div className="text-center">
          <p className="mb-4">Waiting for the championship to start...</p>
          <button 
            onClick={handleViewLobby}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            View Lobby
          </button>
        </div>
      ) : (
        <div className="flex justify-between">
          <div className="w-1/3">
            <h3 className="font-semibold mb-2 underline">Current Match</h3>
            {currentGame && opponent ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  <Image src={user?.photoURL || '/default-avatar.png'} alt={user?.displayName || 'You'} width={40} height={40} className="rounded-full mr-2" />
                  <span>{user?.displayName || 'You'}</span>
                </div>
                <span className="my-1 font-bold">VS</span>
                <div className="flex items-center mt-2">
                  <Image src={opponent.photoURL || '/default-avatar.png'} alt={opponent.displayName} width={40} height={40} className="rounded-full mr-2" />
                  <span>{opponent.displayName}</span>
                </div>
              </div>
            ) : (
              <p>No current match</p>
            )}
          </div>
          <div className="w-1/3">
            <h3 className="font-semibold mb-2 underline">Top 3 Standings</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Pos</th>
                  <th className="border px-2 py-1">Player</th>
                  <th className="border px-2 py-1">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr key={standing.userId}>
                    <td className="border px-2 py-1 text-center">{index + 1}</td>
                    <td className="border px-2 py-1">
                      <div className="flex items-center">
                        <Image src={standing.user?.photoURL || '/default-avatar.png'} alt={standing.user?.displayName || `Player ${index + 1}`} width={30} height={30} className="rounded-full mr-2" />
                        <span>{standing.user?.displayName || `Player ${index + 1}`}</span>
                      </div>
                    </td>
                    <td className="border px-2 py-1 text-center">{standing.stats.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="w-1/3 flex flex-col justify-end items-end">
            <div className="w-60">
              <button 
                onClick={handleEnterHub}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full"
              >
                Enter Championship HUB
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded">
            <h2 className="text-xl font-bold mb-4">Enter Championship</h2>
            <p>Are you sure you want to enter the championship with your current team?</p>
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setShowModal(false)}
                className="mr-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={confirmEnterChampionship}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChampionshipComponent;