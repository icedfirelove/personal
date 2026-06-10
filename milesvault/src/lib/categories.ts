// ============================================================
// MilesVault — Canonical spend categories
// Maps free-form earn-rate labels in cards.ts to a fixed set of
// spend categories used by the Recommender and spend log.
// ============================================================

export type SpendCategory =
  | 'online'
  | 'shopping'
  | 'dining'
  | 'travel'
  | 'transport'
  | 'petrol'
  | 'contactless'
  | 'fcy'
  | 'general';

export const CATEGORIES: { value: SpendCategory; label: string; icon: string; hint: string }[] = [
  { value: 'online',      label: 'Online',          icon: '🛒', hint: 'Online shopping, food delivery, subscriptions' },
  { value: 'shopping',    label: 'Retail',          icon: '🛍️', hint: 'In-store fashion, department stores' },
  { value: 'dining',      label: 'Dining',          icon: '🍜', hint: 'Restaurants, cafes, food delivery' },
  { value: 'travel',      label: 'Travel',          icon: '✈️', hint: 'Flights, hotels, travel bookings' },
  { value: 'transport',   label: 'Transport',       icon: '🚇', hint: 'MRT, bus, taxis, ride-hailing' },
  { value: 'petrol',      label: 'Petrol',          icon: '⛽', hint: 'Fuel stations' },
  { value: 'contactless', label: 'Contactless',     icon: '📲', hint: 'In-store tap-to-pay (Apple/Google Pay)' },
  { value: 'fcy',         label: 'Overseas (FCY)',  icon: '🌏', hint: 'Foreign currency spend' },
  { value: 'general',     label: 'Everything else', icon: '💳', hint: 'Bills, groceries, anything uncategorised' },
];

export function categoryMeta(cat: SpendCategory) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

/**
 * Exact earn-rate label → spend categories it covers.
 * Labels not listed here only match 'general' if flagged below.
 */
const LABEL_CATEGORY_MAP: Record<string, SpendCategory[]> = {
  'Online Shopping':                                  ['online'],
  'Retail Shopping':                                  ['shopping'],
  'Shopping (13 MCCs)':                               ['shopping', 'online'],
  'Shopping & Dining':                                ['shopping', 'dining'],
  'Weekend Shopping':                                 ['shopping'],
  'Weekend Dining':                                   ['dining'],
  'Dining':                                           ['dining'],
  'Dining, Food Delivery, Online, Travel, Transport': ['dining', 'online', 'travel', 'transport'],
  'Shopee, Lazada, Watsons, TikTok, Taobao':          ['online'],
  'Travel (via UOB Travel)':                          ['travel'],
  'Travel (Flights & Hotels)':                        ['travel'],
  'Travel Bookings':                                  ['travel'],
  'Airlines & Hotels':                                ['travel'],
  'SIA / Scoot / KrisShop':                           ['travel'],
  'SIA / Scoot / KrisShop / Kris+ / Pelago':          ['travel'],
  'Public Transport':                                 ['transport'],
  'Petrol':                                           ['petrol'],
  'Contactless Tap':                                  ['contactless'],
  'Offline Contactless':                              ['contactless'],
  'Foreign Currency (FCY)':                           ['fcy'],
  'FCY Spend':                                        ['fcy'],
  'Overseas Spend (FCY)':                             ['fcy'],
  // UOB Lady's cards — bonus applies only to the user's chosen quarterly category
  'Chosen Bonus Category':                            ['dining', 'travel', 'shopping', 'transport'],
  'Bonus Category 1':                                 ['dining', 'travel', 'shopping', 'transport'],
  'Bonus Category 2':                                 ['dining', 'travel', 'shopping', 'transport'],
};

/** Labels that are general/base rates (match every category as fallback). */
const GENERAL_LABELS = new Set(['General', 'Local Spend']);

/** Labels whose bonus is conditional on a user choice (e.g. UOB Lady's quarterly pick). */
const CONDITIONAL_LABELS = new Set(['Chosen Bonus Category', 'Bonus Category 1', 'Bonus Category 2']);

export function labelCategories(label: string): SpendCategory[] {
  return LABEL_CATEGORY_MAP[label] ?? [];
}

export function isGeneralLabel(label: string): boolean {
  return GENERAL_LABELS.has(label);
}

export function isConditionalLabel(label: string): boolean {
  return CONDITIONAL_LABELS.has(label);
}

/** Does this earn-rate label cover the given spend category? */
export function rateMatchesCategory(label: string, category: SpendCategory): boolean {
  if (category === 'general') return isGeneralLabel(label);
  return labelCategories(label).includes(category);
}
