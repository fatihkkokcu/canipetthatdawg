import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { animals } from '../data/animals';
import { ToastProvider } from '../context/ToastContext';
import { useAnimalStore } from '../store/animalStore';
import { resetAnimalStore } from '../test/storeTestUtils';
import { AnimalDetailPage } from './AnimalDetailPage';

const BUCKET_LIST_KEY = 'canipetthatdawg-bucket-list';
const FAVORITE_IDS_KEY = 'canipetthatdawg-favorite-animal-ids';

const renderDetailPage = (animalId: string) => {
  return render(
    <MemoryRouter initialEntries={[`/animal/${animalId}`]}>
      <ToastProvider>
        <Routes>
          <Route path="/animal/:animalId" element={<AnimalDetailPage />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('AnimalDetailPage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAnimalStore();
  });

  it('renders not found state for unknown animal id', () => {
    renderDetailPage('not-a-real-animal');
    expect(screen.getByText(/animal not found/i)).toBeInTheDocument();
  });

  it('toggles favorites and bucket list persistence', async () => {
    const user = userEvent.setup();
    const sample = animals[0];
    renderDetailPage(sample.id);

    await user.click(screen.getByRole('button', { name: /add to favorites/i }));
    expect(screen.getByRole('button', { name: /favorited/i })).toBeInTheDocument();
    expect(useAnimalStore.getState().favoriteAnimalIds).toContain(sample.id);
    expect(JSON.parse(localStorage.getItem(FAVORITE_IDS_KEY) ?? '[]')).toContain(sample.id);

    await user.click(screen.getByRole('button', { name: /add to bucket list/i }));
    expect(screen.getByRole('button', { name: /remove from bucket list/i })).toBeInTheDocument();

    const storedBucketList = JSON.parse(localStorage.getItem(BUCKET_LIST_KEY) ?? '[]');
    expect(storedBucketList.some((entry: { id: string }) => entry.id === sample.id)).toBe(true);

    await user.click(screen.getByRole('button', { name: /remove from bucket list/i }));
    expect(screen.getByRole('button', { name: /add to bucket list/i })).toBeInTheDocument();
  });
});
