export const DndItemTypes = {
  AVAILABLE_ANIMAL_CARD: 'AVAILABLE_ANIMAL_CARD',
  BUCKET_ANIMAL_CARD: 'BUCKET_ANIMAL_CARD',
} as const;

export type DndItemType = typeof DndItemTypes[keyof typeof DndItemTypes];

