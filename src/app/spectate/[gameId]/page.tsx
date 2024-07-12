'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import useAuthStore from '../../../stores/useAuthStore';
import SpectatorView from '../../../components/spectator/Spectatorview';

export default function SpectatePage() {
  const { gameId } = useParams();
  const { user, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to view this game.</div>;
  }

  if (typeof gameId !== 'string') {
    return <div>Invalid game ID</div>;
  }

  return <SpectatorView gameId={gameId} />;
}