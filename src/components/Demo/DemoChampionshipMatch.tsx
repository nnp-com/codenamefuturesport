import React from 'react';
import PlayerCard from '../ui/playercardHome';
import { Match, TeamMember } from '../../types/index';
import useAuthStore from '../../stores/useAuthStore';

interface ChampionshipMatchProps {
  currentMatch: Match;
}

const ChampionshipMatch: React.FC<ChampionshipMatchProps> = ({ currentMatch }) => {
  const { user } = useAuthStore();

  const isUserPlayer1 = user?.uid === currentMatch.player1.uid;
  const player1 = isUserPlayer1 ? currentMatch.player1 : currentMatch.player2;
  const player2 = isUserPlayer1 ? currentMatch.player2 : currentMatch.player1;

  const renderRoundIndicators = (playerRounds: boolean[]) => {
    return (
      <div className="flex space-x-1 mb-6"> 
        {playerRounds.map((won, index) => (
          <div 
            key={index} 
            className={`w-3 h-3 rounded-full ${won ? 'bg-green-500' : 'bg-gray-300'}`}
          ></div>
        ))}
      </div>
    );
  };

  const renderStackedCards = (team: TeamMember[], activeCardIndex: number) => {
    const cardHeight = 200;
    const visiblePortion = 110;
    const inactiveCards = team.filter((_, index) => index !== activeCardIndex);
  
    return (
      <div className="relative w-48" style={{ height: `${cardHeight + (inactiveCards.length - 1) * visiblePortion}px` }}>
        {inactiveCards.map((player, index) => {
          const bottomOffset = (inactiveCards.length - 1 - index) * visiblePortion;
          
          return (
            <div 
              key={player.id} 
              className="absolute left-0 transition-all duration-300 ease-in-out"
              style={{ 
                bottom: `${bottomOffset}px`,
                zIndex: index,
              }}
            >
              <PlayerCard 
                player={player} 
                position={team.indexOf(player) + 1} 
                isActive={false}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderPlayerInfo = (player: typeof player1) => {
    return (
      <div className="text-center mb-4"> 
        <h2 className="text-xl font-semibold mb-1">{player.displayName}</h2>
        <p className="text-2xl text-red-600 font-bold mb-2">Points: {player.totalPoints}</p> 
        {renderRoundIndicators(player.roundsWon)}
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">Championship Match</h1>
      <div className="flex justify-between items-start mb-4 flex-grow">
        <div className="w-1/4 flex flex-col items-center">
          {renderPlayerInfo(player1)}
          {renderStackedCards(player1.team, currentMatch.currentRound.number - 1)}
        </div>
        <div className="w-1/2 flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-4">ROUND {currentMatch.currentRound.number}</h3>
          <div className="flex items-center justify-center mb-8">
            <PlayerCard player={currentMatch.currentRound.attacker} position={1} isActive={true} />
            <span className="mx-4 text-2xl font-bold">VS</span>
            <PlayerCard player={currentMatch.currentRound.defender} position={1} isActive={true} />
          </div>
          <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-lg w-full">
            <h4 className="font-semibold mb-2">Timeline</h4>
            {currentMatch.currentRound.events.map((event, index) => (
              <div key={index} className="mb-2">
                <span className="font-bold">{event.points} Points</span> - {event.description}
              </div>
            ))}
          </div>
        </div>
        <div className="w-1/4 flex flex-col items-center">
          {renderPlayerInfo(player2)}
          {renderStackedCards(player2.team, currentMatch.currentRound.number - 1)}
        </div>
      </div>
    </div>
  );
};

export default ChampionshipMatch;