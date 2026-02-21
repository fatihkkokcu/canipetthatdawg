import { animals } from '../data/animals';
import { useAnimalStore } from '../store/animalStore';

export const resetAnimalStore = () => {
  useAnimalStore.setState({
    animals,
    bucketList: [],
    favoriteAnimalIds: [],
    searchQuery: '',
    guessResults: {},
    familyFilter: 'all',
    habitatFilter: 'all',
    pettableFilter: 'all',
    sortOption: 'default',
  });
};
