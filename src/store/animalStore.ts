import { create } from 'zustand';
import { Animal, GuessResult } from '../types/Animal';
import { animals } from '../data/animals';
import { HabitatCategory, getHabitatCategory } from '../utils/habitat';

export type PettableFilterOption = 'all' | 'pettable' | 'not-pettable';
export type AnimalSortOption = 'default' | 'alphabetical' | 'reverse-alphabetical' | 'pettable-first' | 'not-pettable-first';
export type HabitatFilterOption = 'all' | HabitatCategory;

interface AnimalStore {
  animals: Animal[];
  bucketList: Animal[];
  favoriteAnimalIds: string[];
  searchQuery: string;
  guessResults: Record<string, GuessResult>;
  familyFilter: string;
  habitatFilter: HabitatFilterOption;
  pettableFilter: PettableFilterOption;
  sortOption: AnimalSortOption;
  
  setSearchQuery: (query: string) => void;
  setFamilyFilter: (family: string) => void;
  setHabitatFilter: (habitat: HabitatFilterOption) => void;
  setPettableFilter: (value: PettableFilterOption) => void;
  setSortOption: (value: AnimalSortOption) => void;
  clearFilters: () => void;
  addToBucketList: (animal: Animal) => void;
  removeFromBucketList: (animalId: string) => void;
  reorderBucketList: (dragIndex: number, hoverIndex: number) => void;
  recordGuess: (animal: Animal, userGuess: boolean) => void;
  getFilteredAnimals: () => Animal[];
  clearBucketList: () => void;
  togglePetted: (animalId: string) => void;
  toggleFavorite: (animalId: string) => void;
  isFavorite: (animalId: string) => boolean;
}

// LocalStorage utilities
const BUCKET_LIST_KEY = 'canipetthatdawg-bucket-list';
const FAVORITE_IDS_KEY = 'canipetthatdawg-favorite-animal-ids';

const saveBucketListToStorage = (bucketList: Animal[]) => {
  try {
    localStorage.setItem(BUCKET_LIST_KEY, JSON.stringify(bucketList));
  } catch (error) {
    console.error('Failed to save bucket list to localStorage:', error);
  }
};

const loadBucketListFromStorage = (): Animal[] => {
  try {
    const stored = localStorage.getItem(BUCKET_LIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load bucket list from localStorage:', error);
    return [];
  }
};

const saveFavoriteIdsToStorage = (favoriteIds: string[]) => {
  try {
    localStorage.setItem(FAVORITE_IDS_KEY, JSON.stringify(favoriteIds));
  } catch (error) {
    console.error('Failed to save favorite animals to localStorage:', error);
  }
};

const loadFavoriteIdsFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem(FAVORITE_IDS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch (error) {
    console.error('Failed to load favorite animals from localStorage:', error);
    return [];
  }
};

export const useAnimalStore = create<AnimalStore>((set, get) => ({
  animals,
  bucketList: loadBucketListFromStorage(),
  favoriteAnimalIds: loadFavoriteIdsFromStorage(),
  searchQuery: '',
  guessResults: {},
  familyFilter: 'all',
  habitatFilter: 'all',
  pettableFilter: 'all',
  sortOption: 'default',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFamilyFilter: (family) => set({ familyFilter: family }),
  setHabitatFilter: (habitat) => set({ habitatFilter: habitat }),
  setPettableFilter: (value) => set({ pettableFilter: value }),
  setSortOption: (value) => set({ sortOption: value }),
  clearFilters: () =>
    set({
      familyFilter: 'all',
      habitatFilter: 'all',
      pettableFilter: 'all',
      sortOption: 'default',
    }),

  addToBucketList: (animal) => set((state) => {
    if (!state.bucketList.find(item => item.id === animal.id)) {
      const newBucketList = [...state.bucketList, animal];
      saveBucketListToStorage(newBucketList);
      return { bucketList: newBucketList };
    }
    return state;
  }),

  removeFromBucketList: (animalId) => set((state) => {
    const newBucketList = state.bucketList.filter(animal => animal.id !== animalId);
    saveBucketListToStorage(newBucketList);
    return { bucketList: newBucketList };
  }),

  reorderBucketList: (dragIndex, hoverIndex) => set((state) => {
    const newBucketList = [...state.bucketList];
    const draggedItem = newBucketList[dragIndex];
    newBucketList.splice(dragIndex, 1);
    newBucketList.splice(hoverIndex, 0, draggedItem);
    saveBucketListToStorage(newBucketList);
    return { bucketList: newBucketList };
  }),

  recordGuess: (animal, userGuess) => set((state) => ({
    guessResults: {
      ...state.guessResults,
      [animal.id]: {
        animal,
        userGuess,
        isCorrect: userGuess === animal.isPettable
      }
    }
  })),

  getFilteredAnimals: () => {
    const { animals, searchQuery, familyFilter, habitatFilter, pettableFilter, sortOption } = get();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = animals.filter((animal) => {
      const matchesSearch = !normalizedQuery || animal.name.toLowerCase().includes(normalizedQuery);
      const matchesFamily = familyFilter === 'all' || animal.family === familyFilter;
      const matchesHabitat = habitatFilter === 'all' || getHabitatCategory(animal.location?.habitat) === habitatFilter;
      const matchesPettable =
        pettableFilter === 'all' ||
        (pettableFilter === 'pettable' && animal.isPettable) ||
        (pettableFilter === 'not-pettable' && !animal.isPettable);

      return matchesSearch && matchesFamily && matchesHabitat && matchesPettable;
    });

    switch (sortOption) {
      case 'alphabetical':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'reverse-alphabetical':
        return [...filtered].sort((a, b) => b.name.localeCompare(a.name));
      case 'pettable-first':
        return [...filtered].sort((a, b) => {
          if (a.isPettable === b.isPettable) return a.name.localeCompare(b.name);
          return a.isPettable ? -1 : 1;
        });
      case 'not-pettable-first':
        return [...filtered].sort((a, b) => {
          if (a.isPettable === b.isPettable) return a.name.localeCompare(b.name);
          return a.isPettable ? 1 : -1;
        });
      default:
        return filtered;
    }
  },

  clearBucketList: () => set(() => {
    saveBucketListToStorage([]);
    return { bucketList: [] };
  }),

  togglePetted: (animalId) => set((state) => {
    const newBucketList = state.bucketList.map((a) =>
      a.id === animalId ? { ...a, isPetted: !a.isPetted } : a
    );
    saveBucketListToStorage(newBucketList);
    return { bucketList: newBucketList };
  }),

  toggleFavorite: (animalId) => set((state) => {
    const isFavorite = state.favoriteAnimalIds.includes(animalId);
    const favoriteAnimalIds = isFavorite
      ? state.favoriteAnimalIds.filter((id) => id !== animalId)
      : [...state.favoriteAnimalIds, animalId];
    saveFavoriteIdsToStorage(favoriteAnimalIds);
    return { favoriteAnimalIds };
  }),

  isFavorite: (animalId) => get().favoriteAnimalIds.includes(animalId),
}));
