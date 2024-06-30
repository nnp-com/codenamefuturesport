'use client'

import React, { useEffect, useState } from 'react';
import { Listbox } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import useTeamSelectionStore from '../../stores/TeamSelectionStore';
import PlayerCard from '../../components/ui/playercard';
import { SPORTS } from '../../constants';
import ConfirmationModal from '../../components/ui/confirmationModal';
import { createBotUser } from '../../lib/firebaseConfig';

interface Player {
  id: string;
  name: string;
  sport: "Basketball" | "Baseball" | "Soccer";
  starTier: number;
  offensiveStrength: number;
  defensiveStrength: number;
}

const BotSelectionScreen: React.FC = () => {
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

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [botName, setBotName] = useState('');
  const router = useRouter();

  const handleRemoveAllPlayers = () => {
    setIsConfirmModalOpen(true);
  };

  const confirmRemoveAllPlayers = () => {
    removeAllPlayers();
    setIsConfirmModalOpen(false);
  };

  const handleCreateBot = async () => {
    if (!botName) {
      alert('Please enter a bot name.');
      return;
    }

    if (teamMembers.length !== 5) {
      alert('Please select a full team for the bot.');
      return;
    }

    try {
      await createBotUser(botName, teamMembers);
      alert('Bot created successfully!');
      router.push('/lockerroom');
      setBotName('');
      removeAllPlayers();
    } catch (error) {
      console.error('Failed to create bot:', error);
      alert('Failed to create bot.');
    }
  };

  useEffect(() => {
    const loadPlayersData = async () => {
      try {
        const [basketballData, baseballData, soccerData] = await Promise.all([
          import('../../data/basketball_players.json'),
          import('../../data/baseball_players.json'),
          import('../../data/soccer_players.json'),
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

  const filteredPlayers = allPlayers.filter(
    (player) => player.sport === selectedSport && player.starTier === selectedStarTier
  );

  const totalOffensiveStrength = teamMembers.reduce((sum, player) => sum + player.offensiveStrength, 0);
  const totalDefensiveStrength = teamMembers.reduce((sum, player) => sum + player.defensiveStrength, 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">Create Bot Team</h1>
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

      <div className="mb-4">
        <label className="block text-gray-700">Bot Name:</label>
        <input
          type="text"
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
          className="mt-1 p-2 border rounded w-full"/>
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
    <div className="flex justify-center mb-4">
      <button
          onClick={handleCreateBot}
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Create Bot
      </button>
      </div>

  <div className="mb-4 flex justify-center">
    <Listbox value={selectedSport} onChange={setSelectedSport}>
      <div className="relative mr-2">
        <Listbox.Button className="p-2 border rounded">
          {selectedSport}
        </Listbox.Button>
        <Listbox.Options className="absolute mt-1 w-56 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {["Basketball", "Baseball", "Soccer"].map((sport) => (
            <Listbox.Option
              key={sport}
              value={sport}
              className={({ active }) =>
                `${active ? 'text-amber-900 bg-amber-100' : 'text-gray-900'}
                cursor-default select-none relative py-2 pl-10 pr-4`
              }
            >
              {sport}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>

    <Listbox value={selectedStarTier} onChange={setSelectedStarTier}>
      <div className="relative">
        <Listbox.Button className="p-2 border rounded">
          {selectedStarTier} Star
        </Listbox.Button>
        <Listbox.Options className="absolute mt-1 w-56 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {[1, 2, 3, 4, 5].map((tier) => (
            <Listbox.Option
              key={tier}
              value={tier}
              className={({ active }) =>
                `${active ? 'text-amber-900 bg-amber-100' : 'text-gray-900'}
                cursor-default select-none relative py-2 pl-10 pr-4`
              }
            >
              {tier} Star
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
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
        message="Are you sure you want to remove all players from the team?"
      />
    </div>
    </div>
  );
};

export default BotSelectionScreen;