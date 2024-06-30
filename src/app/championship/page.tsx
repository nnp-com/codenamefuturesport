

'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from "firebase/auth";
import useAuthRedirect from '../../hooks/useAuthRedirect';
import { auth } from '../../lib/firebaseConfig';
import ChampionshipScreen from '../../components/Demo/DemoChampionshipScreen'

const TeamSelectionPage: React.FC = () => {
  useAuthRedirect();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(false);
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <ChampionshipScreen />;
};

export default TeamSelectionPage;