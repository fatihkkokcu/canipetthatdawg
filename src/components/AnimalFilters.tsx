import React, { useMemo } from 'react';
import { Funnel, FunnelX } from 'lucide-react';
import {
  AnimalSortOption,
  HabitatFilterOption,
  PettableFilterOption,
  useAnimalStore,
} from '../store/animalStore';
import { HABITAT_CATEGORY_ORDER, getHabitatCategory } from '../utils/habitat';

const pettableOptions: Array<{ value: PettableFilterOption; label: string }> = [
  { value: 'all', label: 'All safety levels' },
  { value: 'pettable', label: 'Pettable only' },
  { value: 'not-pettable', label: 'Not pettable only' },
];

const sortOptions: Array<{ value: AnimalSortOption; label: string }> = [
  { value: 'default', label: 'Default order' },
  { value: 'alphabetical', label: 'A to Z' },
  { value: 'reverse-alphabetical', label: 'Z to A' },
  { value: 'pettable-first', label: 'Pettable first' },
  { value: 'not-pettable-first', label: 'Not pettable first' },
];

export const AnimalFilters: React.FC = () => {
  const animals = useAnimalStore((state) => state.animals);
  const familyFilter = useAnimalStore((state) => state.familyFilter);
  const habitatFilter = useAnimalStore((state) => state.habitatFilter);
  const pettableFilter = useAnimalStore((state) => state.pettableFilter);
  const sortOption = useAnimalStore((state) => state.sortOption);
  const setFamilyFilter = useAnimalStore((state) => state.setFamilyFilter);
  const setHabitatFilter = useAnimalStore((state) => state.setHabitatFilter);
  const setPettableFilter = useAnimalStore((state) => state.setPettableFilter);
  const setSortOption = useAnimalStore((state) => state.setSortOption);
  const clearFilters = useAnimalStore((state) => state.clearFilters);

  const familyOptions = useMemo(() => {
    return Array.from(new Set(animals.map((animal) => animal.family).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [animals]);

  const habitatOptions = useMemo(() => {
    const usedCategories = new Set(animals.map((animal) => getHabitatCategory(animal.location?.habitat)));
    return HABITAT_CATEGORY_ORDER.filter((category) => usedCategories.has(category));
  }, [animals]);

  const hasActiveFilters =
    familyFilter !== 'all' || habitatFilter !== 'all' || pettableFilter !== 'all' || sortOption !== 'default';

  return (
    <section className="mb-8 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-700">
          <Funnel className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Filters</h2>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            hasActiveFilters
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          <FunnelX className="h-4 w-4" />
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm text-gray-600">
          <span className="font-medium">Family</span>
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All families</option>
            {familyOptions.map((family) => (
              <option key={family} value={family}>
                {family}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-gray-600">
          <span className="font-medium">Habitat</span>
          <select
            value={habitatFilter}
            onChange={(e) => setHabitatFilter(e.target.value as HabitatFilterOption)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All habitats</option>
            {habitatOptions.map((habitat) => (
              <option key={habitat} value={habitat}>
                {habitat}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-gray-600">
          <span className="font-medium">Safety</span>
          <select
            value={pettableFilter}
            onChange={(e) => setPettableFilter(e.target.value as PettableFilterOption)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {pettableOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-gray-600">
          <span className="font-medium">Sort</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as AnimalSortOption)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
};
