// ============================================================
// MilesVault — "Recommended for you" promo scoring
// Personalised with data already on-device: the user's wallet
// (new-to-bank eligibility), income bracket, and their actual
// logged spending pace. Each pick carries a computed reason.
// ============================================================

import { getCard, bracketToIncome, type Card } from '@/data/cards';
import { type SeededPromo } from '@/data/promos';
import { type SpendEntry } from '@/lib/spend';

export interface PromoRecommendation {
  seed: SeededPromo;
  score: number;
  reason: string;
}

/** Average tracked spend per 30 days, over up to the last 90 days. */
export function monthlySpendPace(entries: SpendEntry[], now = new Date()): number {
  if (entries.length === 0) return 0;
  const windowStart = new Date(now.getTime() - 90 * 86_400_000);
  const recent = entries.filter(e => new Date(e.dateISO) >= windowStart);
  if (recent.length === 0) return 0;
  const total = recent.reduce((s, e) => s + e.amountSgd, 0);
  const oldest = recent.reduce(
    (min, e) => Math.min(min, new Date(e.dateISO).getTime()),
    now.getTime(),
  );
  const daysSpanned = Math.max(7, (now.getTime() - oldest) / 86_400_000); // floor at a week
  return (total / daysSpanned) * 30;
}

const fmtK = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;

/**
 * Why this offer doesn't apply to THIS user (null = eligible).
 * Ineligible offers are still worth showing — they might suit a friend.
 */
export function ineligibilityReason(
  seed: SeededPromo,
  banksHeld: Set<string>,
  income: number,
): string | null {
  const card = getCard(seed.cardId);
  if (!card) return 'Unknown card';
  if (card.incomeRequirementSgd > income) {
    return `Needs ${fmtK(card.incomeRequirementSgd)}/yr income`;
  }
  if (seed.eligibility === 'NTB' && banksHeld.has(card.bank)) {
    return `New-to-${card.bank} only — you already hold a ${card.bank} card`;
  }
  return null;
}

export interface PromoSplit {
  eligible: SeededPromo[];
  ineligible: { seed: SeededPromo; why: string }[];
}

/** Split offers into ones the user can apply for vs ones to share with friends. */
export function splitByEligibility(
  seeds: SeededPromo[],
  myCards: Card[],
  incomeBracket: string,
  now = new Date(),
): PromoSplit {
  const income = bracketToIncome(incomeBracket);
  const banksHeld = new Set(myCards.filter(c => !c.isAmazePairingCard).map(c => c.bank));
  const eligible: SeededPromo[] = [];
  const ineligible: { seed: SeededPromo; why: string }[] = [];

  for (const seed of seeds) {
    if (new Date(seed.applyByISO) < new Date(now.toDateString())) continue; // expired: show nowhere
    const why = ineligibilityReason(seed, banksHeld, income);
    if (why) ineligible.push({ seed, why });
    else eligible.push(seed);
  }
  return { eligible, ineligible };
}

export function recommendPromos(
  seeds: SeededPromo[],
  myCards: Card[],
  incomeBracket: string,
  entries: SpendEntry[],
  now = new Date(),
  limit = 3,
): PromoRecommendation[] {
  const income = bracketToIncome(incomeBracket);
  const banksHeld = new Set(myCards.filter(c => !c.isAmazePairingCard).map(c => c.bank));
  const pace = monthlySpendPace(entries, now);

  const recs: PromoRecommendation[] = [];

  for (const seed of seeds) {
    const card = getCard(seed.cardId);
    if (!card) continue;

    // Hard filters: expired + personal eligibility
    if (new Date(seed.applyByISO) < new Date(now.toDateString())) continue;
    if (ineligibilityReason(seed, banksHeld, income)) continue;
    const newToBank = !banksHeld.has(card.bank);

    const costPerMile = seed.annualFeeSgd > 0 ? (seed.annualFeeSgd / seed.bonusMiles) * 100 : 0;
    const payoff = seed.bonusMiles / Math.max(1, seed.minSpendSgd); // miles per $ of spend
    const windowMonths = seed.spendWindowDays / 30;
    const achievable = pace > 0 ? pace * windowMonths >= seed.minSpendSgd : seed.minSpendSgd <= 1000;
    const daysToApply = Math.ceil((new Date(seed.applyByISO).getTime() - now.getTime()) / 86_400_000);

    // ── Score ──
    let score = Math.min(50, payoff); // value of spend (capped so $50-spend gimmicks don't dominate)
    score += seed.annualFeeSgd === 0 ? 20 : Math.max(0, 14 - costPerMile * 10); // cheap miles
    score += achievable ? 15 : -25;
    score += seed.bonusMiles / 10_000; // absolute size matters a little
    if (daysToApply <= 10) score += 3; // gentle urgency nudge

    // ── Reason (assembled from the facts that actually scored) ──
    const parts: string[] = [];
    if (seed.eligibility === 'NTB' || newToBank) parts.push(`you're new to ${card.bank}`);
    if (pace > 0 && achievable) {
      parts.push(`the ${fmtK(seed.minSpendSgd)} min spend fits your ~${fmtK(Math.round(pace))}/mo pace`);
    } else if (achievable) {
      parts.push(`the ${fmtK(seed.minSpendSgd)} minimum is easy to hit`);
    } else {
      parts.push(`heads up — ${fmtK(seed.minSpendSgd)} in ${seed.spendWindowDays} days is above your usual pace`);
    }
    parts.push(
      seed.annualFeeSgd === 0
        ? `${seed.bonusMiles.toLocaleString()} miles with no fee`
        : `${seed.bonusMiles.toLocaleString()} miles at ${costPerMile.toFixed(2)}¢ each`,
    );
    const reason = parts.join(', ') + '.';

    recs.push({
      seed,
      score,
      reason: reason.charAt(0).toUpperCase() + reason.slice(1),
    });
  }

  // Dedupe variants of the same offer (e.g. DBS Altitude Visa vs Amex)
  const seen = new Set<string>();
  const deduped = recs
    .sort((a, b) => b.score - a.score)
    .filter(r => {
      const card = getCard(r.seed.cardId);
      const key = `${card?.bank}|${r.seed.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return deduped.slice(0, limit);
}
