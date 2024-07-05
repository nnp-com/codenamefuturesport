import flavorTextData from '../data/flavourText.json';
import { Sport, FlavorTextData } from '../types';

const typedFlavorTextData: FlavorTextData = flavorTextData[0] as FlavorTextData;

export const getFlavorText = (
  attackerSport: Sport,
  defenderSport: Sport,
  isSuccessful: boolean,
  event: string
): { text: string; points: number } => {
  const key = `${attackerSport}Attacking_${defenderSport}Defending` as keyof FlavorTextData;
  const outcomeKey = isSuccessful ? 'successfulAttack' : 'successfulDefense';
  
  const relevantTexts = typedFlavorTextData[key][outcomeKey].filter(
    (item) => item.event === event
  );

  if (relevantTexts.length === 0) {
    return { text: "No matching flavor text found.", points: 0 };
  }

  const randomIndex = Math.floor(Math.random() * relevantTexts.length);
  return {
    text: relevantTexts[randomIndex].text,
    points: relevantTexts[randomIndex].points
  };
};

export const getRandomEvent = (attackerSport: Sport): string => {
  const sportEvents: Record<Sport, string[]> = {
    Soccer: ['goal', 'assist', 'pass'],
    Baseball: ['homerun', 'triple', 'double', 'single'],
    Basketball: ['three-pointer', 'basket', 'rebound']
  };

  const events = sportEvents[attackerSport];
  return events[Math.floor(Math.random() * events.length)];
};