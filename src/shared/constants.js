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
  { id: 'budget', label: 'Budget', icon: '📅' },
  { id: 'leakage', label: 'Leakage', icon: '🚰' },
  { id: 'bofa', label: 'BofA', icon: '💳' },
  { id: 'payday', label: 'Payday', icon: '💰' },
  { id: 'transactions', label: 'Transactions', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// Budget data — Nikki's monthly required expenses spreadsheet
export const BUDGET_DATA = {
  income: {
    biweekly: 4062,
    monthly: 8124,
  },
  creditCards: [
    { name: 'Solar Panels', dueDate: '9th', payment: 274.19, balance: 20000, rate: '7.9%', notes: 'Will be 61 years old' },
    { name: 'HELOC', dueDate: '1st', payment: 460.92, balance: 0, rate: '8.9%', notes: '' },
    { name: 'Bank of America', dueDate: '9th', payment: 132.00, balance: 13176.90, rate: '0%', notes: "0% APR 'til November 2026" },
  ],
  monthlyBills: [
    { name: 'Internet', dueDate: '10th', amount: 85 },
    { name: 'Electric', dueDate: '10th', amount: 30 },
    { name: 'Water', dueDate: '16th', amount: 40 },
    { name: 'Explorer ($8,358.56)', dueDate: '28th', amount: 279.34 },
    { name: 'Civic ($30,872.95)', dueDate: '15th', amount: 477.47 },
    { name: 'Barefoot', dueDate: '', amount: 126 },
    { name: 'JW', dueDate: '1st', amount: 110 },
    { name: 'House (2 payments)', dueDate: '', amount: 1577.70 },
    { name: 'Monthly Savings', dueDate: '', amount: 0 },
    { name: 'Nikki Gym', dueDate: '19th', amount: 55 },
    { name: 'Apple TV', dueDate: '16th', amount: 36 },
    { name: 'Ben Gym', dueDate: '16th', amount: 75 },
    { name: 'Netflix', dueDate: '12th', amount: 19 },
  ],
  quarterlyBills: [
    { name: 'Moxie', dueMonth: 'Jan', amount: 139 },
    { name: 'Garbage', dueMonth: '3,7,11', amount: 78 },
    { name: 'Life Insurance', dueMonth: '26th', amount: 96 },
    { name: 'Bruno', dueMonth: 'Dec 3', amount: 90 },
  ],
  yearlyBills: [
    { name: 'Mint (Ben)', dueMonth: 'Sept', amount: 400 },
    { name: 'Mint (Nikki)', dueMonth: 'June', amount: 180 },
    { name: 'Propane', dueMonth: 'Dec', amount: 129 },
    { name: 'HOA', dueMonth: 'Dec', amount: 220 },
    { name: 'Registration', dueMonth: 'Dec', amount: 400 },
  ],
  spendTarget: {
    foodAndFun: 2000,
    label: 'Sapphire',
  },
  goals: [
    'Contribute more to retirement',
    'Landscape and patio furniture',
    'Beach house August 2026',
    'Pay Bank of America off June 2026',
    'Put at least $2,000 a month in savings',
    'Alaska cruise 2027',
    'Build a deck and pergola 2027',
    'Donate more to branch',
    'Pay off HELOC',
    'Pay off Solar Panels',
  ],
};
