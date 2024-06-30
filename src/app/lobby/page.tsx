'use client'

import React, { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../stores/useAuthStore';
import { enterChampionship, getEnteredPlayers } from '../../lib/firebaseConfig';
import { Dialog, Transition } from '@headlessui/react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Image from 'next/image';

interface ChampionshipResult {
    message: string;
  }

const Lobby: React.FC = () => {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const [enteredPlayers, setEnteredPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isStartChampionshipOpen, setIsStartChampionshipOpen] = useState(false);

  useEffect(() => {
    const fetchEnteredPlayers = async () => {
      const players = await getEnteredPlayers();
      setEnteredPlayers(players);
      setLoading(false);
    };

    fetchEnteredPlayers();
  }, []);

  const handleEnterChampionship = async () => {
    if (user) {
      await enterChampionship(user.uid);
      const players = await getEnteredPlayers();
      setEnteredPlayers(players);
    }
    closeModal();
    router.push('/lobby');
  };

  const handleStartChampionship = async () => {
    const functions = getFunctions();
    const triggerChampionship = httpsCallable(functions, 'manuallyTriggerChampionship');
    try {
      const result = await triggerChampionship();
      const data = result.data as ChampionshipResult; // Cast result.data to ChampionshipResult
      console.log(data.message);  // 'Championship started successfully.'
      setIsStartChampionshipOpen(false);
    } catch (error) {
      console.error('Error starting championship:', error);
    }
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const openStartChampionshipModal = () => {
    setIsStartChampionshipOpen(true);
  };

  const closeStartChampionshipModal = () => {
    setIsStartChampionshipOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">Championship Lobby</h1>
      <h3 className="mb-4 px-6 py-3">
        ... waiting for players to join
      </h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          {enteredPlayers.length === 0 ? (
            <p>No players have entered the championship yet.</p>
          ) : (
            <ul>
              {enteredPlayers.map((player, index) => (
                <li key={index} className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <Image
                      src={player.photoURL}
                      alt={`${player.displayName}'s profile picture`}
                      width={40}
                      height={40}
                      className="rounded-full mr-4"
                    />
                    <span className="font-semibold">{getFirstName(player.displayName)}</span>
                  </div>
                  <span>Overall Score: {player.overallScore}</span>
                </li>
              ))}
            </ul>
          )}
          {isAdmin && (
            <button
              onClick={openStartChampionshipModal}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start Championship
            </button>
          )}
        </div>
      )}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Confirm Entry
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to enter the championship with your current team?
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="ml-2 inline-flex justify-center rounded-md border border-transparent bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={handleEnterChampionship}
                    >
                      Enter Championship
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isStartChampionshipOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeStartChampionshipModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Start Championship
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to start the championship?
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={closeStartChampionshipModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="ml-2 inline-flex justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={handleStartChampionship}
                    >
                      Start Championship
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Lobby;