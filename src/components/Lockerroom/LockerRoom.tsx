import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useTeamSelectionStore from '../../stores/TeamSelectionStore';
import PlayerCard from '../ui/playercardHome';
import useAuthStore from '../../stores/useAuthStore';
import ChampionshipComponent from './ChampionshipData';
import MyItemsComponent from './Items';

const LockerRoom: React.FC = () => {
  const { teamMembers, loadUserTeam } = useTeamSelectionStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      await loadUserTeam();
      setLoading(false);
    };

    loadTeam();
  }, [loadUserTeam]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  const hasTeam = teamMembers.length > 0;

  const totalOffensiveStrength = teamMembers.reduce((sum, player) => sum + player.offensiveStrength, 0);
  const totalDefensiveStrength = teamMembers.reduce((sum, player) => sum + player.defensiveStrength, 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Locker Room: Your Current Team</h1>
        <div className="text-right flex items-center">
          <p className="text-lg font-semibold text-green-500 mr-4">OFF: {totalOffensiveStrength}</p>
          <p className="text-lg font-semibold text-red-500">DEF: {totalDefensiveStrength}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center mb-4">
        {hasTeam ? (
          teamMembers.map((member) => (
            <PlayerCard
              key={member.position}
              player={member}
              position={member.position}
              className="mx-2 mb-2"
            />
          ))
        ) : (
          <div className="text-center text-xl font-semibold text-gray-600">
            No team selected. Please pick your team.
          </div>
        )}
      </div>

      <div className="flex justify-center mb-4">
        <button 
          onClick={() => router.push('/team-selection')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {hasTeam ? 'Manage Team' : 'Pick Team'}
        </button>
      </div>

      <ChampionshipComponent teamMembers={teamMembers} />
      <MyItemsComponent />
    </div>
  );
};

export default LockerRoom;