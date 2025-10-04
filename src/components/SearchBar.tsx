import React from 'react';
import { Search, X } from 'lucide-react';
import { useAnimalStore } from '../store/animalStore';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery } = useAnimalStore();

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search animals..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && searchQuery) {
            setSearchQuery('');
          }
        }}
        className="w-full pl-10 pr-10 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none text-gray-700 placeholder-gray-400 text-sm"
      />
      {searchQuery && (
        <button
          type="button"
          aria-label="Clear search"
          title="Clear"
          onClick={() => setSearchQuery('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <div className='p-1 rounded-full bg-gray-200 hover:bg-gray-300'>
            <X className="h-4 w-4" />
          </div>
        </button>
      )}
    </div>
  );
};
