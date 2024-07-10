'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../stores/useAuthStore';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '../lib/firebaseConfig';
import Button from './ui/button';

const StartupScreen: React.FC = () => {
  const router = useRouter();
  const { user, loading, initializeAuth } = useAuthStore();
  const [helloWorldMessage, setHelloWorldMessage] = useState('');

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

  // const triggerHelloWorld = async () => {
  //   try {
  //     const response = await fetch('https://helloworld-6d5p5i2o5q-ew.a.run.app', {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       mode: 'cors', // Explicitly set CORS mode
  //     });
  //     const data = await response.text();
  //     setHelloWorldMessage(data);
  //   } catch (error) {
  //     console.error('Error triggering Hello World function:', error);
  //     setHelloWorldMessage('Error: Could not trigger function');
  //   }
  // };

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
      {/* <Button onClick={triggerHelloWorld} className="mb-4">Trigger Championship</Button> */}
      {helloWorldMessage && (
        <p className="mt-4 text-xl">{helloWorldMessage}</p>
      )}
    </div>
  );
};

export default StartupScreen;