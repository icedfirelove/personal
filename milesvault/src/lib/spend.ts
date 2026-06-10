// ============================================================
// MilesVault — Spend log, cap tracking, promos & alerts
// All persisted in localStorage (no backend).
// ============================================================

import { type Card, getCard } from '@/data/cards';
import {
  type SpendCategory,
  rateMatchesCategory,
  isGeneralLabel,
  isConditionalLabel,
} from '@/lib/categories';

// ─── Types ─────────────────────────────────────────────────────

export interface SpendEntry {
  id: string;
  cardId: string;
  category: SpendCategory;
  amountSgd: number;
  dateISO: string;            // ISO date of the spend
  source: 'recommender' | 'manual';
  note?: string;
}

export interface ActivePromo {
  id: string;
  seedId?: string;            // present if started from a seeded offer
  cardId: string;
  title: string;
  targetSgd: number;
  startISO: string;           // spend counts from this date (approval date)
  deadlineISO: string;        // must hit target by this date
  rewardMiles: number;
  notes?: string;
}

export interface UserSettings {
  statementDays: Record<string, number>; // cardId → statement day (1–28)
}

const SPEND_KEY = 'milesvault_spend';
const PROMO_KEY = 'milesvault_promos';
const SETTINGS_KEY = 'milesvault_settings';

// ─── Generic localStorage helpers ──────────────────────────────

function loadList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
}

function saveList<T>(key: string, list: T[]): void {
  localStorage.setItem(key, JSON.stringify(list));
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Spend log ─────────────────────────────────────────────────

export function loadSpend(): SpendEntry[] {
  return loadList<SpendEntry>(SPEND_KEY);
}

export function addSpend(entry: Omit<SpendEntry, 'id'>): SpendEntry[] {
  const next = [...loadSpend(), { ...entry, id: uid() }];
  saveList(SPEND_KEY, next);
  return next;
}

export function addSpendBulk(entries: Omit<SpendEntry, 'id'>[]): SpendEntry[] {
  const next = [...loadSpend(), ...entries.map(e => ({ ...e, id: uid() }))];
  saveList(SPEND_KEY, next);
  return next;
}

export function deleteSpend(id: string): SpendEntry[] {
  const next = loadSpend().filter(e => e.id !== id);
  saveList(SPEND_KEY, next);
  return next;
}

// ─── Settings ──────────────────────────────────────────────────

export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return { statementDays: {} };
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return { statementDays: {}, ...raw };
  } catch {
    return { statementDays: {} };
  }
}

export function setStatementDay(cardId: string, day: number | null): UserSettings {
  const s = loadSettings();
  if (day === null) {
    delete s.statementDays[cardId];
  } else {
    s.statementDays[cardId] = Math.min(28, Math.max(1, day));
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  return s;
}

// ─── Cap periods ───────────────────────────────────────────────

export interface CapPeriod {
  start: Date;
  end: Date;       // exclusive
  resetLabel: string;
}

/** Does this card's cap run on the statement cycle rather than calendar month? */
export function usesStatementCycle(card: Card): boolean {
  return card.capResetDay.toLowerCase().includes('statement');
}

/**
 * The current cap period for a card.
 * Calendar month by default; statement cycle if the card uses one
 * AND the user has set their statement day.
 */
export function getCapPeriod(card: Card, settings: UserSettings, now = new Date()): CapPeriod {
  const day = usesStatementCycle(card) ? settings.statementDays[card.id] : undefined;
  if (day) {
    const start = new Date(now.getFullYear(), now.getMonth(), day);
    if (now < start) start.setMonth(start.getMonth() - 1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { start, end, resetLabel: `your statement date (day ${day})` };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end, resetLabel: '1st of the month' };
}

export function daysUntilReset(card: Card, settings: UserSettings, now = new Date()): number {
  const { end } = getCapPeriod(card, settings, now);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

function inRange(dateISO: string, start: Date, end: Date): boolean {
  const d = new Date(dateISO);
  return d >= start && d < end;
}

// ─── Cap usage ─────────────────────────────────────────────────

export interface CapGroup {
  capSgd: number;
  labels: string[];          // earn-rate labels sharing this cap
  mpd: number;               // best bonus mpd in the group
  spentSgd: number;          // spend logged this period against these labels' categories
  remainingSgd: number;
  conditional: boolean;
}

/**
 * Capped bonus rates grouped by cap value (equal caps on one card are
 * usually a shared cap, e.g. Citi Rewards online + retail). Approximate.
 */
export function getCapGroups(
  card: Card,
  entries: SpendEntry[],
  settings: UserSettings,
  now = new Date(),
): CapGroup[] {
  const period = getCapPeriod(card, settings, now);
  const capped = card.earnRates.filter(r => r.capSgd != null && !isGeneralLabel(r.label));
  const byCap = new Map<number, typeof capped>();
  for (const r of capped) {
    const list = byCap.get(r.capSgd!) ?? [];
    list.push(r);
    byCap.set(r.capSgd!, list);
  }

  const cardEntries = entries.filter(
    e => e.cardId === card.id && inRange(e.dateISO, period.start, period.end),
  );

  return [...byCap.entries()].map(([capSgd, rates]) => {
    const labels = rates.map(r => r.label);
    const spentSgd = cardEntries
      .filter(e => rates.some(r => rateMatchesCategory(r.label, e.category)))
      .reduce((sum, e) => sum + e.amountSgd, 0);
    return {
      capSgd,
      labels,
      mpd: Math.max(...rates.map(r => r.mpd)),
      spentSgd,
      remainingSgd: Math.max(0, capSgd - spentSgd),
      conditional: rates.every(r => isConditionalLabel(r.label)),
    };
  });
}

// ─── Per-card period summary (Overview) ────────────────────────

export interface CardPeriodSummary {
  card: Card;
  spentSgd: number;          // total logged spend this period
  milesEarned: number;       // approx miles, cap-aware
  capGroups: CapGroup[];
  resetInDays: number;
}

/**
 * Approximate miles earned on a card this cap period from logged spend.
 * Bonus-rate spend is capped per cap group (overflow earns the general
 * rate); unmatched spend earns the general rate.
 */
export function cardPeriodSummary(
  card: Card,
  entries: SpendEntry[],
  settings: UserSettings,
  now = new Date(),
): CardPeriodSummary {
  const period = getCapPeriod(card, settings, now);
  const cardEntries = entries.filter(
    e => e.cardId === card.id && inRange(e.dateISO, period.start, period.end),
  );
  const general = card.earnRates
    .filter(r => isGeneralLabel(r.label))
    .reduce((best, r) => Math.max(best, r.mpd), 0);

  let miles = 0;
  // capSgd → accumulated bonus-eligible spend (shared-cap approximation)
  const capBuckets = new Map<number, { spend: number; mpd: number }>();

  for (const e of cardEntries) {
    const matches = card.earnRates.filter(
      r => !isGeneralLabel(r.label) && rateMatchesCategory(r.label, e.category),
    );
    const bonus = matches.length ? matches.reduce((a, b) => (b.mpd > a.mpd ? b : a)) : null;
    if (!bonus || bonus.mpd <= general) {
      miles += e.amountSgd * general;
    } else if (bonus.capSgd == null) {
      miles += e.amountSgd * bonus.mpd;
    } else {
      const bucket = capBuckets.get(bonus.capSgd) ?? { spend: 0, mpd: bonus.mpd };
      bucket.spend += e.amountSgd;
      bucket.mpd = Math.max(bucket.mpd, bonus.mpd);
      capBuckets.set(bonus.capSgd, bucket);
    }
  }
  for (const [cap, bucket] of capBuckets) {
    const atBonus = Math.min(bucket.spend, cap);
    miles += atBonus * bucket.mpd + (bucket.spend - atBonus) * general;
  }

  return {
    card,
    spentSgd: cardEntries.reduce((s, e) => s + e.amountSgd, 0),
    milesEarned: miles,
    capGroups: getCapGroups(card, entries, settings, now),
    resetInDays: daysUntilReset(card, settings, now),
  };
}

// ─── Recommender ───────────────────────────────────────────────

export interface Recommendation {
  card: Card;
  bonusLabel: string | null;  // matched bonus rate label (null = general rate only)
  bonusMpd: number;
  generalMpd: number;
  remainingCapSgd: number | null; // null = uncapped
  milesEarned: number;        // for the given amount, cap-aware
  effectiveMpd: number;
  hitsCap: boolean;           // part of this spend would overflow the cap
  conditional: boolean;       // bonus depends on user selection (UOB Lady's)
  amazeBoost: boolean;        // pairing with Amaze may unlock a higher rate
}

export function recommendCards(
  cards: Card[],
  category: SpendCategory,
  amountSgd: number,
  entries: SpendEntry[],
  settings: UserSettings,
  now = new Date(),
): Recommendation[] {
  const recs = cards
    .filter(c => !c.isAmazePairingCard && c.earnRates.length > 0)
    .map(card => {
      const general = card.earnRates
        .filter(r => isGeneralLabel(r.label))
        .reduce((best, r) => Math.max(best, r.mpd), 0);

      // Best bonus rate covering this category
      const matches = card.earnRates.filter(
        r => !isGeneralLabel(r.label) && rateMatchesCategory(r.label, category),
      );
      const bonus = matches.length
        ? matches.reduce((a, b) => (b.mpd > a.mpd ? b : a))
        : null;

      let milesEarned: number;
      let remainingCapSgd: number | null = null;
      let hitsCap = false;

      if (!bonus || bonus.mpd <= general) {
        milesEarned = amountSgd * general;
      } else if (bonus.capSgd == null) {
        milesEarned = amountSgd * bonus.mpd;
      } else {
        const group = getCapGroups(card, entries, settings, now).find(g =>
          g.labels.includes(bonus.label),
        );
        remainingCapSgd = group ? group.remainingSgd : bonus.capSgd;
        const atBonus = Math.min(amountSgd, remainingCapSgd);
        const overflow = amountSgd - atBonus;
        hitsCap = overflow > 0;
        milesEarned = atBonus * bonus.mpd + overflow * general;
      }

      return {
        card,
        bonusLabel: bonus && bonus.mpd > general ? bonus.label : null,
        bonusMpd: bonus ? bonus.mpd : general,
        generalMpd: general,
        remainingCapSgd,
        milesEarned,
        effectiveMpd: amountSgd > 0 ? milesEarned / amountSgd : 0,
        hitsCap,
        conditional: bonus ? isConditionalLabel(bonus.label) : false,
        amazeBoost: category === 'online' && card.amazeCompatible,
      };
    });

  return recs.sort((a, b) => b.milesEarned - a.milesEarned);
}

// ─── Uncertain-category Recommender ("Not sure" mode) ──────────

export interface UncertainRecommendation {
  card: Card;
  scenarioA: Recommendation;   // if it codes as category A
  scenarioB: Recommendation;   // if it codes as category B
  worstMiles: number;          // guaranteed miles whichever way it codes
  bestMiles: number;
  sameEitherWay: boolean;      // earns (almost) the same in both scenarios
}

/**
 * When the user doesn't know how a merchant will code (e.g. a restaurant
 * inside a hotel: dining vs travel MCC), rank cards by WORST-CASE miles —
 * the card you can't regret. Cards earning the same either way are the
 * safest picks and get flagged.
 */
export function recommendCardsUncertain(
  cards: Card[],
  categoryA: SpendCategory,
  categoryB: SpendCategory,
  amountSgd: number,
  entries: SpendEntry[],
  settings: UserSettings,
  now = new Date(),
): UncertainRecommendation[] {
  const recsA = recommendCards(cards, categoryA, amountSgd, entries, settings, now);
  const recsB = recommendCards(cards, categoryB, amountSgd, entries, settings, now);
  const byIdB = new Map(recsB.map(r => [r.card.id, r]));

  return recsA
    .map(a => {
      const b = byIdB.get(a.card.id)!;
      const worstMiles = Math.min(a.milesEarned, b.milesEarned);
      const bestMiles = Math.max(a.milesEarned, b.milesEarned);
      return {
        card: a.card,
        scenarioA: a,
        scenarioB: b,
        worstMiles,
        bestMiles,
        // "same" within 5% — covers rounding and tiny cap differences
        sameEitherWay: bestMiles === 0 || worstMiles / bestMiles >= 0.95,
      };
    })
    .sort((x, y) => y.worstMiles - x.worstMiles || y.bestMiles - x.bestMiles);
}

// ─── Promos ────────────────────────────────────────────────────

export function loadPromos(): ActivePromo[] {
  return loadList<ActivePromo>(PROMO_KEY);
}

export function addPromo(promo: Omit<ActivePromo, 'id'>): ActivePromo[] {
  const next = [...loadPromos(), { ...promo, id: uid() }];
  saveList(PROMO_KEY, next);
  return next;
}

export function deletePromo(id: string): ActivePromo[] {
  const next = loadPromos().filter(p => p.id !== id);
  saveList(PROMO_KEY, next);
  return next;
}

export interface PromoProgress {
  promo: ActivePromo;
  spentSgd: number;
  remainingSgd: number;
  pct: number;              // 0–100
  daysLeft: number;         // negative = expired
  done: boolean;
}

export function promoProgress(promo: ActivePromo, entries: SpendEntry[], now = new Date()): PromoProgress {
  const start = new Date(promo.startISO);
  const deadline = new Date(promo.deadlineISO);
  deadline.setHours(23, 59, 59, 999);
  const spentSgd = entries
    .filter(e => e.cardId === promo.cardId && inRange(e.dateISO, start, deadline))
    .reduce((sum, e) => sum + e.amountSgd, 0);
  const remainingSgd = Math.max(0, promo.targetSgd - spentSgd);
  return {
    promo,
    spentSgd,
    remainingSgd,
    pct: Math.min(100, Math.round((spentSgd / promo.targetSgd) * 100)),
    daysLeft: Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000),
    done: remainingSgd === 0,
  };
}

// ─── Alerts ────────────────────────────────────────────────────

export interface Alert {
  id: string;
  severity: 'info' | 'warn' | 'urgent';
  icon: string;
  title: string;
  body: string;
}

export function computeAlerts(
  cards: Card[],
  entries: SpendEntry[],
  settings: UserSettings,
  promos: ActivePromo[],
  now = new Date(),
): Alert[] {
  const alerts: Alert[] = [];

  // Promo deadlines — the most expensive thing to miss
  for (const promo of promos) {
    const p = promoProgress(promo, entries, now);
    const card = getCard(promo.cardId);
    const cardName = card?.cardName ?? promo.cardId;
    if (p.daysLeft < 0) continue;
    if (p.done) {
      alerts.push({
        id: `promo-done-${promo.id}`,
        severity: 'info',
        icon: '🎉',
        title: `Min spend met — ${promo.title}`,
        body: `You've hit $${promo.targetSgd.toLocaleString()} on the ${cardName}. ${promo.rewardMiles.toLocaleString()} miles incoming.`,
      });
    } else if (p.daysLeft <= 14) {
      alerts.push({
        id: `promo-due-${promo.id}`,
        severity: p.daysLeft <= 7 ? 'urgent' : 'warn',
        icon: '⏳',
        title: `$${p.remainingSgd.toLocaleString()} to go in ${p.daysLeft} day${p.daysLeft === 1 ? '' : 's'}`,
        body: `Spend $${p.remainingSgd.toLocaleString()} more on the ${cardName} by ${new Date(promo.deadlineISO).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })} to earn ${promo.rewardMiles.toLocaleString()} miles.`,
      });
    }
  }

  // Cap usage + resets
  for (const card of cards) {
    if (card.isAmazePairingCard) continue;
    const groups = getCapGroups(card, entries, settings, now);
    const resetDays = daysUntilReset(card, settings, now);
    for (const g of groups) {
      const pct = (g.spentSgd / g.capSgd) * 100;
      if (pct >= 100) {
        alerts.push({
          id: `cap-full-${card.id}-${g.capSgd}`,
          severity: 'urgent',
          icon: '🛑',
          title: `${card.cardName}: bonus cap hit`,
          body: `$${g.capSgd.toLocaleString()} cap used — extra spend earns base rate only. Resets in ${resetDays} day${resetDays === 1 ? '' : 's'}. Swipe a different card.`,
        });
      } else if (pct >= 80) {
        alerts.push({
          id: `cap-near-${card.id}-${g.capSgd}`,
          severity: 'warn',
          icon: '⚠️',
          title: `${card.cardName}: $${g.remainingSgd.toLocaleString()} of bonus cap left`,
          body: `${Math.round(pct)}% of the $${g.capSgd.toLocaleString()} cap (${g.labels.join(' / ')}) used this period. Resets in ${resetDays} day${resetDays === 1 ? '' : 's'}.`,
        });
      } else if (resetDays <= 5 && g.spentSgd > 0 && g.remainingSgd > 0) {
        alerts.push({
          id: `cap-reset-${card.id}-${g.capSgd}`,
          severity: 'info',
          icon: '🗓',
          title: `${card.cardName}: cap resets in ${resetDays} day${resetDays === 1 ? '' : 's'}`,
          body: `$${g.remainingSgd.toLocaleString()} of unused ${g.mpd} mpd cap — front-load planned spend before it resets.`,
        });
      }
    }
  }

  const order = { urgent: 0, warn: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}
