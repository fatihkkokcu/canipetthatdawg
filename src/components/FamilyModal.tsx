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

  // Calculate position to always show on the right side of the card
  const getModalPosition = () => {
    if (!cardRef.current) return { left: 0, top: 0, transform: '' };
    
    const cardRect = cardRef.current.getBoundingClientRect();
    const modalWidth = 320; // Approximate modal width
    const modalHeight = 200; // Approximate modal height
    const spacing = 16; // Gap between card and modal
    
    const viewportWidth = window.innerWidth;
    
    let position = { left: 0, top: 0, transform: '' };
    
    // Always position to the right of the card (relative to document)
    position.left = cardRect.right + spacing + window.scrollX;
    position.top = cardRect.top + (cardRect.height - modalHeight) / 2 + window.scrollY;
    
    // Ensure modal stays within viewport bounds horizontally
    position.left = Math.min(position.left, viewportWidth + window.scrollX - modalWidth - 8);
    
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
          Other animals in this family:
        </p>
      </div>
      
      <div className="space-y-2">
        {otherFamilyAnimals.map((familyAnimal) => (
          <div 
            key={familyAnimal.id}
            className="flex items-center gap-3 p-2 bg-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <img 
              src={familyAnimal.image_url} 
              alt={familyAnimal.name}
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
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {otherFamilyAnimals.length} other animal{otherFamilyAnimals.length !== 1 ? 's' : ''} in {animal.family}
        </p>
      </div>
    </div>,
    document.body
  );
};
