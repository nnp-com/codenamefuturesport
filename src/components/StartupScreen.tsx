'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../stores/useAuthStore';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '../lib/firebaseConfig';
import Button from './ui/button';

const StartupScreen: React.FC = () => {
  const router = useRouter();
  const { user, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!loading && user) {
      router.push('/lockerroom');
    }
  }, [user, loading, router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google: ', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Codename : FutureSport</h1>
      <Button onClick={signInWithGoogle} className="mb-4">Sign In with Google</Button>
    </div>
  );
};

export default StartupScreen;