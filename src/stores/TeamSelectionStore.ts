import { create } from 'zustand';
import { auth, db, getUserTeamData, updateUserTeamData } from '../lib/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { Player, TeamMember, Sport } from '../types/index';
import { MAX_TEAM_SIZE, MAX_STAR_TIERS } from '../constants';

const distributeRemainingStarTiers = (remainingTiers: number, remainingSlots: number): number[] => {
  const distribution = Array(remainingSlots).fill(1);
  let toDistribute = remainingTiers - remainingSlots;

  while (toDistribute > 0) {
    for (let i = 0; i < distribution.length && toDistribute > 0; i++) {
      if (distribution[i] < 5) {
        distribution[i]++;
        toDistribute--;
      }
    }
  }

  return distribution;
};

interface TeamSelectionState {
  selectedSport: Sport;
  selectedStarTier: number;
  teamMembers: TeamMember[];
  availableStarTiers: number;
  errorMessage: string;
  loading: boolean;
  allPlayers: Player[];
  setSelectedSport: (sport: Sport) => void;
  setSelectedStarTier: (tier: number) => void;
  addTeamMember: (player: Player) => void;
  removeTeamMember: (playerId: string) => void;
  loadUserTeam: () => Promise<void>;
  saveTeamToFirebase: () => Promise<void>;
  fillRandomPosition: () => void;
  removeAllPlayers: () => void;
  setAllPlayers: (players: Player[]) => void;
}

const useTeamSelectionStore = create<TeamSelectionState>((set, get) => ({
  selectedSport: 'Basketball',
  selectedStarTier: 1,
  teamMembers: [],
  availableStarTiers: MAX_STAR_TIERS,
  errorMessage: '',
  loading: false,
  allPlayers: [],

  setSelectedSport: (sport) => set({ selectedSport: sport }),
  setSelectedStarTier: (tier) => set({ selectedStarTier: tier }),
  setAllPlayers: (players) => set({ allPlayers: players }),

  addTeamMember: (player) => {
    const { teamMembers, availableStarTiers } = get();
    if (teamMembers.length >= MAX_TEAM_SIZE) {
      set({ errorMessage: 'Team is already full.' });
      return;
    }
    if (player.starTier > availableStarTiers) {
      set({ errorMessage: `Not enough star tiers left. You have ${availableStarTiers} available.` });
      return;
    }
    const newTeamMember: TeamMember = { ...player, position: teamMembers.length + 1 };
    const updatedTeam = [...teamMembers, newTeamMember];
    const newAvailableStarTiers = availableStarTiers - player.starTier;
    set({
      teamMembers: updatedTeam,
      availableStarTiers: newAvailableStarTiers,
      errorMessage: '',
      loading: true,
    });
    get().saveTeamToFirebase();
  },

  removeTeamMember: (playerId) => {
    const { teamMembers } = get();
    const playerToRemove = teamMembers.find(member => member.id === playerId);
    if (playerToRemove) {
      const updatedTeam = teamMembers.filter(member => member.id !== playerId);
      const newAvailableStarTiers = get().availableStarTiers + playerToRemove.starTier;
      set({
        teamMembers: updatedTeam.map((member, index) => ({ ...member, position: index + 1 })),
        availableStarTiers: newAvailableStarTiers,
        loading: true,
      });
      get().saveTeamToFirebase();
    }
  },

  loadUserTeam: async () => {
    const user = auth.currentUser;
    if (user) {
      set({ loading: true });
      const teamData = await getUserTeamData(user.uid);
      if (teamData) {
        const usedStarTiers = (teamData.members as TeamMember[]).reduce((sum: number, member: TeamMember) => sum + member.starTier, 0);
        set({
          teamMembers: teamData.members as TeamMember[],
          availableStarTiers: MAX_STAR_TIERS - usedStarTiers,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    }
  },

  saveTeamToFirebase: async () => {
    const user = auth.currentUser;
    const { teamMembers } = get();
    if (user) {
      await updateUserTeamData(user.uid, teamMembers);
      set({ loading: false });
    }
  },

  fillRandomPosition: () => {
    const { teamMembers, allPlayers, availableStarTiers } = get();
    if (teamMembers.length >= MAX_TEAM_SIZE) {
      set({ errorMessage: 'Team is already full.' });
      return;
    }

    const remainingSlots = MAX_TEAM_SIZE - teamMembers.length;
    const distribution = distributeRemainingStarTiers(availableStarTiers, remainingSlots);

    let updatedTeam = [...teamMembers];
    let updatedAvailableStarTiers = availableStarTiers;

    for (const targetTier of distribution) {
      // Filter available players from all sports
      const availablePlayers = allPlayers.filter(player =>
        player.starTier === targetTier &&
        !updatedTeam.some(member => member.id === player.id)
      );

      if (availablePlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePlayers.length);
        const selectedPlayer = availablePlayers[randomIndex];
        updatedTeam.push({ ...selectedPlayer, position: updatedTeam.length + 1 });
        updatedAvailableStarTiers -= selectedPlayer.starTier;
      } else {
        // If no exact match, find the closest match from any sport
        const closestPlayer = allPlayers.reduce((prev, curr) =>
          Math.abs(curr.starTier - targetTier) < Math.abs(prev.starTier - targetTier) &&
          !updatedTeam.some(member => member.id === curr.id) ? curr : prev
        );
        updatedTeam.push({ ...closestPlayer, position: updatedTeam.length + 1 });
        updatedAvailableStarTiers -= closestPlayer.starTier;
      }
    }

    set({
      teamMembers: updatedTeam,
      availableStarTiers: updatedAvailableStarTiers,
      errorMessage: '',
      });
      get().saveTeamToFirebase();
      },
      
      removeAllPlayers: () => {
      set({
      teamMembers: [],
      availableStarTiers: MAX_STAR_TIERS,
      errorMessage: '',
      });
      get().saveTeamToFirebase();
      },
      }));

      export default useTeamSelectionStore;