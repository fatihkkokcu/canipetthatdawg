import React, { useRef, useState } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import { Download, Trash2, ArrowLeft, X, ArrowUpDown, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { AnimalCard } from '../components/AnimalCard';
import { DraggableAnimalCard } from '../components/DraggableAnimalCard';
import { Animal } from '../types/Animal';
import { SearchResults } from '../components/SearchResults';
import { DndItemTypes } from '../constants/dndTypes';
import { useAnimalStore } from '../store/animalStore';

type SortOption = 'default' | 'alphabetical' | 'reverse-alphabetical';

export const BucketListPage: React.FC = () => {
  const { bucketList, removeFromBucketList, reorderBucketList, clearBucketList, addToBucketList } = useAnimalStore();
  const exportRef = useRef<HTMLDivElement>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');

  const isDraggingAvailableAnimal = useDragLayer((monitor) => monitor.isDragging() && monitor.getItemType() === DndItemTypes.AVAILABLE_ANIMAL_CARD);

  const sortedBucketList = [...bucketList].sort((a, b) => {
    switch (sortOption) {
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'reverse-alphabetical':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const handleMove = (dragIndex: number, hoverIndex: number) => {
    reorderBucketList(dragIndex, hoverIndex);
  };

  const [{ isOver, canDrop }, drop] = useDrop<{ animal: Animal }, void, { isOver: boolean; canDrop: boolean }>({
    accept: DndItemTypes.AVAILABLE_ANIMAL_CARD,
    drop: (item) => {
      addToBucketList(item.animal);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActiveDropZone = isOver && canDrop;
  const shouldShowDropPrompt = isDraggingAvailableAnimal || isActiveDropZone;
  // Bottom-centered sticky drop zone container
  const stickyDropZoneOuterClassName = `fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 transition-all duration-300 sm:px-6 ${
    shouldShowDropPrompt ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
  }`;
  const stickyDropZoneInnerClassName = `flex w-full max-w-3xl flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-6 text-center shadow-lg backdrop-blur-sm transition-all duration-300 ${
    isActiveDropZone ? 'border-blue-500 bg-blue-50 shadow-2xl scale-[1.02]' : 'border-blue-300 bg-white/90'
  }`;

  const emptyDropZoneClassName = `border-4 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
    isActiveDropZone
      ? 'border-blue-500 bg-blue-50 shadow-xl'
      : shouldShowDropPrompt
      ? 'border-blue-400 bg-blue-50/70 shadow-lg'
      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
  }`;

  const exportToPNG = async () => {
    if (!exportRef.current) return;

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement('a');
      link.download = 'my-petting-bucket-list.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting to PNG:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Animals
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              My Petting Bucket List
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {bucketList.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none"
                  >
                    <option value="default">Order Added</option>
                    <option value="alphabetical">A to Z</option>
                    <option value="reverse-alphabetical">Z to A</option>
                  </select>
                </div>
                <button
                  onClick={clearBucketList}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
                <button
                  onClick={exportToPNG}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export PNG</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search Results */}
        <SearchResults />

        {/* Drop zone */}
        {bucketList.length === 0 ? (
          <div
            ref={drop}
            className={emptyDropZoneClassName}
          >
            <div className="text-6xl mb-4">🥹</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Your bucket list is empty
            </h2>
            <p className="text-gray-500 text-lg">
              Drag and drop animal cards from the home page to build your petting wishlist!
            </p>
            {shouldShowDropPrompt && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                <PlusCircle className="h-4 w-4" />
                Release to add your first animal
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-blue-100 bg-white/60 p-8 shadow-sm transition-all duration-300">
            <div
              ref={exportRef}
              // className="bg-white p-8 rounded-xl shadow-lg transition-all duration-300"
              className="transition-all duration-300"
            >
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
                🐾 My Petting Bucket List 🐾
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
                {sortOption === 'default' ? (
                  bucketList.map((animal, index) => (
                    <DraggableAnimalCard
                      key={animal.id}
                      animal={animal}
                      index={index}
                      onRemove={removeFromBucketList}
                      onMove={handleMove}
                    />
                  ))
                ) : (
                  sortedBucketList.map((animal) => (
                    <div key={animal.id} className="relative group">
                      <AnimalCard animal={animal} isDraggable={false} />
                      <button
                        onClick={() => removeFromBucketList(animal.id)}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {bucketList.length < 8 && (
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-lg">
                  Drag a new card and drop it into the glowing zone to keep growing your list!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {bucketList.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-600">
              You have <span className="font-bold text-blue-600">{bucketList.length}</span> animals in your bucket list
            </p>
          </div>
        )}
      </div>

      {bucketList.length > 0 && (
        <div ref={drop} className={stickyDropZoneOuterClassName}>
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
      )}
    </div>
  );
};
