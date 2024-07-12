'use client'

import React, { useEffect, useState } from 'react';
import { Listbox } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import useTeamSelectionStore from '../stores/TeamSelectionStore';
import PlayerCard from './ui/playercard';
import { SPORTS } from '../constants';
import ConfirmationModal from './ui/confirmationModal';

interface Player {
  id: string;
  name: string;
  sport: "Basketball" | "Baseball" | "Soccer";
  starTier: number;
  offensiveStrength: number;
  defensiveStrength: number;
}

const TeamSelectionScreen: React.FC = () => {
  const {
    selectedSport,
    selectedStarTier,
    teamMembers,
    availableStarTiers,
    errorMessage,
    loading,
    allPlayers,
    setSelectedSport,
    setSelectedStarTier,
    addTeamMember,
    removeTeamMember,
    loadUserTeam,
    fillRandomPosition,
    removeAllPlayers,
    setAllPlayers,
  } = useTeamSelectionStore();
  const router = useRouter();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isBackModalOpen, setIsBackModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleRemoveAllPlayers = () => {
    setIsConfirmModalOpen(true);
  };

  const confirmRemoveAllPlayers = () => {
    removeAllPlayers();
    setIsConfirmModalOpen(false);
  };

  const handleBack = () => {
    if (teamMembers.length === 5) {
      router.push('/lockerroom');
    } else {
      setIsBackModalOpen(true);
    }
  };

  const handleLeaveWithoutTeam = async () => {
    setIsNavigating(true);
    await removeAllPlayers();
    navigateToLockerRoom();
  };

  const navigateToLockerRoom = () => {
    setIsNavigating(true);
    router.push('/lockerroom?reload=true');
  };

  useEffect(() => {
    const loadPlayersData = async () => {
      try {
        const [basketballData, baseballData, soccerData] = await Promise.all([
          import('../data/basketball_players.json'),
          import('../data/baseball_players.json'),
          import('../data/soccer_players.json'),
        ]);

        const basketballPlayers: Player[] = basketballData.default.map((player: any, index: number) => ({
          ...player,
          id: `basketball_${index + 1}`,
          sport: "Basketball" as const,
        }));

        const baseballPlayers: Player[] = baseballData.default.map((player: any, index: number) => ({
          ...player,
          id: `baseball_${index + 1}`,
          sport: "Baseball" as const,
        }));

        const soccerPlayers: Player[] = soccerData.default.map((player: any, index: number) => ({
          ...player,
          id: `soccer_${index + 1}`,
          sport: "Soccer" as const,
        }));

        const combinedPlayers = [...basketballPlayers, ...baseballPlayers, ...soccerPlayers];
        setAllPlayers(combinedPlayers);
      } catch (error) {
        console.error('Failed to load players data:', error);
      }
    };

    loadPlayersData();
    loadUserTeam();
  }, [loadUserTeam, setAllPlayers]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (teamMembers.length !== 5) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [teamMembers]);

  const filteredPlayers = allPlayers.filter(
    (player) => player.sport === selectedSport && player.starTier === selectedStarTier
  );

  const totalOffensiveStrength = teamMembers.reduce((sum, player) => sum + player.offensiveStrength, 0);
  const totalDefensiveStrength = teamMembers.reduce((sum, player) => sum + player.defensiveStrength, 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-4">
        <button
          onClick={handleBack}
          className={`px-4 py-2 text-white rounded transition-colors ${
            teamMembers.length === 5 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 hover:bg-gray-500'
          }`}
        >
          ← Back to Locker Room
        </button>
        <h1 className="text-2xl font-bold">Team Selection</h1>
        <div className="text-right">
          <div className="text-xl font-semibold">
            Available Stars ⭐: {availableStarTiers} / 14
          </div>
          <div className="text-xl font-semibold text-green-500">
            Total OFF: {totalOffensiveStrength}
          </div>
          <div className="text-xl font-semibold text-red-500">
            Total DEF: {totalDefensiveStrength}
          </div>
        </div>
      </div>

      <p className="text-center text-lg mb-4">
        You must pick a team of five players to proceed. Select your team members carefully to balance offense and defense.
      </p>

      <p className="text-center text-lg mb-4">
        Current team size: {teamMembers.length}/5
      </p>

      <div className="flex flex-wrap justify-center mb-4">
        {[1, 2, 3, 4, 5].map((position) => (
          <PlayerCard
            key={position}
            player={teamMembers.find(m => m.position === position) || null}
            position={position}
            removeTeamMember={removeTeamMember}
          />
        ))}
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={fillRandomPosition}
          className="mr-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Fill Random Position
        </button>
        <button
          onClick={handleRemoveAllPlayers}
          className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Remove All Players
        </button>
      </div>

      <div className="flex justify-center items-center mb-4 space-x-4">
  <div className="relative">
    <span className="block mb-2 font-bold">Pick a sport</span>
    <Listbox value={selectedSport} onChange={setSelectedSport}>
      <div className="relative">
        <Listbox.Button className="relative w-40 py-2 pl-3 pr-10 text-left bg-white border border-gray-300 rounded-lg shadow-sm cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 sm:text-sm">
          <span className="block truncate">{selectedSport}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {["Basketball", "Baseball", "Soccer"].map((sport) => (
            <Listbox.Option
              key={sport}
              value={sport}
              className={({ active, selected }) =>
                `${active ? 'text-white bg-blue-600' : 'text-gray-900'}
                ${selected ? 'bg-blue-100' : ''}
                cursor-default select-none relative py-2 pl-10 pr-4`
              }
            >
              {({ selected, active }) => (
                <>
                  <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                    {sport}
                  </span>
                  {selected && (
                    <span className={`${active ? 'text-white' : 'text-blue-600'} absolute inset-y-0 left-0 flex items-center pl-3`}>
                      <CheckIcon className="w-5 h-5" aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  </div>

  <div className="relative">
    <span className="block mb-2 font-bold">Star ranking</span>
    <Listbox value={selectedStarTier} onChange={setSelectedStarTier}>
      <div className="relative">
        <Listbox.Button className="relative w-40 py-2 pl-3 pr-10 text-left bg-white border border-gray-300 rounded-lg shadow-sm cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 sm:text-sm">
          <span className="block truncate">{selectedStarTier} Star</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {[1, 2, 3, 4, 5].map((tier) => (
            <Listbox.Option
              key={tier}
              value={tier}
              className={({ active, selected }) =>
                `${active ? 'text-white bg-blue-600' : 'text-gray-900'}
                ${selected ? 'bg-blue-100' : ''}
                cursor-default select-none relative py-2 pl-10 pr-4`
              }
            >
              {({ selected, active }) => (
                <>
                  <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                    {tier} Star
                  </span>
                  {selected && (
                    <span className={`${active ? 'text-white' : 'text-blue-600'} absolute inset-y-0 left-0 flex items-center pl-3`}>
                      <CheckIcon className="w-5 h-5" aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  </div>
</div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Name</th>
              <th className="border border-gray-300 p-2">Stars</th>
              <th className="border border-gray-300 p-2">Offense</th>
              <th className="border border-gray-300 p-2">Defense</th>
              <th className="border border-gray-300 p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => (
              <tr key={player.id}>
                <td className="border border-gray-300 p-2">{player.name}</td>
                <td className="border border-gray-300 p-2">{player.starTier}</td>
                <td className="border border-gray-300 p-2">{player.offensiveStrength}</td>
                <td className="border border-gray-300 p-2">{player.defensiveStrength}</td>
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => addTeamMember(player)}
                    disabled={teamMembers.some(m => m.id === player.id) || player.starTier > availableStarTiers}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    Add to Team
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {errorMessage && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

<ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmRemoveAllPlayers}
        message="Are you sure you want to remove all players from your team?"
      />

      <ConfirmationModal
        isOpen={isBackModalOpen}
        onClose={() => setIsBackModalOpen(false)}
        onConfirm={handleLeaveWithoutTeam}
        onCancel={() => setIsBackModalOpen(false)}
        message="You haven't selected five players yet. Do you want to leave without picking a Team yet?"
        confirmText="Leave without a team"
        cancelText="Continue team picks"
      />
    </div>
  );
};

export default TeamSelectionScreen;