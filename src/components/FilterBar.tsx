import React, { useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { useAnimalStore } from '../store/animalStore';

export const FilterBar: React.FC = () => {
  const animals = useAnimalStore(state => state.animals);
  const selectedFamily = useAnimalStore(state => state.selectedFamily);
  const pettableFilter = useAnimalStore(state => state.pettableFilter);
  const setSelectedFamily = useAnimalStore(state => state.setSelectedFamily);
  const setPettableFilter = useAnimalStore(state => state.setPettableFilter);

  const families = useMemo(() => {
    const familyCounts = animals.reduce<Record<string, number>>((acc, animal) => {
      acc[animal.family] = (acc[animal.family] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(familyCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([family]) => family);
  }, [animals]);

  const hasActiveFilters = selectedFamily !== '' || pettableFilter !== 'all';

  const clearFilters = () => {
    setSelectedFamily('');
    setPettableFilter('all');
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 text-gray-600">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      {/* Pettable filter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {(['all', 'pettable', 'not-pettable'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setPettableFilter(filter)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              pettableFilter === filter
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter === 'all' ? 'All' : filter === 'pettable' ? '🟢 Pettable' : '🔴 Not Pettable'}
          </button>
        ))}
      </div>

      {/* Family filter */}
      <select
        value={selectedFamily}
        onChange={(e) => setSelectedFamily(e.target.value)}
        className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All Families</option>
        {families.map((family) => (
          <option key={family} value={family}>
            {family}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
};
