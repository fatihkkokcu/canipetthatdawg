export type HabitatCategory =
  | 'Forest'
  | 'Grassland'
  | 'Desert'
  | 'Ocean'
  | 'Freshwater'
  | 'Wetland'
  | 'Mountain'
  | 'Arctic'
  | 'Urban'
  | 'Farm'
  | 'Global'
  | 'Other';

export const HABITAT_CATEGORY_ORDER: HabitatCategory[] = [
  'Forest',
  'Grassland',
  'Desert',
  'Ocean',
  'Freshwater',
  'Wetland',
  'Mountain',
  'Arctic',
  'Urban',
  'Farm',
  'Global',
  'Other',
];

const CATEGORY_KEYWORDS: Array<{ category: HabitatCategory; keywords: string[] }> = [
  {
    category: 'Global',
    keywords: ['worldwide', 'world wide', 'global', 'oceans worldwide'],
  },
  {
    category: 'Arctic',
    keywords: ['arctic', 'sub-arctic', 'sub arctic', 'polar', 'tundra', 'ice'],
  },
  {
    category: 'Ocean',
    keywords: ['ocean', 'sea', 'marine', 'coastal', 'coast', 'reef', 'kelp', 'open water'],
  },
  {
    category: 'Freshwater',
    keywords: ['freshwater', 'river', 'lake', 'stream'],
  },
  {
    category: 'Wetland',
    keywords: ['wetland', 'swamp', 'marsh', 'mangrove', 'estuary', 'tidal flat'],
  },
  {
    category: 'Desert',
    keywords: ['desert', 'dune', 'arid'],
  },
  {
    category: 'Mountain',
    keywords: ['mountain', 'alpine', 'highland', 'himalaya', 'peak', 'montane'],
  },
  {
    category: 'Urban',
    keywords: ['urban', 'city', 'neighborhood', 'home', 'homes', 'subway', 'sewer'],
  },
  {
    category: 'Farm',
    keywords: ['farm', 'farms', 'ranch', 'ranches', 'stable', 'domesticated', 'pet stores'],
  },
  {
    category: 'Forest',
    keywords: ['forest', 'woodland', 'rainforest', 'jungle', 'bamboo', 'canopy'],
  },
  {
    category: 'Grassland',
    keywords: ['savannah', 'grassland', 'prairie', 'steppe'],
  },
];

export const getHabitatCategory = (habitat?: string): HabitatCategory => {
  if (!habitat) return 'Other';
  const normalized = habitat.toLowerCase();
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.category;
    }
  }
  return 'Other';
};
