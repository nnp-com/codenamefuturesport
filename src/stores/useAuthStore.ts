import { create } from 'zustand';
import { User } from 'firebase/auth';
import {
  auth,
  initializeUserInFirestore,
  checkAdminStatus,
  setAdminStatus,
  enterChampionship,
  getEnteredPlayers
} from '../lib/firebaseConfig';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  championshipStatus: any; // Add a type based on your championship status data
  setUser: (user: User | null) => Promise<void>;
  initializeAuth: () => void;
  signOut: () => Promise<void>;
  enterChampionship: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAdmin: false,
  loading: true,
  initialized: false,
  championshipStatus: null,

  setUser: async (user) => {
    if (user) {
      set({ loading: true });
      const email = user.email || '';
      const displayName = user.displayName || '';
      const photoURL = user.photoURL || ''; 
      await initializeUserInFirestore(user.uid, email, displayName, photoURL);
      await setAdminStatus(user.uid, email);
      const isAdmin = await checkAdminStatus(user.uid);
      set({ user, isAdmin, loading: false });
    } else {
      set({ user: null, isAdmin: false, loading: false, championshipStatus: null });
    }
  },

  initializeAuth: () => {
    if (get().initialized) return;

    set({ initialized: true });
    set({ loading: true });
    onAuthStateChanged(auth, async (user) => {
      await get().setUser(user);
      set({ loading: false });
    });
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, isAdmin: false, championshipStatus: null });
  },

  enterChampionship: async () => {
    const { user } = get();
    if (user) {
      await enterChampionship(user.uid);
      const championshipStatus = await getEnteredPlayers();
      set({ championshipStatus });
    }
  },
}));

export default useAuthStore;