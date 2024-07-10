import {onRequest} from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as cors from 'cors';

const corsHandler = cors({
  origin: true, // This allows all origins, or you can keep 'http://localhost:3000' if you prefer
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
});

export const helloWorld = onRequest({
  region: 'europe-west3',
  cors: true,
  invoker: 'public',
}, (request, response) => {
  corsHandler(request, response, () => {
    if (request.method === 'OPTIONS') {
      // Handle preflight request
      response.status(204).send('');
    } else {
      logger.info('Hello logs!', {structuredData: true});
      response.send('Championship Start');
    }
  });
});

// import {
//   startChampionship,
//   manuallyTriggerChampionship,
//   stopChampionship,
//   resetDatabase,
// } from './gameFunctions';

// // Export the scheduled function to start the championship every 7 days
// export const scheduledChampionshipStart = startChampionship;

// // Export the manually triggered functions
// export const triggerChampionship = manuallyTriggerChampionship;
// export const stopCurrentChampionship = stopChampionship;
// export const resetGameDatabase = resetDatabase;
