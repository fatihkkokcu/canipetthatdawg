import React from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import { PlusCircle } from 'lucide-react';
import { AnimalGrid } from '../components/AnimalGrid';
import { SearchResults } from '../components/SearchResults';
import { useAnimalStore } from '../store/animalStore';
import { DndItemTypes } from '../constants/dndTypes';
import { Animal } from '../types/Animal';
import { useToast } from '../context/ToastContext';

export const HomePage: React.FC = () => {
  const searchQuery = useAnimalStore(state => state.searchQuery);
  const addToBucketList = useAnimalStore(state => state.addToBucketList);
  const bucketList = useAnimalStore(state => state.bucketList);
  const { showToast } = useToast();

  // Show prompt while dragging available animal cards
  const isDraggingAvailableAnimal = useDragLayer((monitor) => monitor.isDragging() && monitor.getItemType() === DndItemTypes.AVAILABLE_ANIMAL_CARD);

  // Drop target for sticky bottom prompt
  const [{ isOver: isStickyOver, canDrop: canStickyDrop }, stickyDropRef] = useDrop<
    { animal: Animal },
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: DndItemTypes.AVAILABLE_ANIMAL_CARD,
    drop: (item) => {
      const exists = bucketList.some((b) => b.id === item.animal.id);
      if (exists) {
        showToast((
          <span>
            <span className="font-bold text-blue-600">{item.animal.name}</span> is already in your list
          </span>
        ), 'info');
      } else {
        addToBucketList(item.animal);
        showToast((
          <span>
            Added <span className="font-bold text-blue-600">{item.animal.name}</span> to your list
          </span>
        ), 'success');
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isStickyActiveDropZone = isStickyOver && canStickyDrop;
  const shouldShowDropPrompt = isDraggingAvailableAnimal || isStickyActiveDropZone;
  const stickyDropZoneOuterClassName = `fixed inset-x-0 bottom-6 z-[10000] flex justify-center px-4 transition-all duration-300 sm:px-6 ${
    shouldShowDropPrompt ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
  }`;
  const stickyDropZoneInnerClassName = `flex w-full max-w-3xl flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-6 text-center shadow-lg backdrop-blur-sm transition-all duration-300 ${
    isStickyActiveDropZone ? 'border-blue-500 bg-blue-50 shadow-2xl scale-[1.02]' : 'border-blue-300 bg-white/90'
  }`;

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero section */}
        <div className={`text-center mb-12 ${searchQuery ? 'mb-8' : ''}`}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Can I Pet That <span className="text-blue-600">Dawg</span>?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Test your knowledge about which animals are safe to pet. Guess, learn, and build your petting bucket list!
          </p>
        </div>

        {/* Search Results */}
        <SearchResults />

        {/* Animal grid - only show when not searching */}
        {!searchQuery && <AnimalGrid />}
      </div>

      {/* Sticky bottom drop zone (mirrors bucket list page behavior) */}
      <div ref={stickyDropRef} className={stickyDropZoneOuterClassName}>
        <div className={stickyDropZoneInnerClassName}>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow">
            <PlusCircle className="h-6 w-6" />
          </span>
          <p className="text-lg font-semibold text-gray-800">
            Drop to add this buddy to your list
          </p>
          <p className="text-sm text-gray-500">
            We will keep them cozy in your bucket list.
          </p>
        </div>
      </div>
    </div>
  );
};
