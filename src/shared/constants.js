// YNAB Account IDs
export const YNAB_ACCOUNTS = {
  CHASE_CHECKING: '4a9ce8a8-66a1-4a1a-99f5-09a460f59729',
  BOFA_CASH_REWARDS: 'cb7fb148-421f-4925-a3ff-0bdf69924e2a',
};

// Leakage category definitions with payee matching patterns
export const LEAKAGE_CATEGORIES = {
  'Dining Out': {
    ynabCategories: ['Dining Out', 'Restaurants', 'Fast Food'],
    payeePatterns: [
      'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'grill',
      'taco', 'sushi', 'chinese', 'thai', 'indian', 'mexican',
      'chipotle', 'chick-fil-a', 'mcdonalds', 'wendys', 'subway',
      'starbucks', 'dunkin', 'panera', 'waffle', 'ihop', 'denny',
      'doordash', 'grubhub', 'ubereats', 'uber eats', 'postmates',
      'dominos', 'papa john', 'cookout', 'bojangles', 'zaxby',
    ],
  },
  'Booze': {
    ynabCategories: ['Alcohol', 'Booze', 'Beer & Wine'],
    payeePatterns: [
      'bar', 'brew', 'liquor', 'wine', 'beer', 'spirits',
      'pub', 'tavern', 'taproom', 'distill', 'lounge',
      'abc store', 'total wine', 'bottle shop',
    ],
  },
  'Kids Activities / Stuff': {
    ynabCategories: ['Kids', 'Kids Activities', 'Kids Stuff', 'Children'],
    payeePatterns: [
      'toys', 'toy', 'kids', 'children', 'child care',
      'trampoline', 'bounce', 'skating', 'swim lesson',
      'karate', 'martial art', 'dance class', 'gymnastics',
      'target kids', 'five below', 'party city',
    ],
  },
  'Amazon / Online Shopping': {
    ynabCategories: ['Amazon', 'Online Shopping', 'Shopping'],
    payeePatterns: [
      'amazon', 'amzn', 'amz', 'prime video', 'audible',
      'ebay', 'etsy', 'walmart.com', 'target.com',
      'wish.com', 'shein', 'temu', 'aliexpress',
    ],
  },
};

// Payday detection thresholds
export const PAYCHECK = {
  MIN_AMOUNT: 2400,
  MAX_AMOUNT: 2600,
  DAY_OF_WEEK: 4, // Thursday (0=Sunday)
};

// Color thresholds for leakage
export const COLOR_THRESHOLDS = {
  GREEN_MAX: 1.0,   // at or under baseline
  AMBER_MAX: 1.2,   // 0-20% over baseline
  // above 1.2 = red
};

// Default goals
export const DEFAULT_GOALS = {
  bofaTarget: 0,
  bofaCurrentBalance: 13500,
  bofaLastUpdated: '',
  leakageLimits: {
    'Dining Out': 150,
    'Booze': 80,
    'Kids Activities / Stuff': 200,
    'Amazon / Online Shopping': 150,
  },
};

// YNAB API base URL
export const YNAB_API_BASE = 'https://api.ynab.com/v1';

// Dedup window in days
export const DEDUP_WINDOW_DAYS = 2;

// Months of history for baseline
export const BASELINE_MONTHS = 3;

// Tab definitions
export const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'leakage', label: 'Leakage', icon: '🚰' },
  { id: 'bofa', label: 'BofA', icon: '💳' },
  { id: 'payday', label: 'Payday', icon: '💰' },
  { id: 'transactions', label: 'Transactions', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];
