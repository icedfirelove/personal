// ============================================================
// MilesVault — Seeded Sign-up Bonus Offers
// Last verified: 6 Jun 2026 against MileLion's monthly roundup
// (milelion.com/2026/06/06/roundup-credit-card-sign-up-bonuses-june-2026/)
// Offers change monthly and may differ by channel (direct vs
// SingSaver vs MGM links). ALWAYS verify the live T&Cs before
// applying — the spend window starts from card APPROVAL date.
// ============================================================

export type Eligibility = 'NTB' | 'ETB' | 'both';

export interface SeededPromo {
  seedId: string;
  cardId: string;          // matches cards.ts id
  title: string;
  bonusMiles: number;
  minSpendSgd: number;
  spendWindowDays: number; // days from approval to hit min spend
  applyByISO: string;      // application deadline
  annualFeeSgd: number;    // fee payable to qualify (0 = waived / none)
  eligibility: Eligibility;
  notes?: string;
}

export const SEEDED_PROMOS: SeededPromo[] = [
  {
    seedId: 'citi-rewards-jun26',
    cardId: 'citi-rewards',
    title: '16,000 bonus miles, fee waived',
    bonusMiles: 16000,
    minSpendSgd: 800,
    spendWindowDays: 60,
    applyByISO: '2026-06-30',
    annualFeeSgd: 0,
    eligibility: 'NTB',
    notes: 'First-year fee waived. Spend window is until end of 2nd month after approval (~60–90 days). Clock the $800 on online spend for 4 mpd base miles too.',
  },
  {
    seedId: 'citi-premiermiles-jun26',
    cardId: 'citi-premiermiles',
    title: '30,000 bonus miles (fee paid)',
    bonusMiles: 30000,
    minSpendSgd: 800,
    spendWindowDays: 60,
    applyByISO: '2026-06-30',
    annualFeeSgd: 196.20,
    eligibility: 'NTB',
    notes: 'Pay $196.20 fee → 30k miles (0.65¢/mile). Fee-waiver option earns only 8k. Spend window ~2–3 months from approval.',
  },
  {
    seedId: 'citi-prestige-jun26',
    cardId: 'citi-prestige',
    title: '45,000 bonus miles',
    bonusMiles: 45000,
    minSpendSgd: 14000,
    spendWindowDays: 60,
    applyByISO: '2026-06-30',
    annualFeeSgd: 651.82,
    eligibility: 'both',
    notes: 'Big nerf vs May (was 57k for $2k spend). Citigold gets 65k for $12k/$10k. Citi PayAll counts toward min spend. Open to existing Citi cardholders.',
  },
  {
    seedId: 'dbs-altitude-visa-jun26',
    cardId: 'dbs-altitude-visa',
    title: '38,000 bonus miles (code ALTS38)',
    bonusMiles: 38000,
    minSpendSgd: 800,
    spendWindowDays: 60,
    applyByISO: '2026-06-30',
    annualFeeSgd: 196.20,
    eligibility: 'NTB',
    notes: 'Pay fee + code ALTS38 → 38k (0.52¢/mile). Fee-waiver code ALTSW28 → 28k. Needs a DBS PayLah! account by end of spend period.',
  },
  {
    seedId: 'dbs-altitude-amex-jun26',
    cardId: 'dbs-altitude-amex',
    title: '38,000 bonus miles (code ALTS38)',
    bonusMiles: 38000,
    minSpendSgd: 800,
    spendWindowDays: 60,
    applyByISO: '2026-06-30',
    annualFeeSgd: 196.20,
    eligibility: 'NTB',
    notes: 'Same offer as the Visa version. Fee-waiver code ALTSW28 → 28k miles.',
  },
  {
    seedId: 'hsbc-travelone-jun26',
    cardId: 'hsbc-travelone',
    title: '33,600 bonus miles (NTB)',
    bonusMiles: 33600,
    minSpendSgd: 1000,
    spendWindowDays: 30,
    applyByISO: '2026-06-30',
    annualFeeSgd: 196.20,
    eligibility: 'NTB',
    notes: 'Existing HSBC cardholders get 21,600. Spend by end of month following approval. 0.58¢/mile for NTB.',
  },
  {
    seedId: 'hsbc-revolution-jun26',
    cardId: 'hsbc-revolution',
    title: '16,800 bonus miles, no fee',
    bonusMiles: 16800,
    minSpendSgd: 1000,
    spendWindowDays: 30,
    applyByISO: '2026-06-30',
    annualFeeSgd: 0,
    eligibility: 'NTB',
    notes: 'No annual fee card — free miles. Spend by end of month following approval. Clock spend on 4 mpd categories.',
  },
  {
    seedId: 'amex-kf-ascend-jun26',
    cardId: 'amex-krisflyer-ascend',
    title: '29,800 bonus miles (NTB)',
    bonusMiles: 29800,
    minSpendSgd: 1000,
    spendWindowDays: 60,
    applyByISO: '2026-06-16',
    annualFeeSgd: 397.85,
    eligibility: 'both',
    notes: 'Fee must be paid. Existing AMEX customers get 25k. Minus 5k if you ever held an AMEX SQ cobrand. Includes Hilton free night + Silver status.',
  },
  {
    seedId: 'amex-kf-cc-jun26',
    cardId: 'amex-krisflyer',
    title: '12,900 bonus miles, fee waived',
    bonusMiles: 12900,
    minSpendSgd: 1000,
    spendWindowDays: 60,
    applyByISO: '2026-06-16',
    annualFeeSgd: 0,
    eligibility: 'NTB',
    notes: 'First-year fee waived. Minus 5k if you ever held an AMEX SQ cobrand card.',
  },
  {
    seedId: 'amex-plat-charge-jun26',
    cardId: 'amex-platinum-charge',
    title: '115,000 bonus miles (NTB)',
    bonusMiles: 115000,
    minSpendSgd: 8000,
    spendWindowDays: 90,
    applyByISO: '2026-06-16',
    annualFeeSgd: 1744,
    eligibility: 'both',
    notes: '100k of the bonus MR points lands 15 months after approval — you must keep the card 2 years and pay the fee twice. Existing AMEX: $3k spend → 49,125 miles (better deal per dollar).',
  },
  {
    seedId: 'sc-journey-jun26',
    cardId: 'sc-journey',
    title: '30,000 miles + $180 cashback',
    bonusMiles: 30000,
    minSpendSgd: 800,
    spendWindowDays: 60,
    applyByISO: '2026-06-30',
    annualFeeSgd: 196.20,
    eligibility: 'NTB',
    notes: 'Effectively ~0.05¢/mile after the $180 cashback offsets the fee — one of the cheapest offers this month.',
  },
  {
    seedId: 'sc-vi-jun26',
    cardId: 'sc-visa-infinite',
    title: '50,000 bonus miles',
    bonusMiles: 50000,
    minSpendSgd: 2000,
    spendWindowDays: 60,
    applyByISO: '2026-06-30',
    annualFeeSgd: 600,
    eligibility: 'both',
    notes: '1.20¢/mile. Open to new and existing StanChart cardholders.',
  },
  {
    seedId: 'uob-vi-metal-jun26',
    cardId: 'uob-visa-infinite-metal',
    title: '60,000 bonus miles (NTB)',
    bonusMiles: 60000,
    minSpendSgd: 4000,
    spendWindowDays: 60,
    applyByISO: '2026-06-30',
    annualFeeSgd: 654,
    eligibility: 'both',
    notes: 'Existing UOB cardholders get 40k. 1.09¢/mile for NTB.',
  },
  {
    seedId: 'ocbc-rewards-jun26',
    cardId: 'ocbc-rewards',
    title: '26,000 bonus miles + luggage',
    bonusMiles: 26000,
    minSpendSgd: 600,
    spendWindowDays: 60,
    applyByISO: '2026-06-30',
    annualFeeSgd: 0,
    eligibility: 'NTB',
    notes: 'Fee-waiver option available. One of the best payoff ratios this month (43 miles/$).',
  },
];

export function getSeededPromo(seedId: string): SeededPromo | undefined {
  return SEEDED_PROMOS.find(p => p.seedId === seedId);
}
