import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { animals } from '../data/animals';
import { useAnimalStore } from '../store/animalStore';
import { AnimalFilters } from './AnimalFilters';
import { getHabitatCategory } from '../utils/habitat';
import { resetAnimalStore } from '../test/storeTestUtils';

const renderWithRoute = (route: string) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AnimalFilters />
    </MemoryRouter>
  );
};

describe('AnimalFilters', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAnimalStore();
  });

  it('updates store filters and clears them', async () => {
    const user = userEvent.setup();
    const target = animals.find((entry) => Boolean(entry.location?.habitat)) ?? animals[0];
    const targetHabitat = getHabitatCategory(target.location?.habitat);

    renderWithRoute('/');

    await user.selectOptions(screen.getByLabelText(/family/i), target.family);
    await user.selectOptions(screen.getByLabelText(/habitat/i), targetHabitat);
    await user.selectOptions(screen.getByLabelText(/safety/i), target.isPettable ? 'pettable' : 'not-pettable');
    await user.selectOptions(screen.getByLabelText(/sort/i), 'alphabetical');

    expect(useAnimalStore.getState().familyFilter).toBe(target.family);
    expect(useAnimalStore.getState().habitatFilter).toBe(targetHabitat);
    expect(useAnimalStore.getState().pettableFilter).toBe(target.isPettable ? 'pettable' : 'not-pettable');
    expect(useAnimalStore.getState().sortOption).toBe('alphabetical');

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(useAnimalStore.getState().familyFilter).toBe('all');
    expect(useAnimalStore.getState().habitatFilter).toBe('all');
    expect(useAnimalStore.getState().pettableFilter).toBe('all');
    expect(useAnimalStore.getState().sortOption).toBe('default');
  });

  it('copies the current filter URL to clipboard', async () => {
    const user = userEvent.setup();
    const family = encodeURIComponent(animals[0].family);
    const route = `/?family=${family}&sort=alphabetical`;
    renderWithRoute(route);

    await user.click(screen.getByRole('button', { name: /copy link/i }));

    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
  });
});
