import { Animal } from '../types/Animal';

export type AnimalRiskLevel = 'Low' | 'Moderate' | 'High';

const includesAny = (value: string, needles: string[]): boolean =>
  needles.some((needle) => value.includes(needle));

export const getAnimalRiskLevel = (animal: Animal): AnimalRiskLevel => {
  if (!animal.isPettable) return 'High';

  const habitat = (animal.location?.habitat ?? '').toLowerCase();
  const domesticSignals = ['home', 'homes', 'farm', 'ranch', 'stable', 'pet stores', 'urban', 'neighborhood'];
  const wildSignals = [
    'forest',
    'rainforest',
    'savannah',
    'desert',
    'mountain',
    'ocean',
    'sea',
    'arctic',
    'tundra',
    'wetland',
    'river',
    'lake',
  ];

  if (includesAny(habitat, domesticSignals)) return 'Low';
  if (includesAny(habitat, wildSignals)) return 'Moderate';
  return 'Low';
};

export const getAnimalSafetyReason = (animal: Animal): string => {
  const riskLevel = getAnimalRiskLevel(animal);
  if (!animal.isPettable) {
    return `${animal.name} is marked as not pettable because wild behavior, stress reactions, or defensive responses can quickly become dangerous for people and the animal.`;
  }

  if (riskLevel === 'Low') {
    return `${animal.name} is generally safer around humans in controlled settings, but interaction should still be calm, respectful, and supervised when possible.`;
  }

  return `${animal.name} can be approachable in some contexts, but this species still needs caution due to unpredictable behavior or stressful environments.`;
};

export const getAnimalHandlingTips = (animal: Animal): string[] => {
  if (!animal.isPettable) {
    return [
      'Keep a safe distance and avoid direct contact.',
      'Do not feed, chase, or corner this animal.',
      'Observe quietly and follow local wildlife rules.',
    ];
  }

  const riskLevel = getAnimalRiskLevel(animal);
  if (riskLevel === 'Low') {
    return [
      'Approach slowly and let the animal notice you first.',
      'Use gentle touch and avoid sudden movements.',
      'Wash hands after contact and respect boundaries.',
    ];
  }

  return [
    'Interact only in calm, familiar environments.',
    'Avoid touching the face, paws, or tail unexpectedly.',
    'Stop contact immediately if stress signals appear.',
  ];
};
