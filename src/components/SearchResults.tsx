import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimalCard } from './AnimalCard';
import { useAnimalStore } from '../store/animalStore';

export const SearchResults: React.FC = () => {
  const { searchQuery, getFilteredAnimals } = useAnimalStore();

  const filteredAnimals = getFilteredAnimals();

  // Infinite scroll for search results
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset pagination when search query or results change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, filteredAnimals.length]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredAnimals.length));
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [filteredAnimals.length, searchQuery]);

  const visibleAnimals = useMemo(() => filteredAnimals.slice(0, visibleCount), [filteredAnimals, visibleCount]);
  
  // Only render when searching, but keep hooks above always consistent
  if (!searchQuery.trim()) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="rounded-xl px-0 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 ps-6">
            Search Results for <span className="font-bold text-blue-600">{searchQuery}</span>
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 me-6 rounded-full">
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-0 justify-items-center">
              {visibleAnimals.map((animal) => (
                <div key={animal.id} className="transform hover:scale-105 transition-transform duration-200">
                  <AnimalCard animal={animal} isDraggable={true} />
                </div>
              ))}
            </div>
            {visibleCount < filteredAnimals.length && (
              <div ref={sentinelRef} className="w-full flex justify-center py-8 text-gray-500">
                Loading more...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
