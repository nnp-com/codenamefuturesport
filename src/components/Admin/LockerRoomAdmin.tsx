import React, { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
// import { getFunctions, httpsCallable } from 'firebase/functions';
import { getBotUsers, deleteBotUser, enterChampionship, getEnteredPlayers } from '../../lib/firebaseConfig';
import useAuthStore from '../../stores/useAuthStore';
import { resetChampionship } from '../../utils/championshipLogic';
import ChampionshipControl from './ChampionshipControl';

const LockerRoomAdmin: React.FC = () => {
  const { user, isAdmin } = useAuthStore();
  const [botUsers, setBotUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnterChampionshipOpen, setIsEnterChampionshipOpen] = useState(false);
  // const [isStopChampionshipModalOpen, setIsStopChampionshipModalOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [enteredPlayers, setEnteredPlayers] = useState<string[]>([]);
  // const functions = getFunctions();
  // const stopChampionship = httpsCallable(functions, 'stopChampionship');
  // const resetDatabase = httpsCallable(functions, 'resetDatabase');
  const [isResetChampionshipModalOpen, setIsResetChampionshipModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBotUsers = async () => {
      const users = await getBotUsers();
      setBotUsers(users);
      setLoading(false);
    };
  
    const fetchEnteredPlayers = async () => {
      const players = await getEnteredPlayers();
      setEnteredPlayers(players.map(player => player.uid));
    };
  
    fetchBotUsers();
    fetchEnteredPlayers();
  }, []);

  const handleDeleteBot = async (botId: string) => {
    await deleteBotUser(botId);
    setBotUsers(botUsers.filter(bot => bot.id !== botId));
    setIsModalOpen(false);
  };

  const handleEnterChampionship = async (botId: string) => {
    await enterChampionship(botId);
    setIsEnterChampionshipOpen(false);
    const botUsers = await getBotUsers();
    setBotUsers(botUsers);
  };

  const openModal = (botId: string) => {
    setSelectedBot(botId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBot(null);
    setIsModalOpen(false);
  };

  const handleResetChampionship = async () => {
    try {
      await resetChampionship();
      setMessage('Championship reset successfully');
    } catch (error) {
      console.error('Error resetting championship:', error);
      setMessage('An error occurred while resetting the championship');
    } finally {
      setIsResetChampionshipModalOpen(false);
      window.location.reload();
    }
  };

  // const stopCurrentChampionship = async () => {
  //   try {
  //     const result = await stopChampionship();
  //     const data = result.data as { message: string };
  //     console.log(data.message);
  //     await resetGameDatabase();
  //   } catch (error) {
  //     console.error('Error stopping championship:', error);
  //   } finally {
  //     setIsStopChampionshipModalOpen(false);
  //   }
  // };
  
  // const resetGameDatabase = async () => {
  //   try {
  //     const result = await resetDatabase();
  //     const data = result.data as { message: string };
  //     console.log(data.message);
  //   } catch (error) {
  //     console.error('Error resetting database:', error);
  //   }
  // };

  if (!user || !isAdmin) {
    return <p>You do not have permission to view this page.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Locker Room: Admin Panel</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Championship Management</h2>
        <ChampionshipControl />
        <div className="mt-4 space-x-4">
          {/* <button
            onClick={() => setIsStopChampionshipModalOpen(true)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Stop Championship
          </button> */}
          <button
            onClick={() => setIsResetChampionshipModalOpen(true)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset Championship
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Bot Management</h2>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Bot Name</th>
                  <th className="py-3 px-6 text-left">Sport</th>
                  <th className="py-3 px-6 text-left">Stars</th>
                  <th className="py-3 px-6 text-left">Offense</th>
                  <th className="py-3 px-6 text-left">Defense</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {botUsers.map((bot) => {
                  const totalOffensiveStrength = bot.members.reduce((sum: number, member: { offensiveStrength: number }) => sum + member.offensiveStrength, 0);
                  const totalDefensiveStrength = bot.members.reduce((sum: number, member: { defensiveStrength: number }) => sum + member.defensiveStrength, 0);

                  return (
                    <tr key={bot.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left">{bot.displayName}</td>
                      <td className="py-3 px-6 text-left">
                        {bot.members.map((member: any) => member.sport).join(', ')}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {bot.members.map((member: any) => member.starTier).join(', ')}
                      </td>
                      <td className="py-3 px-6 text-left text-green-500">
                        {totalOffensiveStrength}
                      </td>
                      <td className="py-3 px-6 text-left text-red-500">
                        {totalDefensiveStrength}
                      </td>
                      <td className="py-3 px-6 text-center">
                        {enteredPlayers.includes(bot.id) ? (
                          <button
                            onClick={() => router.push('/lobby')}
                            className="mr-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            View Championship
                          </button>
                        ) : (
                          <button
                            onClick={() => { setSelectedBot(bot.id); setIsEnterChampionshipOpen(true); }}
                            className="mr-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Enter Championship
                          </button>
                        )}
                        <button
                          onClick={() => openModal(bot.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Create New Bot</h2>
        <button
          onClick={() => router.push('/bot-creator')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Create Bot
        </button>
      </div>

    <Transition appear show={isModalOpen} as={Fragment}>
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
                  Delete Bot
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this bot?
                  </p>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    onClick={() => handleDeleteBot(selectedBot!)}
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400 ml-2"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>

    <Transition appear show={isEnterChampionshipOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setIsEnterChampionshipOpen(false)}>
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
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Enter Championship
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to enter this bot into the championship?
                  </p>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={() => handleEnterChampionship(selectedBot!)}
                  >
                    Enter Championship
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={() => setIsEnterChampionshipOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
    <Transition appear show={isResetChampionshipModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsResetChampionshipModalOpen(false)}>
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
                    Reset Championship
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to reset the championship? This will clear all ongoing games, match history, and player scores.
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      onClick={handleResetChampionship}
                    >
                      Yes, reset championship
                    </button>
                    <button
                      type="button"
                      className="ml-2 inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400"
                      onClick={() => setIsResetChampionshipModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    {/* <Transition appear show={isStopChampionshipModalOpen} as={Fragment}>
    <Dialog as="div" className="relative z-10" onClose={() => setIsStopChampionshipModalOpen(false)}>
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
                Stop Championship
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to stop the championship and reset the database? This action cannot be undone.
                </p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  onClick={stopCurrentChampionship}
                >
                  Yes, stop and reset
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400 ml-2"
                  onClick={() => setIsStopChampionshipModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition> */}
  </div>
);
};

export default LockerRoomAdmin;