'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from '@headlessui/react';
import useAuthStore from '../stores/useAuthStore';

const Navbar: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAdmin, signOut } = useAuthStore();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    if (!user) return null;

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-800">
                                CD : FS
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className={`${
                                    pathname === '/lockerroom'
                                        ? 'border-indigo-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                            >
                                Locker Room
                            </Link>
                            {/* Add more navigation links as needed */}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {user ? (
                            <Menu as="div" className="ml-3 relative">
                                <div className="flex items-center">
                                    <span className="mr-2 text-sm font-medium text-gray-700">
                                        {user.displayName || 'User'}
                                    </span>
                                    <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <span className="sr-only">Open user menu</span>
                                        <Image
                                            className="h-8 w-8 rounded-full"
                                            src={user.photoURL || '/default-avatar.png'}
                                            alt="User profile"
                                            width={32}
                                            height={32}
                                        />
                                    </Menu.Button>
                                </div>
                                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <a
                                                href="#"
                                                onClick={handleSignOut}
                                                className={`${
                                                    active ? 'bg-gray-100' : ''
                                                } block px-4 py-2 text-sm text-gray-700`}
                                            >
                                                Sign out
                                            </a>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </Menu>
                        ) : (
                          <></>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;