import React, { useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { X } from 'lucide-react';
import { AnimalCard } from './AnimalCard';
import { DndItemTypes } from '../constants/dndTypes';
import { Animal } from '../types/Animal';
import { getEmptyImage } from 'react-dnd-html5-backend';

interface DraggableAnimalCardProps {
  animal: Animal;
  index: number;
  onRemove: (animalId: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  id: string;
  index: number;
  animal: Animal;
}

export const DraggableAnimalCard: React.FC<DraggableAnimalCardProps> = ({
  animal,
  index,
  onRemove,
  onMove,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: DndItemTypes.BUCKET_ANIMAL_CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: DndItemTypes.BUCKET_ANIMAL_CARD,
    item: () => {
      return { id: animal.id, index, animal };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Hide the default browser preview; custom layer handles it
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className="relative group cursor-move"
    >
      <AnimalCard animal={animal} isDraggable={false} inBucketList />
      <button
        onClick={() => onRemove(animal.id)}
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-100 xl:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 z-10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

