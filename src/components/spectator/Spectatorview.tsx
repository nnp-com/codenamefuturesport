'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PlayerCard from '../ui/playercardHome';
import { OngoingGame, User, TeamMember, Attempt } from '../../types/index';
import Timeline from '../championship/timeline';
import CurrentAction from '../championship/CurrentAction';
import { getSpectatorGame, getUserTeamData } from '../../lib/firebaseConfig';
import useAuthStore from '../../stores/useAuthStore';

interface SpectatorViewProps {
  gameId: string;
}

const SpectatorView: React.FC<SpectatorViewProps> = ({ gameId }) => {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const [game, setGame] = useState<OngoingGame | null>(null);
  const [player1, setPlayer1] = useState<User | null>(null);
  const [player2, setPlayer2] = useState<User | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        const gameData = await getSpectatorGame(gameId);
        if (gameData) {
          setGame(gameData);
          const [p1Data, p2Data] = await Promise.all([
            getUserTeamData(gameData.player1Id),
            getUserTeamData(gameData.player2Id)
          ]);
          setPlayer1(p1Data);
          setPlayer2(p2Data);
        } else {
          setError('Game not found');
        }
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGameData();
    }
  }, [gameId, user]);

  if (loading) {
    return <div>Loading game data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!game || !player1 || !player2) {
    return <div>Game data not available</div>;
  }

  const handleBack = () => {
    if (isAdmin) {
      router.push('/control'); // Assuming '/control' is the path to your championship control component
    } else {
      router.push('/hub'); // Assuming '/hub' is the path to your Championship HUB
    }
  };

  if (loading) {
    return <div>Loading game data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!game || !player1 || !player2) {
    return <div>Game data not available</div>;
  }

  const currentRound = Math.floor(game.currentAttempt / 6) + 1;
  const currentAttemptInRound = game.currentAttempt % 6 + 1;

  const currentAttempt = Object.values(game.attempts).find(a => a.attemptNumber === game.currentAttempt);
  const activePlayer1CardId = currentAttempt ? (currentAttempt.attackingPlayerId === player1.uid ? currentAttempt.attackerCardId : currentAttempt.defenderCardId) : null;
  const activePlayer2CardId = currentAttempt ? (currentAttempt.attackingPlayerId === player2.uid ? currentAttempt.attackerCardId : currentAttempt.defenderCardId) : null;

  const renderPlayerInfo = (player: User, score: number) => {
    const isAttacking = (game.currentAttempt % 12 < 6 && player.uid === game.player1Id) ||
                        (game.currentAttempt % 12 >= 6 && player.uid === game.player2Id);
  
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center mb-2">
          <Image 
            src={player.photoURL} 
            alt={`${player.displayName}'s photo`} 
            width={40} 
            height={40} 
            className="rounded-full mr-2"
          />
          <h2 className="text-xl font-semibold">{player.displayName}</h2>
        </div>
        <p className="text-lg mb-2">Points: {score}</p>
        <div className={`px-2 py-1 rounded ${isAttacking ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {isAttacking ? 'Offense' : 'Defense'}
        </div>
      </div>
    );
  };

  const renderStackedCards = (player: User, activeCardId: string | null, alignRight: boolean) => {
    const visiblePortion = 70;
    const stackSize = 4;
    
    // Filter out the active card and take up to 4 inactive cards
    const inactiveCards = player.members
      .filter(member => member.id !== activeCardId)
      .slice(0, stackSize);
  
    return (
      <div 
        className={`relative ${alignRight ? 'items-end' : 'items-start'}`} 
        style={{ height: `${stackSize * visiblePortion}px`, width: '100%' }}
      >
        {inactiveCards.map((member, index) => (
          <div 
            key={member.id}
            className={`absolute ${alignRight ? 'right-0' : 'left-0'}`}
            style={{ 
              top: `${index * visiblePortion}px`,
              zIndex: hoveredCard === member.id ? 10 : index,
              transform: hoveredCard === member.id ? 'scale(1.1) translateY(-10px)' : 'scale(1) translateY(0)',
              transition: 'all 0.1s ease-out', // Faster transition
            }}
            onMouseEnter={() => setHoveredCard(member.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <PlayerCard 
              player={member} 
              position={member.position}
              isActive={false}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderActiveCards = () => {
    if (!currentAttempt) return null;

    const player1Card = player1.members.find(m => m.id === currentAttempt.attackerCardId || m.id === currentAttempt.defenderCardId);
    const player2Card = player2.members.find(m => m.id === currentAttempt.attackerCardId || m.id === currentAttempt.defenderCardId);

    if (!player1Card || !player2Card) return null;

    return (
      <div className="flex items-center justify-center w-full">
        <div className={`relative order-1 ${currentAttempt.attackingPlayerId === player1.uid ? 'shadow-[0_0_25px_10px_rgba(34,197,94,0.5)]' : 'shadow-[0_0_25px_10px_rgba(239,68,68,0.5)]'}`}>
          <PlayerCard player={player1Card} position={1} isActive={true} />
        </div>
        <span className="mx-4 text-2xl font-bold order-2">VS</span>
        <div className={`relative order-3 ${currentAttempt.attackingPlayerId === player2.uid ? 'shadow-[0_0_25px_10px_rgba(34,197,94,0.5)]' : 'shadow-[0_0_25px_10px_rgba(239,68,68,0.5)]'}`}>
          <PlayerCard player={player2Card} position={1} isActive={true} />
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col h-screen items-center">
    <div className="w-full flex justify-between items-center mb-6">
      <button
        onClick={handleBack}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold">Spectator View</h1>
      <div className="w-[100px]"></div> {/* This empty div balances the layout */}
    </div>
      <div className="flex flex-col items-center mb-4 w-full max-w-7xl">
      <div className="flex justify-between items-center mb-4 w-full max-w-7xl relative">
  {renderPlayerInfo(player1, game.player1Score)}
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    <h3 className="text-xl font-semibold">ROUND {currentRound}</h3>
    <p>Attempt {currentAttemptInRound}/6</p>
  </div>
  {renderPlayerInfo(player2, game.player2Score)}
</div>
      </div>

      <div className="mb-4 w-full max-w-7xl">
        <div className="flex justify-center space-x-2 mt-2 mb-4">
          {[1, 2, 3, 4, 5, 6].map((attempt) => (
            <div
              key={attempt}
              className={`w-3 h-3 rounded-full ${attempt <= currentAttemptInRound ? 'bg-blue-600' : 'bg-gray-300'}`}
            ></div>
          ))}
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(currentRound / 12) * 100}%` }}></div>
        </div>
      </div>

      <div className="flex justify-between w-full max-w-7xl mt-4 flex-grow">
        <div className="w-1/6 flex justify-start">
          {renderStackedCards(player1, activePlayer1CardId, false)}
        </div>
        <div className="w-4/6 flex flex-col justify-center items-center px-4">
          <div className="w-full mb-8 mt-8">
            {renderActiveCards()}
          </div>
          <CurrentAction attempt={latestAttempt} />
          <Timeline 
            game={game}
            player1Name={player1.displayName}
            player2Name={player2.displayName}
            onLatestAttempt={setLatestAttempt}
          />
        </div>
        <div className="w-1/6 flex justify-end">
          {renderStackedCards(player2, activePlayer2CardId, true)}
        </div>
      </div>
    </div>
  );
};

export default SpectatorView;