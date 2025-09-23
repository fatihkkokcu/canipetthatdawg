import React from 'react';
import { AnimalGrid } from '../components/AnimalGrid';
import { SearchResults } from '../components/SearchResults';
import { useAnimalStore } from '../store/animalStore';

export const HomePage: React.FC = () => {
  const searchQuery = useAnimalStore(state => state.searchQuery);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero section */}
        <div className={`text-center mb-12 ${searchQuery ? 'mb-8' : ''}`}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Can I Pet That <span className="text-blue-600">Dawg</span>?
          </h1>
          {!searchQuery && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Test your knowledge about which animals are safe to pet. Guess, learn, and build your petting bucket list!
            </p>
          )}
          {searchQuery && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Search results for "<span className="font-semibold text-blue-600">{searchQuery}</span>" - drag cards to your bucket list!
            </p>
          )}
        </div>

        {/* Search Results */}
        <SearchResults />

        {/* Animal grid - only show when not searching */}
        {!searchQuery && <AnimalGrid />}
      </div>
    </div>
  );
};
