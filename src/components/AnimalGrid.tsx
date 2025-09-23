import React from 'react';
import { AnimalCard } from './AnimalCard';
import { useAnimalStore } from '../store/animalStore';

export const AnimalGrid: React.FC = () => {
  const getFilteredAnimals = useAnimalStore(state => state.getFilteredAnimals);
  const filteredAnimals = getFilteredAnimals();

  if (filteredAnimals.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-gray-500">No animals found matching your search.</p>
        <p className="text-gray-400 mt-2">Try searching for a different animal!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-0 justify-items-center">
      {filteredAnimals.map((animal) => (
        <AnimalCard key={animal.id} animal={animal} />
      ))}
    </div>
  );
};
