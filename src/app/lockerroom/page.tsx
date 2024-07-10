'use client'

import React from 'react';
import useAuthRedirect from '../../hooks/useAuthRedirect';
import useAuthStore from '../../stores/useAuthStore';
import LockerRoomScreen from '../../components/Lockerroom/LockerRoom';
import LockerRoomAdmin from '../../components/Admin/LockerRoomAdmin';

const LockerRoom: React.FC = () => {
  useAuthRedirect();
  const { user, isAdmin, loading } = useAuthStore();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return isAdmin ? <LockerRoomAdmin /> : <LockerRoomScreen />;
};

export default LockerRoom;