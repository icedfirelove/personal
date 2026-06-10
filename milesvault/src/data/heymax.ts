/**
 * HeyMax platform data
 *
 * HeyMax is a loyalty platform that lets you earn Max Miles on top of your
 * credit card miles when you shop via their links or the HeyMax app.
 *
 * Key facts:
 * - Max Miles never expire
 * - Transfer to 30+ frequent flyer & hotel programmes at 1:1 (no fees)
 * - Stacks on top of whatever your credit card earns
 * - Gift card purchases via HeyMax code as MCC 5311 (department stores)
 *   → unlocks higher earn rates on cards with a shopping/department-store tier
 *   (e.g. UOB Preferred Platinum, OCBC Titanium Rewards)
 * - Minimum redemption: 500 Max Miles (~S$10 value at $0.02/mile)
 */

export type HeyMaxCategory =
  | 'Travel'
  | 'Shopping'
  | 'Food & Delivery'
  | 'Lifestyle'
  | 'Finance'
  | 'Telco';

export interface HeyMaxMerchant {
  /** Display name of the merchant */
  name: string;
  /** Max Miles earned per S$1 spent */
  milesPerDollar: number;
  category: HeyMaxCategory;
  /** Any conditions or caveats */
  notes?: string;
  /** Direct link to HeyMax merchant page (heymax.ai/...) */
  url: string;
  /** Whether gift-card purchase through HeyMax codes as MCC 5311 */
  giftCardMcc5311?: boolean;
}

/**
 * A curated list of popular HeyMax merchants in Singapore.
 * Sorted by milesPerDollar descending within each category.
 *
 * Source: HeyMax partner directory (heymax.ai) — rates as of May 2026.
 * Always verify current rates at https://heymax.ai
 */
export const HEYMAX_MERCHANTS: HeyMaxMerchant[] = [
  // ── Travel ──────────────────────────────────────────────────────────────
  {
    name: 'KKday',
    milesPerDollar: 7.5,
    category: 'Travel',
    notes: 'Experiences & tours. One of the highest earn rates on HeyMax.',
    url: 'https://heymax.ai/kkday',
  },
  {
    name: 'Pelago (Singapore Airlines)',
    milesPerDollar: 5,
    category: 'Travel',
    notes: 'SIA\'s own experiences platform. Stacks neatly with KrisFlyer card spend.',
    url: 'https://heymax.ai/pelago',
  },
  {
    name: 'Agoda',
    milesPerDollar: 4,
    category: 'Travel',
    notes: 'Hotels & accommodation. Must book via HeyMax link.',
    url: 'https://heymax.ai/agoda',
  },
  {
    name: 'Booking.com',
    milesPerDollar: 3,
    category: 'Travel',
    notes: 'Hotels worldwide.',
    url: 'https://heymax.ai/booking',
  },
  {
    name: 'Trip.com',
    milesPerDollar: 3,
    category: 'Travel',
    notes: 'Flights, hotels, trains. Good for Asia travel.',
    url: 'https://heymax.ai/tripcom',
  },
  {
    name: 'Singapore Airlines',
    milesPerDollar: 2,
    category: 'Travel',
    notes: 'SIA flights booked via HeyMax. Stacks with KrisFlyer card miles.',
    url: 'https://heymax.ai/singapore-airlines',
  },
  {
    name: 'Scoot',
    milesPerDollar: 2,
    category: 'Travel',
    notes: 'Budget airline under SIA Group.',
    url: 'https://heymax.ai/scoot',
  },
  {
    name: 'Klook',
    milesPerDollar: 3,
    category: 'Travel',
    notes: 'Experiences, attractions & tours across Asia.',
    url: 'https://heymax.ai/klook',
  },

  // ── Shopping ─────────────────────────────────────────────────────────────
  {
    name: 'Shopee',
    milesPerDollar: 2,
    category: 'Shopping',
    notes: 'Pay via HeyMax gift card checkout to earn Max Miles on top of card miles.',
    url: 'https://heymax.ai/shopee',
    giftCardMcc5311: true,
  },
  {
    name: 'Lazada',
    milesPerDollar: 2,
    category: 'Shopping',
    notes: 'HeyMax gift card checkout stacks with card earn rates.',
    url: 'https://heymax.ai/lazada',
    giftCardMcc5311: true,
  },
  {
    name: 'Amazon',
    milesPerDollar: 2,
    category: 'Shopping',
    notes: 'Amazon.sg via HeyMax link.',
    url: 'https://heymax.ai/amazon',
  },
  {
    name: 'ZALORA',
    milesPerDollar: 3,
    category: 'Shopping',
    notes: 'Fashion & lifestyle.',
    url: 'https://heymax.ai/zalora',
  },
  {
    name: 'Courts',
    milesPerDollar: 2,
    category: 'Shopping',
    notes: 'Electronics & furniture.',
    url: 'https://heymax.ai/courts',
  },
  {
    name: 'Harvey Norman',
    milesPerDollar: 2,
    category: 'Shopping',
    notes: 'Electronics & appliances.',
    url: 'https://heymax.ai/harvey-norman',
  },
  {
    name: 'Decathlon',
    milesPerDollar: 2,
    category: 'Shopping',
    notes: 'Sports equipment & apparel.',
    url: 'https://heymax.ai/decathlon',
  },
  {
    name: 'iHerb',
    milesPerDollar: 3,
    category: 'Shopping',
    notes: 'Health supplements & wellness.',
    url: 'https://heymax.ai/iherb',
  },
  {
    name: 'Sephora',
    milesPerDollar: 2,
    category: 'Shopping',
    notes: 'Beauty & cosmetics online.',
    url: 'https://heymax.ai/sephora',
  },
  {
    name: 'Taobao / Tmall',
    milesPerDollar: 2,
    category: 'Shopping',
    notes: 'Via HeyMax taobao agent. Popular for China shopping.',
    url: 'https://heymax.ai/taobao',
  },

  // ── Food & Delivery ───────────────────────────────────────────────────────
  {
    name: 'Deliveroo',
    milesPerDollar: 2,
    category: 'Food & Delivery',
    notes: 'Gift card via HeyMax codes as MCC 5311 — unlocks shopping tier on eligible cards.',
    url: 'https://heymax.ai/deliveroo',
    giftCardMcc5311: true,
  },
  {
    name: 'foodpanda',
    milesPerDollar: 2,
    category: 'Food & Delivery',
    notes: 'Gift card via HeyMax codes as MCC 5311.',
    url: 'https://heymax.ai/foodpanda',
    giftCardMcc5311: true,
  },
  {
    name: 'Grab',
    milesPerDollar: 1,
    category: 'Food & Delivery',
    notes: 'Grab gift card via HeyMax — MCC 5311 can unlock shopping earn rates on eligible cards.',
    url: 'https://heymax.ai/grab',
    giftCardMcc5311: true,
  },

  // ── Lifestyle ─────────────────────────────────────────────────────────────
  {
    name: 'Spotify',
    milesPerDollar: 3,
    category: 'Lifestyle',
    notes: 'Subscription via HeyMax gift card.',
    url: 'https://heymax.ai/spotify',
    giftCardMcc5311: true,
  },
  {
    name: 'Apple',
    milesPerDollar: 2,
    category: 'Lifestyle',
    notes: 'Apple gift card via HeyMax (App Store, Apple One, iCloud+).',
    url: 'https://heymax.ai/apple',
    giftCardMcc5311: true,
  },
  {
    name: 'Google Play',
    milesPerDollar: 2,
    category: 'Lifestyle',
    notes: 'Google Play gift card via HeyMax.',
    url: 'https://heymax.ai/google-play',
    giftCardMcc5311: true,
  },
  {
    name: 'Netflix',
    milesPerDollar: 3,
    category: 'Lifestyle',
    notes: 'Netflix gift card via HeyMax.',
    url: 'https://heymax.ai/netflix',
    giftCardMcc5311: true,
  },
  {
    name: 'Watsons',
    milesPerDollar: 2,
    category: 'Lifestyle',
    notes: 'Health & personal care.',
    url: 'https://heymax.ai/watsons',
  },
  {
    name: 'Guardian',
    milesPerDollar: 2,
    category: 'Lifestyle',
    notes: 'Health & beauty retail.',
    url: 'https://heymax.ai/guardian',
  },
  {
    name: 'Courts',
    milesPerDollar: 2,
    category: 'Lifestyle',
    notes: 'Electronics (duplicate entry intentional — also listed under Shopping).',
    url: 'https://heymax.ai/courts',
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    name: 'Wise',
    milesPerDollar: 2,
    category: 'Finance',
    notes: 'International money transfers.',
    url: 'https://heymax.ai/wise',
  },

  // ── Telco ─────────────────────────────────────────────────────────────────
  {
    name: 'Singtel',
    milesPerDollar: 2,
    category: 'Telco',
    notes: 'Bill payment / top-up via HeyMax.',
    url: 'https://heymax.ai/singtel',
  },
  {
    name: 'StarHub',
    milesPerDollar: 2,
    category: 'Telco',
    notes: 'Bill payment via HeyMax.',
    url: 'https://heymax.ai/starhub',
  },
  {
    name: 'M1',
    milesPerDollar: 2,
    category: 'Telco',
    notes: 'Bill payment via HeyMax.',
    url: 'https://heymax.ai/m1',
  },
];

/** Transfer programmes Max Miles can convert to (1:1, no fees) */
export const HEYMAX_TRANSFER_PROGRAMMES = [
  'KrisFlyer (Singapore Airlines)',
  'Asia Miles (Cathay Pacific)',
  'Flying Blue (Air France / KLM)',
  'Avios (British Airways)',
  'Miles & More (Lufthansa)',
  'ANA Mileage Club',
  'JAL Mileage Bank',
  'MileagePlus (United Airlines)',
  'AAdvantage (American Airlines)',
  'SkyMiles (Delta)',
  'Marriott Bonvoy',
  'Hilton Honors',
  'World of Hyatt',
  // … 30+ total
];

export const HEYMAX_INFO = {
  tagline: 'Earn Max Miles on top of your card miles — at 500+ merchants.',
  howItWorks:
    'Shop via HeyMax links or the HeyMax app and earn Max Miles on top of whatever your credit card earns. Max Miles never expire and transfer 1:1 to 30+ frequent flyer and hotel programmes at zero cost.',
  mcc5311Note:
    'Gift card purchases through HeyMax code as MCC 5311 (department stores). This can unlock higher earn rates on cards with a shopping or department-store category tier, like UOB Preferred Platinum Visa or OCBC Titanium Rewards.',
  minRedemptionMiles: 500,
  valueCentsPerMile: 2, // S$0.02 per mile
  transferRatio: '1:1',
  transferFee: 'Free',
  numPartners: '30+',
  websiteUrl: 'https://heymax.ai',
  appUrl: 'https://heymax.ai/app',
};

/** Return merchants filtered by category, sorted by milesPerDollar desc */
export function getMerchantsByCategory(
  category: HeyMaxCategory,
): HeyMaxMerchant[] {
  return HEYMAX_MERCHANTS.filter((m) => m.category === category).sort(
    (a, b) => b.milesPerDollar - a.milesPerDollar,
  );
}

/** Return all MCC-5311 gift card merchants */
export function getMcc5311Merchants(): HeyMaxMerchant[] {
  return HEYMAX_MERCHANTS.filter((m) => m.giftCardMcc5311).sort(
    (a, b) => b.milesPerDollar - a.milesPerDollar,
  );
}

/** Deduplicated categories present in HEYMAX_MERCHANTS */
export const HEYMAX_CATEGORIES: HeyMaxCategory[] = [
  'Travel',
  'Shopping',
  'Food & Delivery',
  'Lifestyle',
  'Finance',
  'Telco',
];
