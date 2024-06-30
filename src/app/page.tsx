'use client'

import React, { useEffect } from "react";
import type { NextPage } from 'next';
import useAuthStore from '../stores/useAuthStore';
import StartupScreen from '../components/StartupScreen';

const Home: NextPage = () => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  return <StartupScreen />;
};

export default Home;
