import React from 'react';
import { AnimalCard } from './AnimalCard';
import { useAnimalStore } from '../store/animalStore';

export const SearchResults: React.FC = () => {
  const { searchQuery, getFilteredAnimals } = useAnimalStore();
  
  // Only show search results if there's an active search query
  if (!searchQuery.trim()) {
    return null;
  }

  const filteredAnimals = getFilteredAnimals();

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Search Results for "{searchQuery}"
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filteredAnimals.length} {filteredAnimals.length === 1 ? 'result' : 'results'}
          </span>
        </div>
        
        {filteredAnimals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-500 text-lg">No animals found matching your search.</p>
            <p className="text-gray-400 text-sm mt-1">Try searching for a different animal!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filteredAnimals.map((animal) => (
              <div key={animal.id} className="transform hover:scale-105 transition-transform duration-200">
                <AnimalCard animal={animal} isDraggable={true} />
              </div>
            ))}
          </div>
        )}
        
        {filteredAnimals.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              💡 Drag any card to your bucket list to save it for later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
