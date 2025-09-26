import React, { useState, useRef, useCallback } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { Animal } from '../types/Animal';
import { useAnimalStore } from '../store/animalStore';
import { FamilyModal } from './FamilyModal';
import { animals } from '../data/animals';
import { DndItemTypes } from '../constants/dndTypes';

interface AnimalCardProps {
  animal: Animal;
  isDraggable?: boolean;
  // When rendered inside the bucket list, hide quiz buttons
  // and show a petted toggle button instead.
  inBucketList?: boolean;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({ animal, isDraggable = true, inBucketList = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { recordGuess, guessResults, togglePetted } = useAnimalStore();

  const guessResult = guessResults[animal.id];

  const [{ isDragging }, drag] = useDrag(() => ({
    type: DndItemTypes.AVAILABLE_ANIMAL_CARD,
    item: { animal },
    canDrag: isDraggable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [animal, isDraggable]);

  const setCardRef = useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node;
    if (isDraggable) {
      drag(node);
    } else {
      drag(null);
    }
  }, [drag, isDraggable]);

  const handleGuess = (guess: boolean) => {
    if (hasGuessed) return;
    
    recordGuess(animal, guess);
    setHasGuessed(true);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('application/json', JSON.stringify(animal));
  };

  const resetCard = () => {
    setHasGuessed(false);
    setIsFlipped(false);
  };

  const handleMouseEnter = () => {
    setShowFamilyModal(true);
  };

  const handleMouseLeave = () => {
    setShowFamilyModal(false);
  };

  // Get all animals from the same family
  const familyAnimals = animals.filter(a => a.family === animal.family);

  const isPetted = Boolean(animal.isPetted);

  return (
    <div className="relative">
      <div 
        ref={setCardRef}
        className={`relative w-80 h-96 cursor-grab active:cursor-grabbing`}
        style={{ opacity: isDragging ? 0.65 : 1 }}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className={`absolute inset-0 transition-all duration-700 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of card */}
          <div 
            className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl shadow-lg border-2 hover:shadow-xl transition-all duration-300 ${
              inBucketList && isPetted
                ? 'bg-blue-100 border-blue-200'
                : 'bg-white/70 backdrop-blur-sm border-white/60'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="relative h-full flex flex-col">
              {/* Flip button */}
              <button
                onClick={() => setIsFlipped(true)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200 z-10"
              >
                <RotateCcw className="h-4 w-4 text-gray-600" />
              </button>

              {/* Reset button (only show if has guessed) */}
              {/* {hasGuessed && (
                <button
                  onClick={resetCard}
                  className="absolute top-4 left-4 p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200 z-10"
                >
                  <RotateCcw className="h-4 w-4 text-blue-600" />
                </button>
              )} */}

              {/* Animal image */}
              <div className="flex-1 flex items-center justify-center p-8">
                <img 
                  src={animal.image_url} 
                  alt={animal.name}
                  crossOrigin="anonymous"
                  className="w-32 h-32 object-contain"
                />
              </div>

              {/* Animal name */}
              <div className="text-center px-6 pb-4">
                <h3 className={`text-2xl font-bold mb-6 ${inBucketList && isPetted ? 'text-blue-700' : 'text-gray-800'}`}>{animal.name}</h3>
              </div>

              {/* Guess section or Bucket List Petted Toggle */}
              {inBucketList ? (
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => togglePetted(animal.id)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors duration-200 ${
                        isPetted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      aria-label={isPetted ? 'Marked as petted' : 'Mark as petted'}
                    >
                      <Check className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              ) : (
                !hasGuessed ? (
                  <div className="px-6 pb-6">
                    <p className="text-lg font-medium text-gray-700 mb-4 text-center">
                      Can I pet that dawg?
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleGuess(true)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Check className="h-5 w-5" />
                        Yes
                      </button>
                      <button
                        onClick={() => handleGuess(false)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <X className="h-5 w-5" />
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 pb-6">
                    <div className={`text-center p-4 rounded-xl ${
                      guessResult?.isCorrect 
                        ? 'bg-green-100 border border-green-200' 
                        : 'bg-red-100 border border-red-200'
                    }`}>
                      <p className={`text-lg font-bold ${
                        guessResult?.isCorrect ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {guessResult?.isCorrect ? ' Correct!' : ' Wrong!'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        guessResult?.isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {animal.isPettable 
                          ? `${animal.name} is safe to pet!` 
                          : `${animal.name} is NOT safe to pet!`
                        }
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Back of card */}
          <div 
            className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl shadow-lg border-2 rotate-y-180 ${
              inBucketList && isPetted
                ? 'bg-blue-100 border-blue-200'
                : 'bg-white/70 backdrop-blur-sm border-white/60'
            }`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="relative h-full flex flex-col">
              {/* Back button */}
              <button
                onClick={() => setIsFlipped(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200 z-10"
              >
                <RotateCcw className="h-4 w-4 text-gray-600" />
              </button>

              {/* GIF container */}
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <img 
                  src={animal.gif_url} 
                  alt={`${animal.name} interaction`}
                  crossOrigin="anonymous"
                  className="w-full h-64 object-cover rounded-xl mb-4"
                />
                <h3 className={`text-xl font-bold mb-2 ${inBucketList && isPetted ? 'text-blue-700' : 'text-gray-800'}`}>{animal.name}</h3>
                <p className={`text-lg font-semibold ${
                  animal.isPettable ? 'text-green-600' : 'text-red-600'
                }`}>
                  {animal.isPettable ? ' Safe to pet!' : ' Do NOT pet!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FamilyModal 
        animal={animal}
        familyAnimals={familyAnimals}
        cardRef={cardRef}
        isVisible={showFamilyModal}
      />
    </div>
  );
};




