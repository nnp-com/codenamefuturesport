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
  
  console.log(`Searching for flavor text: ${key}, ${outcomeKey}, ${event}`);

  if (!typedFlavorTextData[key]) {
    console.warn(`No flavor text found for ${key}`);
    return { text: `${attackerSport} vs ${defenderSport}: ${event}`, points: 0 };
  }

  if (!typedFlavorTextData[key][outcomeKey]) {
    console.warn(`No ${outcomeKey} flavor text found for ${key}`);
    return { text: `${attackerSport} vs ${defenderSport}: ${event}`, points: 0 };
  }

  const relevantTexts = typedFlavorTextData[key][outcomeKey].filter(
    (item) => item.event.toLowerCase() === event.toLowerCase()
  );

  if (relevantTexts.length === 0) {
    console.warn(`No flavor text found for event: ${event}`);
    return { text: `${attackerSport} vs ${defenderSport}: ${event}`, points: 0 };
  }

  const randomIndex = Math.floor(Math.random() * relevantTexts.length);
  console.log(`Selected flavor text: ${relevantTexts[randomIndex].text}`);
  return relevantTexts[randomIndex];
};