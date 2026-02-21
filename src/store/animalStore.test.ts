import { describe, expect, it, beforeEach } from 'vitest';
import { animals } from '../data/animals';
import { useAnimalStore } from './animalStore';
import { getHabitatCategory } from '../utils/habitat';
import { resetAnimalStore } from '../test/storeTestUtils';

const FAVORITE_IDS_KEY = 'canipetthatdawg-favorite-animal-ids';

describe('animalStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAnimalStore();
  });

  it('persists favorites in localStorage when toggled', () => {
    const animalId = animals[0].id;

    useAnimalStore.getState().toggleFavorite(animalId);
    expect(useAnimalStore.getState().favoriteAnimalIds).toContain(animalId);
    expect(JSON.parse(localStorage.getItem(FAVORITE_IDS_KEY) ?? '[]')).toContain(animalId);

    useAnimalStore.getState().toggleFavorite(animalId);
    expect(useAnimalStore.getState().favoriteAnimalIds).not.toContain(animalId);
    expect(JSON.parse(localStorage.getItem(FAVORITE_IDS_KEY) ?? '[]')).not.toContain(animalId);
  });

  it('applies combined filters and sort order correctly', () => {
    const sample = animals.find((entry) => Boolean(entry.location?.habitat)) ?? animals[0];
    const expectedHabitat = getHabitatCategory(sample.location?.habitat);
    const expectedPettable = sample.isPettable ? 'pettable' : 'not-pettable';

    useAnimalStore.setState({
      searchQuery: '',
      familyFilter: sample.family,
      habitatFilter: expectedHabitat,
      pettableFilter: expectedPettable,
      sortOption: 'alphabetical',
    });

    const filtered = useAnimalStore.getState().getFilteredAnimals();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((entry) => entry.family === sample.family)).toBe(true);
    expect(filtered.every((entry) => getHabitatCategory(entry.location?.habitat) === expectedHabitat)).toBe(true);
    expect(filtered.every((entry) => entry.isPettable === sample.isPettable)).toBe(true);

    const sortedNames = [...filtered].map((entry) => entry.name);
    const manuallySortedNames = [...sortedNames].sort((a, b) => a.localeCompare(b));
    expect(sortedNames).toEqual(manuallySortedNames);
  });

  it('returns empty list for impossible search query', () => {
    useAnimalStore.setState({ searchQuery: '__no_such_animal__' });
    const filtered = useAnimalStore.getState().getFilteredAnimals();
    expect(filtered).toHaveLength(0);
  });
});
