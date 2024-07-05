import React from 'react';
import Image from 'next/image';

interface Player {
  id: string;
  name: string;
  sport: "Basketball" | "Baseball" | "Soccer";
  starTier: number;
  offensiveStrength: number;
  defensiveStrength: number;
}

interface PlayerCardProps {
  player: Player | null;
  position: number;
  isActive?: boolean;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, position, isActive = false, className = '' }) => {
  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'Baseball':
        return <span className="text-2xl">⚾️</span>;
      case 'Basketball':
        return <span className="text-2xl">🏀</span>;
      case 'Soccer':
        return <span className="text-2xl">⚽️</span>;
      default:
        return null;
    }
  };

  const getSportImage = (sport: string) => {
    switch (sport) {
      case 'Baseball':
        return '/images/Baseball.png';
      case 'Basketball':
        return '/images/Basketball.png';
      case 'Soccer':
        return '/images/Soccer.png';
      default:
        return '/images/BotUser.png';
    }
  };

  const cardClasses = `
    w-48 h-[290px] border-4 border-yellow-500 rounded-lg shadow-lg p-3 
    bg-gradient-to-b from-white to-gray-100 overflow-hidden
    ${isActive ? 'ring-2 ring-blue-500' : ''}
    ${className}
  `;

  if (!player) {
    return (
      <div className={cardClasses}>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center">Empty Slot {position}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-lg">⭐ {player.starTier}</span>
            {getSportIcon(player.sport)}
          </div>
          <div className="w-full h-32 relative mb-2"> {/* Increased height for 4:3 ratio */}
            <Image
              src={getSportImage(player.sport)}
              alt={`${player.sport} player`}
              layout="fill"
              objectFit="contain"
              className="rounded"
            />
          </div>
          <h3 className="font-bold text-sm mb-1 truncate">{player.name}</h3>
          <p className="text-gray-600 text-xs mb-2">{player.sport}</p>
        </div>
        <div className="flex justify-between text-sm">
          <p className="text-green-600 font-semibold">OFF: {player.offensiveStrength}</p>
          <p className="text-red-600 font-semibold">DEF: {player.defensiveStrength}</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;