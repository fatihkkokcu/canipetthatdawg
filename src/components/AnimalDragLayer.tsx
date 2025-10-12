import React from 'react';
import { useDragLayer, XYCoord } from 'react-dnd';
import { DndItemTypes } from '../constants/dndTypes';
import { Animal } from '../types/Animal';

type Dragged = { animal?: Animal } | null;

const CARD_WIDTH = 300;
const CARD_HEIGHT = 350;

function getItemStyles(initialOffset: XYCoord | null, currentOffset: XYCoord | null) {
  if (!initialOffset || !currentOffset) {
    return { display: 'none' as const };
  }

  const { x, y } = currentOffset;
  const left = x - CARD_WIDTH / 2;
  const top = y - CARD_HEIGHT / 2;
  const transform = `translate(${left}px, ${top}px)`;
  return {
    transform,
    WebkitTransform: transform,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  } as React.CSSProperties;
}

export const AnimalDragLayer: React.FC = () => {
  const {
    isDragging,
    itemType,
    item,
    initialClientOffset,
    currentClientOffset,
  } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    itemType: monitor.getItemType(),
    item: monitor.getItem() as Dragged,
    initialClientOffset: monitor.getInitialClientOffset(),
    currentClientOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || !item?.animal) return null;

  const a = item.animal as Animal;

  const isQuizCard = itemType === 'QUIZ_ANIMAL';
  const isAvailable = itemType === DndItemTypes.AVAILABLE_ANIMAL_CARD;
  const isBucket = itemType === DndItemTypes.BUCKET_ANIMAL_CARD;
  if (!isQuizCard && !isAvailable && !isBucket) return null;

  return (
    <div className="pointer-events-none fixed top-0 left-0 z-[10000]">
      <div style={getItemStyles(initialClientOffset, currentClientOffset)}>
        {/* Quiz-like card preview (front-only). Text only on Quiz. */}
        <div className="rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm border border-gray-100 p-6 w-[300px] h-[350px]">
          <div className="flex flex-col items-center justify-center h-full">
            <img
              src={a.image_url}
              alt={a.name}
              crossOrigin="anonymous"
              loading="eager"
              decoding="sync"
              className="w-24 h-24 object-contain mb-4"
            />
            <h3 className="text-2xl font-bold text-gray-800 text-center">{a.name}</h3>
            {isQuizCard && (
              <p className="text-gray-600 mt-2 text-center">Drag me to your answer!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
