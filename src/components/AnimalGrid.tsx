import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimalCard } from './AnimalCard';
import { useAnimalStore } from '../store/animalStore';

export const AnimalGrid: React.FC = () => {
  const getFilteredAnimals = useAnimalStore(state => state.getFilteredAnimals);
  const filteredAnimals = getFilteredAnimals();

  // Infinite scroll state
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset when the list changes (e.g., dataset updates)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filteredAnimals.length]);

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
  }, [filteredAnimals.length]);

  const visibleAnimals = useMemo(() => filteredAnimals.slice(0, visibleCount), [filteredAnimals, visibleCount]);

  if (filteredAnimals.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-gray-500">No animals found matching your search.</p>
        <p className="text-gray-400 mt-2">Try searching for a different animal!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-8 gap-x-0 justify-items-center">
        {visibleAnimals.map((animal) => (
          <AnimalCard key={animal.id} animal={animal} />
        ))}
      </div>
      {visibleCount < filteredAnimals.length && (
        <div ref={sentinelRef} className="w-full flex justify-center py-8 text-gray-500">
          Loading more...
        </div>
      )}
    </>
  );
};
