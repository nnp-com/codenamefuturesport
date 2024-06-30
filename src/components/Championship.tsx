// 'use client'

// import React, { useEffect, useState } from 'react';
// import { fetchMockChampionshipData } from '../../data/fetchMockData';
// import { Match } from '../../types/index';
// import ChampionshipMatch from './DemoChampionshipMatch';
// import useAuthStore from '../../stores/useAuthStore';

// const ChampionshipScreen: React.FC = () => {
//   const { user } = useAuthStore();
//   const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const { mockMatch } = await fetchMockChampionshipData();
//         setCurrentMatch(mockMatch);
//       } catch (error) {
//         console.error('Error fetching mock championship data:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (user) {
//       fetchData();
//     }
//   }, [user]);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!currentMatch) {
//     return <div>No current match. Please check back later.</div>;
//   }

//   return <ChampionshipMatch currentMatch={currentMatch} />;
// };

// export default ChampionshipScreen;