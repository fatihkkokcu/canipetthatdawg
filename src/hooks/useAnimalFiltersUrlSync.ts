import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AnimalSortOption,
  HabitatFilterOption,
  PettableFilterOption,
  useAnimalStore,
} from '../store/animalStore';
import { HABITAT_CATEGORY_ORDER } from '../utils/habitat';

const CONTROLLED_FILTER_KEYS = ['q', 'family', 'habitat', 'safety', 'sort'] as const;
const CONTROLLED_FILTER_KEY_SET = new Set<string>(CONTROLLED_FILTER_KEYS);

const SAFETY_OPTIONS: PettableFilterOption[] = ['all', 'pettable', 'not-pettable'];
const SORT_OPTIONS: AnimalSortOption[] = [
  'default',
  'alphabetical',
  'reverse-alphabetical',
  'pettable-first',
  'not-pettable-first',
];
const HABITAT_OPTIONS: HabitatFilterOption[] = ['all', ...HABITAT_CATEGORY_ORDER];

const serializeParams = (params: URLSearchParams): string => {
  return Array.from(params.entries())
    .sort((a, b) => {
      const keyCompare = a[0].localeCompare(b[0]);
      if (keyCompare !== 0) return keyCompare;
      return a[1].localeCompare(b[1]);
    })
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

export const useAnimalFiltersUrlSync = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const animals = useAnimalStore((state) => state.animals);
  const searchQuery = useAnimalStore((state) => state.searchQuery);
  const familyFilter = useAnimalStore((state) => state.familyFilter);
  const habitatFilter = useAnimalStore((state) => state.habitatFilter);
  const pettableFilter = useAnimalStore((state) => state.pettableFilter);
  const sortOption = useAnimalStore((state) => state.sortOption);

  const setSearchQuery = useAnimalStore((state) => state.setSearchQuery);
  const setFamilyFilter = useAnimalStore((state) => state.setFamilyFilter);
  const setHabitatFilter = useAnimalStore((state) => state.setHabitatFilter);
  const setPettableFilter = useAnimalStore((state) => state.setPettableFilter);
  const setSortOption = useAnimalStore((state) => state.setSortOption);

  const didHydrateFromUrlRef = useRef(false);
  const familyOptions = useMemo(() => new Set(animals.map((animal) => animal.family)), [animals]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const q = params.get('q') ?? '';
    const familyParam = params.get('family');
    const habitatParam = params.get('habitat');
    const safetyParam = params.get('safety');
    const sortParam = params.get('sort');

    const nextFamily = familyParam && familyOptions.has(familyParam) ? familyParam : 'all';
    const nextHabitat =
      habitatParam && HABITAT_OPTIONS.includes(habitatParam as HabitatFilterOption)
        ? (habitatParam as HabitatFilterOption)
        : 'all';
    const nextSafety =
      safetyParam && SAFETY_OPTIONS.includes(safetyParam as PettableFilterOption)
        ? (safetyParam as PettableFilterOption)
        : 'all';
    const nextSort =
      sortParam && SORT_OPTIONS.includes(sortParam as AnimalSortOption)
        ? (sortParam as AnimalSortOption)
        : 'default';

    if (searchQuery !== q) setSearchQuery(q);
    if (familyFilter !== nextFamily) setFamilyFilter(nextFamily);
    if (habitatFilter !== nextHabitat) setHabitatFilter(nextHabitat);
    if (pettableFilter !== nextSafety) setPettableFilter(nextSafety);
    if (sortOption !== nextSort) setSortOption(nextSort);

    didHydrateFromUrlRef.current = true;
  }, [
    location.search,
    familyOptions,
    familyFilter,
    habitatFilter,
    pettableFilter,
    searchQuery,
    setFamilyFilter,
    setHabitatFilter,
    setPettableFilter,
    setSearchQuery,
    setSortOption,
    sortOption,
  ]);

  useEffect(() => {
    if (!didHydrateFromUrlRef.current) return;

    const currentParams = new URLSearchParams(location.search);
    const nextParams = new URLSearchParams();

    for (const [key, value] of currentParams.entries()) {
      if (!CONTROLLED_FILTER_KEY_SET.has(key)) {
        nextParams.append(key, value);
      }
    }

    const normalizedSearchQuery = searchQuery.trim();
    if (normalizedSearchQuery) nextParams.set('q', normalizedSearchQuery);
    if (familyFilter !== 'all') nextParams.set('family', familyFilter);
    if (habitatFilter !== 'all') nextParams.set('habitat', habitatFilter);
    if (pettableFilter !== 'all') nextParams.set('safety', pettableFilter);
    if (sortOption !== 'default') nextParams.set('sort', sortOption);

    const currentSerialized = serializeParams(currentParams);
    const nextSerialized = serializeParams(nextParams);
    if (currentSerialized === nextSerialized) return;

    navigate(
      {
        pathname: location.pathname,
        search: nextSerialized ? `?${nextSerialized}` : '',
      },
      { replace: true }
    );
  }, [familyFilter, habitatFilter, location.pathname, location.search, navigate, pettableFilter, searchQuery, sortOption]);
};
