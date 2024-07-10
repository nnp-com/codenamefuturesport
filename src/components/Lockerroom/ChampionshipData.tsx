import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import useAuthStore from '../../stores/useAuthStore';
import { OngoingGame, User, TeamMember } from '../../types';
import { getOngoingGames, getUserTeamData, getChampionshipStandings } from '../../lib/firebaseConfig';

interface ChampionshipComponentProps {
    teamMembers: TeamMember[];
  }
  
  const ChampionshipComponent: React.FC<ChampionshipComponentProps> = ({ teamMembers }) => {
    const router = useRouter();
    const { user, enterChampionship } = useAuthStore();
    const [currentGame, setCurrentGame] = useState<OngoingGame | null>(null);
    const [opponent, setOpponent] = useState<User | null>(null);
    const [standings, setStandings] = useState<{ userId: string; points: number; user: User | null }[]>([]);
    const [isChampionshipActive, setIsChampionshipActive] = useState(false);
  
    useEffect(() => {
      const fetchChampionshipData = async () => {
        if (user) {
          const ongoingGames = await getOngoingGames();
          const currentUserGame = ongoingGames.find(game => game.player1Id === user.uid || game.player2Id === user.uid);
          setCurrentGame(currentUserGame || null);
  
          if (currentUserGame) {
            const opponentId = currentUserGame.player1Id === user.uid ? currentUserGame.player2Id : currentUserGame.player1Id;
            const opponentData = await getUserTeamData(opponentId) as User;
            setOpponent(opponentData);
          }
  
          const standingsData = await getChampionshipStandings();
          const enhancedStandings = await Promise.all(standingsData.slice(0, 3).map(async (standing) => {
            const userData = await getUserTeamData(standing.userId) as User;
            return { ...standing, user: userData };
          }));
          setStandings(enhancedStandings);
  
          setIsChampionshipActive(ongoingGames.length > 0);
        }
      };
  
      fetchChampionshipData();
    }, [user]);
  
    const handleEnterChampionship = async () => {
      await enterChampionship();
      router.push('/lobby');
    };
  
    const handleTimeout = () => {
      // Implement timeout logic here
      console.log("Timeout requested");
    };
  
    if (!isChampionshipActive) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h2 className="text-xl font-bold mb-2">Championship</h2>
          <p>There is no active championship at the moment.</p>
        </div>
      );
    }
  
    return (
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h2 className="text-xl font-bold mb-4">Championship</h2>
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
                    <td className="border px-2 py-1 text-center">{standing.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            <div className="w-1/3 flex flex-col justify-end items-end">
                <div className="mb-2 w-60">
                    <button 
                    onClick={handleTimeout}
                    className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 cursor-not-allowed w-full"
                    disabled
                    >
                    TAKE TIME OUT
                    </button>
                    <p className="text-xs text-gray-500 mt-1 text-center">Coming Soon</p>
                </div>
                <div className="w-60">
                    <button 
                    onClick={handleEnterChampionship}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full"
                    >
                    Enter Championship HUB
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  };
  
  export default ChampionshipComponent;




