'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useTeamSelectionStore from '../stores/TeamSelectionStore';
import PlayerCard from './ui/playercardHome';
import useAuthStore from '../stores/useAuthStore';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

const LockerRoom: React.FC = () => {
  const {
    teamMembers,
    loadUserTeam,
    availableStarTiers,
  } = useTeamSelectionStore();

  const { user, enterChampionship } = useAuthStore();

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [enteredChampionship, setEnteredChampionship] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      await loadUserTeam();
      setLoading(false);
    };

    const checkChampionshipEntry = async () => {
      if (user) {
        const q = query(collection(db, 'enteredChampionship'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        setEnteredChampionship(!querySnapshot.empty);
      }
    };

    loadTeam();
    checkChampionshipEntry();
  }, [loadUserTeam, user]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  const hasTeam = teamMembers.length > 0;

  const handleEnterChampionship = async () => {
    if (!enteredChampionship) {
      await enterChampionship();
    }
    router.push('/lobby');
  };

  const totalOffensiveStrength = teamMembers.reduce((sum, player) => sum + player.offensiveStrength, 0);
  const totalDefensiveStrength = teamMembers.reduce((sum, player) => sum + player.defensiveStrength, 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">Locker Room: Your Current Team</h1>
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
      <div className="flex flex-wrap justify-center mb-4">
        {hasTeam ? (
          teamMembers.map((member) => (
            <PlayerCard
              key={member.position}
              player={member}
              position={member.position}
              className="mx-2"
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
          className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {hasTeam ? 'Manage Team' : 'Pick Team'}
        </button>
        <button 
          onClick={enteredChampionship ? () => router.push('/lobby') : () => setShowModal(true)}
          className={`mr-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ${!hasTeam ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!hasTeam}
        >
          {enteredChampionship ? 'View Championship' : 'Enter Championship'}
        </button>
        <button 
          onClick={() => router.push('/demo-championship')}
          className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ${!hasTeam ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!hasTeam}
        >
          DEMO Championship
        </button>
      </div>

      {showModal && !enteredChampionship && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded">
            <h2 className="text-xl font-bold mb-4">Enter Championship</h2>
            <p>Are you sure you want to enter the championship with your current team?</p>
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setShowModal(false)}
                className="mr-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleEnterChampionship}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Championship Stats</h2>
        <p className="text-lg">Current Points: <span className="font-bold">0</span></p>
        <p className="text-lg">Current Rank: <span className="font-bold">Unranked</span></p>
        <p className="text-lg">Overall Points Scored: <span className="font-bold">0</span></p>
      </div>
    </div>
  );
};

export default LockerRoom;