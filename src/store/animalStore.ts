import { create } from 'zustand';
import { Animal, GuessResult } from '../types/Animal';
import { animals } from '../data/animals';

interface AnimalStore {
  animals: Animal[];
  bucketList: Animal[];
  searchQuery: string;
  guessResults: Record<string, GuessResult>;
  
  setSearchQuery: (query: string) => void;
  addToBucketList: (animal: Animal) => void;
  removeFromBucketList: (animalId: string) => void;
  reorderBucketList: (dragIndex: number, hoverIndex: number) => void;
  recordGuess: (animal: Animal, userGuess: boolean) => void;
  getFilteredAnimals: () => Animal[];
  clearBucketList: () => void;
}

// LocalStorage utilities
const BUCKET_LIST_KEY = 'canipetthatdawg-bucket-list';

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

export const useAnimalStore = create<AnimalStore>((set, get) => ({
  animals,
  bucketList: loadBucketListFromStorage(),
  searchQuery: '',
  guessResults: {},

  setSearchQuery: (query) => set({ searchQuery: query }),

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
    const { animals, searchQuery } = get();
    if (!searchQuery) return animals;
    return animals.filter(animal => 
      animal.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },

  clearBucketList: () => set(() => {
    saveBucketListToStorage([]);
    return { bucketList: [] };
  })
}));