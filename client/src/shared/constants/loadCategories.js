export const LOAD_CATEGORIES = [
  {
    key: 'Agriculture',
    label: 'Agriculture',
    legacyKeys: ['Agricultural Products', 'agriculture'],
    testText: 'Agriculture',
  },
  {
    key: 'Construction',
    label: 'Construction',
    legacyKeys: ['Construction Materials', 'construction'],
    testText: 'Construction',
  },
  {
    key: 'Food Products',
    label: 'Food Products',
    legacyKeys: ['Food & Beverages', 'food products'],
    testText: '',
  },
  {
    key: 'Beverage',
    label: 'Beverage',
    legacyKeys: ['Bottled water', 'Food & Beverages', 'beverage', 'beveregae'],
    testText: 'Beverage, Bottled water',
  },
  {
    key: 'Other',
    label: 'Other',
    legacyKeys: ['Others', 'Timber', 'Machinery & Equipment', 'Consumer Goods', 'other'],
    testText: 'Timber',
  },
];

export const LOAD_CATEGORY_KEYS = LOAD_CATEGORIES.map((c) => c.key);
