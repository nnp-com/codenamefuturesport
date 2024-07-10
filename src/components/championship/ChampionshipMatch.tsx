import React from 'react';
import Image from 'next/image';
import PlayerCard from '../ui/playercardHome';
import { OngoingGame, User, TeamMember, Attempt } from '../../types/index';
import useAuthStore from '../../stores/useAuthStore';
import Timeline from './timeline';

interface ChampionshipMatchProps {
  game: OngoingGame;
  player1: User;
  player2: User;
}

const ChampionshipMatch: React.FC<ChampionshipMatchProps> = ({ game, player1, player2 }) => {
  const { user } = useAuthStore();

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
    const visiblePortion = 60;
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
            className={`absolute transition-all duration-300 ease-in-out ${alignRight ? 'right-0' : 'left-0'}`}
            style={{ 
              top: `${index * visiblePortion}px`,
              zIndex: index,
            }}
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
    const currentAttempt = Object.values(game.attempts).find(a => a.attemptNumber === game.currentAttempt);
    if (!currentAttempt) return null;

    const player1Card = player1.members.find(m => m.id === currentAttempt.attackerCardId || m.id === currentAttempt.defenderCardId);
    const player2Card = player2.members.find(m => m.id === currentAttempt.attackerCardId || m.id === currentAttempt.defenderCardId);

    if (!player1Card || !player2Card) return null;

    return (
      <div className="flex items-center justify-center w-full">
        <div className="relative order-1">
          <div className={`absolute inset-0 ${currentAttempt.attackingPlayerId === player1.uid ? 'bg-green-500' : 'bg-red-500'} opacity-25 rounded-lg blur-md`}></div>
          <PlayerCard player={player1Card} position={1} isActive={true} />
        </div>
        <span className="mx-4 text-2xl font-bold order-2">VS</span>
        <div className="relative order-3">
          <div className={`absolute inset-0 ${currentAttempt.attackingPlayerId === player2.uid ? 'bg-green-500' : 'bg-red-500'} opacity-25 rounded-lg blur-md`}></div>
          <PlayerCard player={player2Card} position={1} isActive={true} />
        </div>
      </div>
    );
  };

  const sortedAttempts = Object.entries(game.attempts)
    .map(([attemptId, attempt]) => ({ ...attempt, attemptId }))
    .sort((a, b) => b.attemptNumber - a.attemptNumber);

  return (
    <div className="p-4 flex flex-col h-screen items-center">
      <div className="flex flex-col items-center mb-4 w-full max-w-7xl">
        <div className="flex justify-between items-center w-full">
          {renderPlayerInfo(player1, game.player1Score)}
          <h1 className="text-2xl font-bold">Championship Match</h1>
          {renderPlayerInfo(player2, game.player2Score)}
        </div>
        <h3 className="text-xl font-semibold mt-4">ROUND {currentRound} - Attempt {currentAttemptInRound}/6</h3>
      </div>

      <div className="mb-4 w-full max-w-7xl">
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(currentRound / 12) * 100}%` }}></div>
        </div>
        <div className="flex justify-center space-x-2 mt-2">
          {[1, 2, 3, 4, 5, 6].map((attempt) => (
            <div
              key={attempt}
              className={`w-3 h-3 rounded-full ${attempt <= currentAttemptInRound ? 'bg-blue-600' : 'bg-gray-300'}`}
            ></div>
          ))}
        </div>
      </div>

      <div className="flex justify-between w-full max-w-7xl flex-grow">
        <div className="w-1/6 flex justify-start">
          {renderStackedCards(player1, activePlayer1CardId, false)}
        </div>
        <div className="w-4/6 flex flex-col justify-center items-center px-4">
          <div className="w-full mb-8">
            {renderActiveCards()}
          </div>
          <Timeline 
            game={game}
            player1Name={player1.displayName}
            player2Name={player2.displayName}
          />
        </div>
        <div className="w-1/6 flex justify-end">
          {renderStackedCards(player2, activePlayer2CardId, true)}
        </div>
      </div>
    </div>
  );
};

export default ChampionshipMatch;