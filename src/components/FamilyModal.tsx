import React from 'react';
import { createPortal } from 'react-dom';
import { Animal } from '../types/Animal';

interface FamilyModalProps {
  animal: Animal;
  familyAnimals: Animal[];
  cardRef: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
}

export const FamilyModal: React.FC<FamilyModalProps> = ({ 
  animal, 
  familyAnimals, 
  cardRef, 
  isVisible 
}) => {
  if (!isVisible || familyAnimals.length <= 1) return null;

  // Filter out the current animal from the family list
  const otherFamilyAnimals = familyAnimals.filter(a => a.id !== animal.id);

  if (otherFamilyAnimals.length === 0) return null;

  // Calculate position: default to right; flip to left for rightmost cards
  const getModalPosition = () => {
    if (!cardRef.current) return { left: 0, top: 0, transform: '' };
    
    const cardRect = cardRef.current.getBoundingClientRect();
    const modalWidth = 320; // Approximate modal width
    const modalHeight = 200; // Approximate modal height
    const spacing = 16; // Gap between card and modal
    
    const viewportWidth = window.innerWidth;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    let position = { left: 0, top: 0, transform: '' };
    
    // First try placing on the right of the card
    const rightPreferredLeft = cardRect.right + spacing + scrollX;
    const hasSpaceOnRight = rightPreferredLeft + modalWidth <= viewportWidth + scrollX - 8;

    if (hasSpaceOnRight) {
      position.left = rightPreferredLeft;
    } else {
      // Not enough space on the right — place to the left of the card
      const leftPreferredLeft = cardRect.left + scrollX - spacing - modalWidth;
      // Clamp to keep within viewport with a small margin
      position.left = Math.max(scrollX + 8, Math.min(leftPreferredLeft, viewportWidth + scrollX - modalWidth - 8));
    }

    // Vertically center relative to the card; clamp within viewport a bit
    const preferredTop = cardRect.top + (cardRect.height - modalHeight) / 2 + scrollY;
    position.top = Math.max(scrollY + 8, Math.min(preferredTop, scrollY + window.innerHeight - modalHeight - 8));
    
    return position;
  };
  
  const modalPosition = getModalPosition();

  return createPortal(
    <div 
      className="absolute z-[9999] bg-white/70 backdrop-blur-sm rounded-lg shadow-xl p-4 w-80"
      style={{
        left: modalPosition.left,
        top: modalPosition.top,
        transform: modalPosition.transform
      }}
    >
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          Family: {animal.family}
        </h3>
        <p className="text-sm text-gray-600">
          Other animals in this family
        </p>
      </div>
      
      <div className="space-y-2">
        {otherFamilyAnimals.map((familyAnimal) => (
          <div 
            key={familyAnimal.id}
            className="flex items-center gap-3 p-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <img 
              src={familyAnimal.image_url} 
              alt={familyAnimal.name}
              loading="lazy"
              decoding="async"
              className="w-8 h-8 object-contain"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-800 text-sm">
                {familyAnimal.name}
              </p>
              <p className={`text-xs ${
                familyAnimal.isPettable ? 'text-green-600' : 'text-red-600'
              }`}>
                {familyAnimal.isPettable ? '✅ Pettable' : '❌ Not pettable'}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-300">
        <p className="text-xs text-gray-500 text-center">
          {otherFamilyAnimals.length} other animal{otherFamilyAnimals.length !== 1 ? 's' : ''} in {animal.family}
        </p>
      </div>
    </div>,
    document.body
  );
};
