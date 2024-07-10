import React, { useState, useEffect } from 'react';
import { startChampionship, simulateChampionship, simulateRound, getChampionshipStandings } from '../../utils/championshipLogic';
import { getOngoingGames, getUserTeamData } from '../../lib/firebaseConfig';
import useAuthStore from '../../stores/useAuthStore';
import { OngoingGame, User } from '../../types/index';
import Image from 'next/image';

interface EnhancedOngoingGame extends OngoingGame {
  player1Data: User;
  player2Data: User;
}

const ChampionshipControl: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [ongoingGames, setOngoingGames] = useState<EnhancedOngoingGame[]>([]);
  const [standings, setStandings] = useState<{ userId: string; points: number; user: User | null }[]>([]);
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    fetchOngoingGames();
    fetchStandings();
  }, []);

  const renderCurrentMatchup = (game: EnhancedOngoingGame) => {
    if (game.currentAttempt === 0 || !game.attempts || Object.values(game.attempts).length === 0) {
      return null;
    }

    const currentAttempt = Object.values(game.attempts).find(a => a.attemptNumber === game.currentAttempt);
    if (!currentAttempt) return null;

    const player1Card = game.player1Data.members.find(m => m.id === currentAttempt.attackerCardId || m.id === currentAttempt.defenderCardId);
    const player2Card = game.player2Data.members.find(m => m.id === currentAttempt.attackerCardId || m.id === currentAttempt.defenderCardId);

    if (!player1Card || !player2Card) return null;

    const isPlayer1Attacking = currentAttempt.attackingPlayerId === game.player1Id;

    return (
      <p>
        Current Matchup
        <br />
        <span style={{ color: isPlayer1Attacking ? 'green' : 'red', fontWeight: 'bold' }}>
          {player1Card.name}
        </span>
        <span style={{ fontWeight: 'bold', margin: '0 5px' }}>vs</span>
        <span style={{ color: isPlayer1Attacking ? 'red' : 'green', fontWeight: 'bold' }}>
          {player2Card.name}
        </span>
      </p>
    );
  };

  const fetchOngoingGames = async () => {
    const games = await getOngoingGames();
    const enhancedGames = await Promise.all(games.map(async (game) => {
      const player1Data = await getUserTeamData(game.player1Id) as User;
      const player2Data = await getUserTeamData(game.player2Id) as User;
      return {
        ...game,
        player1Data,
        player2Data,
      };
    }));
    setOngoingGames(enhancedGames);
  };

  const fetchStandings = async () => {
    const standingsData = await getChampionshipStandings();
    const enhancedStandings = await Promise.all(standingsData.map(async (standing) => {
      const userData = await getUserTeamData(standing.userId) as User;
      return { ...standing, user: userData };
    }));
    setStandings(enhancedStandings);
  };

  const handleStartChampionship = async () => {
    if (!isAdmin) {
      setMessage('You do not have permission to start the championship.');
      return;
    }

    setIsLoading(true);
    setMessage('Starting championship...');

    try {
      await startChampionship();
      setMessage('Championship started successfully!');
      await fetchOngoingGames(); // Fetch the initial matches
      await fetchStandings();
    } catch (error) {
      console.error('Error starting championship:', error);
      setMessage('An error occurred while starting the championship.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateAttempt = async () => {
    if (!isAdmin) {
      setMessage('You do not have permission to simulate attempts.');
      return;
    }

    setIsLoading(true);
    setMessage('Simulating championship attempt...');

    try {
      await simulateChampionship();
      setMessage('Championship attempt simulated successfully!');
      await fetchOngoingGames();
      await fetchStandings();
    } catch (error) {
      console.error('Error simulating championship attempt:', error);
      setMessage('An error occurred while simulating the championship attempt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateRound = async () => {
    if (!isAdmin) {
      setMessage('You do not have permission to simulate rounds.');
      return;
    }

    setIsLoading(true);
    setMessage('Simulating championship round...');

    try {
      await simulateRound();
      setMessage('Championship round simulated successfully!');
      await fetchOngoingGames();
      await fetchStandings();
    } catch (error) {
      console.error('Error simulating championship round:', error);
      setMessage('An error occurred while simulating the championship round.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return <div>You do not have permission to access this page.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Championship Control</h1>
      <div className="space-x-4 mb-4">
        <button
          onClick={handleStartChampionship}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Starting...' : 'Start Championship'}
        </button>
        <button
          onClick={handleSimulateAttempt}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Simulating...' : 'Simulate Attempt'}
        </button>
        <button
          onClick={handleSimulateRound}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Simulating...' : 'Simulate Round'}
        </button>
      </div>
      {message && <p className="mb-4 text-red-500">{message}</p>}
      
      <h2 className="text-xl font-bold mb-2">Ongoing Games</h2>
      {ongoingGames.length === 0 ? (
        <p>No ongoing games at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ongoingGames.map((game) => (
            <div key={game.id} className="border p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">{game.arena}</h3>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Image src={game.player1Data.photoURL} alt={game.player1Data.displayName} width={40} height={40} className="rounded-full mr-2" />
                  <span>{game.player1Data.displayName}</span>
                </div>
                <span className="font-bold">{game.player1Score}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Image src={game.player2Data.photoURL} alt={game.player2Data.displayName} width={40} height={40} className="rounded-full mr-2" />
                  <span>{game.player2Data.displayName}</span>
                </div>
                <span className="font-bold">{game.player2Score}</span>
              </div>
              <p>Round: {Math.floor(game.currentAttempt / 6) + 1}, Attempt: {game.currentAttempt % 6 + 1}/6</p>
              {renderCurrentMatchup(game)}
            </div>
))}
        </div>
      )}

<h2 className="text-xl font-bold mt-6 mb-2">Championship Standings</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Player</th>
            <th className="border border-gray-300 p-2">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing) => (
            <tr key={standing.userId}>
              <td className="border border-gray-300 p-2 flex items-center">
                {standing.user && (
                  <>
                    <Image src={standing.user.photoURL} alt={standing.user.displayName} width={30} height={30} className="rounded-full mr-2" />
                    {standing.user.displayName}
                  </>
                )}
              </td>
              <td className="border border-gray-300 p-2 text-center">{standing.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChampionshipControl;