'use client'

import React, { useEffect, useState } from 'react';
import { fetchMockChampionshipData } from '../../data/fetchMockData';
import { User } from '../../types/index';

const StandingsTable: React.FC = () => {
  const [standings, setStandings] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { users } = await fetchMockChampionshipData();
        setStandings(users);
      } catch (error) {
        console.error('Error fetching standings data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Points</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Legacy Points</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((user) => (
          <tr key={user.uid}>
            <td className="px-6 py-4 whitespace-nowrap">{user.displayName}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.championshipWins || 0}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.totalPoints || 0}</td>
            <td className="px-6 py-4 whitespace-nowrap">{user.legacyPoints || 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default StandingsTable;