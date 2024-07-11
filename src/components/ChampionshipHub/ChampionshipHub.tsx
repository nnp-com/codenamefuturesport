import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getOngoingGames, getUserTeamData, getChampionshipStandings, getUserStats } from '../../lib/firebaseConfig';
import { OngoingGame, User, UserStats, StandingsEntry } from '../../types';
import useAuthStore from '../../stores/useAuthStore';

interface EnhancedOngoingGame extends OngoingGame {
    player1Data: User;
    player2Data: User;
  }

  const ChampionshipHub: React.FC = () => {
    const router = useRouter();
    const { user } = useAuthStore();
    const [currentGame, setCurrentGame] = useState<EnhancedOngoingGame | null>(null);
    const [standings, setStandings] = useState<StandingsEntry[]>([]);
    const [ongoingGames, setOngoingGames] = useState<EnhancedOngoingGame[]>([]);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
  
    useEffect(() => {
      const fetchData = async () => {
        if (user) {
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
  
          const userGame = enhancedGames.find(game => game.player1Id === user.uid || game.player2Id === user.uid);
          setCurrentGame(userGame || null);
          setOngoingGames(enhancedGames.filter(game => game.id !== userGame?.id));
  
          const standingsData = await getChampionshipStandings();
          setStandings(standingsData.detailed);
  
          const userStatsData = await getUserStats(user.uid);
          setUserStats(userStatsData);
        }
      };
  
      fetchData();
    }, [user]);
  
    const renderCurrentMatch = () => {
      if (!currentGame) return null;
  
      const currentRound = Math.floor(currentGame.currentAttempt / 6) + 1;
      const currentAttemptInRound = currentGame.currentAttempt % 6 + 1;
      const currentAttempt = Object.values(currentGame.attempts).find(a => a.attemptNumber === currentGame.currentAttempt);
      const isUserAttacking = currentAttempt?.attackingPlayerId === user?.uid;
  
      const userIsPlayer1 = currentGame.player1Id === user?.uid;
      const userPlayer = userIsPlayer1 ? currentGame.player1Data : currentGame.player2Data;
      const opponentPlayer = userIsPlayer1 ? currentGame.player2Data : currentGame.player1Data;
  
      return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h2 className="text-xl font-bold mb-4">My Current Match</h2>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center">
              <Image src={userPlayer.photoURL || '/default-avatar.png'} alt={userPlayer.displayName} width={60} height={60} className="rounded-full mb-2" />
              <span className="font-semibold">{userPlayer.displayName}</span>
              <span className={`px-2 py-1 rounded mt-1 ${isUserAttacking ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {isUserAttacking ? 'Attacker' : 'Defender'}
              </span>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                <span className="mr-2">{currentGame.player1Score}</span>
                <span>:</span>
                <span className="ml-2">{currentGame.player2Score}</span>
              </div>
              <p className="text-sm">Round: {currentRound}, Attempt: {currentAttemptInRound}/6</p>
            </div>
            <div className="flex flex-col items-center">
              <Image src={opponentPlayer.photoURL || '/default-avatar.png'} alt={opponentPlayer.displayName} width={60} height={60} className="rounded-full mb-2" />
              <span className="font-semibold">{opponentPlayer.displayName}</span>
              <span className={`px-2 py-1 rounded mt-1 ${!isUserAttacking ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {!isUserAttacking ? 'Attacker' : 'Defender'}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push('/championship')}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full"
          >
            View Match
          </button>
        </div>
      );
    };
  
  const renderStandings = () => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4 mt-8">
      <h2 className="text-xl font-bold mb-2">Standings</h2>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Position</th>
            <th className="p-2 text-left">Player</th>
            <th className="p-2 text-center">Matches Played</th>
            <th className="p-2 text-center">Wins</th>
            <th className="p-2 text-center">Losses</th>
            <th className="p-2 text-center">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => (
            <tr key={standing.userId} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="p-2">{index + 1}</td>
              <td className="p-2 flex items-center">
                <Image src={standing.user?.photoURL || '/default-avatar.png'} alt={standing.user?.displayName || 'Player'} width={30} height={30} className="rounded-full mr-2" />
                <span>{standing.user?.displayName || 'Unknown Player'}</span>
              </td>
              <td className="p-2 text-center">{standing.stats.totalGamesPlayed}</td>
              <td className="p-2 text-center">{standing.stats.gameWins}</td>
              <td className="p-2 text-center">{standing.stats.gameLosses}</td>
              <td className="p-2 text-center">{standing.stats.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
    const renderOngoingMatches = () => (
      <div className="bg-white p-4 rounded-lg shadow-md mb-4 mt-8">
        <h2 className="text-xl font-bold mb-2">Ongoing Matches</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ongoingGames.map((game) => (
            <div key={game.id} className="border p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">{game.arena}</h3>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Image src={game.player1Data.photoURL || '/default-avatar.png'} alt={game.player1Data.displayName} width={40} height={40} className="rounded-full mr-2" />
                  <span>{game.player1Data.displayName}</span>
                </div>
                <span className="font-bold">{game.player1Score}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Image src={game.player2Data.photoURL || '/default-avatar.png'} alt={game.player2Data.displayName} width={40} height={40} className="rounded-full mr-2" />
                  <span>{game.player2Data.displayName}</span>
                </div>
                <span className="font-bold">{game.player2Score}</span>
              </div>
              <p>Round: {Math.floor(game.currentAttempt / 6) + 1}, Attempt: {game.currentAttempt % 6 + 1}/6</p>
              {renderCurrentMatchup(game)}
            </div>
          ))}
        </div>
      </div>
    );
  
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
          Current Matchup:
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
  
    const renderMatchHistory = () => (
      <div className="bg-white p-4 rounded-lg shadow-md mt-8">
        <h2 className="text-xl font-bold mb-2">Match History</h2>
        <p>Coming soon</p>
        {/* Implement match history here when data is available */}
      </div>
    );

    // const renderUserStats = () => {
    //     if (!userStats) return null;
    
    //     return (
    //       <div className="bg-white p-4 rounded-lg shadow-md mb-4">
    //         <h2 className="text-xl font-bold mb-2">Your Stats</h2>
    //         <p>Championship Wins: {userStats.championshipWins}</p>
    //         <p>Game Wins: {userStats.gameWins}</p>
    //         <p>Game Losses: {userStats.gameLosses}</p>
    //         <p>Total Games Played: {userStats.totalGamesPlayed}</p>
    //         <p>Win Rate: {((userStats.gameWins / userStats.totalGamesPlayed) * 100).toFixed(2)}%</p>
    //       </div>
    //     );
    //   };
  
    return (
        <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">Championship HUB</h1>
        {/* {renderUserStats()} */}
        {renderCurrentMatch()}
        {renderStandings()}
        {renderOngoingMatches()}
        {/* renderMatchHistory() */}
      </div>
    );
  };
  
  export default ChampionshipHub;