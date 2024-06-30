import {
  startChampionship,
  manuallyTriggerChampionship,
  stopChampionship,
  resetDatabase,
} from './gameFunctions';

// Export the scheduled function to start the championship every 7 days
export const scheduledChampionshipStart = startChampionship;

// Export the manually triggered functions
export const triggerChampionship = manuallyTriggerChampionship;
export const stopCurrentChampionship = stopChampionship;
export const resetGameDatabase = resetDatabase;
