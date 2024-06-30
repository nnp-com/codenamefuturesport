import React from 'react';

interface Player {
  id: string;
  name: string;
  sport: "Basketball" | "Baseball" | "Soccer";
  starTier: number;
  offensiveStrength: number;
  defensiveStrength: number;
}

const PlayerCard: React.FC<{ player: Player | null; position: number; removeTeamMember: (id: string) => void; }> = ({ player, position, removeTeamMember }) => {

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

  return (
    <div className="w-48 h-[200px] m-2 border-4 border-yellow-500 rounded-lg shadow-lg p-3 flex flex-col justify-between bg-gradient-to-b from-white to-gray-100 overflow-hidden">
      {player ? (
        <>
          <div className="flex flex-col flex-grow min-h-0">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg">⭐ {player.starTier}</span>
              {getSportIcon(player.sport)}
            </div>
            <h3 className="font-bold text-sm mb-1 truncate">{player.name}</h3>
            <p className="text-gray-600 text-xs mb-2">{player.sport}</p>
            <div className="flex justify-between text-sm mb-2">
              <p className="text-green-600 font-semibold">OFF: {player.offensiveStrength}</p>
              <p className="text-red-600 font-semibold">DEF: {player.defensiveStrength}</p>
            </div>
          </div>
          <div className="mt-auto">
            <button 
              onClick={() => removeTeamMember(player.id)}
              className="w-full px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition duration-300"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center">Empty Slot {position}</p>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;