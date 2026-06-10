// ============================================================
// MilesVault — Live seeded-promo feed
// Promos live in promos.json so they can be updated WITHOUT
// redeploying the app: edit milesvault/public/promos.json in the
// GitHub repo and every client picks it up on pull-to-refresh.
// Falls back to the bundled snapshot when offline.
// ============================================================

import { SEEDED_PROMOS, type SeededPromo, type Eligibility } from '@/data/promos';

export interface PromoFeed {
  promos: SeededPromo[];
  lastVerified: string | null;  // when the data itself was verified
  fetchedAt: string | null;     // when this client last refreshed (null = bundled)
}

const CACHE_KEY = 'milesvault_promo_feed';

// Same-origin copy first (always present), then raw GitHub — which updates
// the moment promos.json is pushed, even before a Vercel deploy finishes.
const FEED_URLS = [
  '/promos.json',
  'https://raw.githubusercontent.com/icedfirelove/personal/main/milesvault/public/promos.json',
];

const ELIGIBILITIES: Eligibility[] = ['NTB', 'ETB', 'both'];

function isValidPromo(p: unknown): p is SeededPromo {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.seedId === 'string' &&
    typeof o.cardId === 'string' &&
    typeof o.title === 'string' &&
    typeof o.bonusMiles === 'number' &&
    typeof o.minSpendSgd === 'number' &&
    typeof o.spendWindowDays === 'number' &&
    typeof o.applyByISO === 'string' &&
    typeof o.annualFeeSgd === 'number' &&
    ELIGIBILITIES.includes(o.eligibility as Eligibility)
  );
}

function loadCache(): PromoFeed | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PromoFeed;
    if (!Array.isArray(parsed.promos) || !parsed.promos.every(isValidPromo)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Best available promos right now: cached remote feed, else bundled snapshot. */
export function getPromoFeed(): PromoFeed {
  return (
    loadCache() ?? {
      promos: SEEDED_PROMOS,
      lastVerified: '2026-06-06',
      fetchedAt: null,
    }
  );
}

/**
 * Fetch the latest promos (pull-to-refresh). Tries same-origin first,
 * then raw GitHub. Caches on success. Throws if every source fails.
 */
export async function refreshPromoFeed(): Promise<PromoFeed> {
  let lastError: unknown = new Error('No feed source available');

  for (const url of FEED_URLS) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { lastVerified?: string; promos?: unknown[] };
      if (!Array.isArray(data.promos)) throw new Error('Malformed feed: no promos array');
      const promos = data.promos.filter(isValidPromo);
      if (promos.length === 0) throw new Error('Malformed feed: zero valid promos');

      const feed: PromoFeed = {
        promos,
        lastVerified: data.lastVerified ?? null,
        fetchedAt: new Date().toISOString(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(feed));
      return feed;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

/** "just now" / "5m ago" / "2h ago" / "3d ago" for the freshness stamp. */
export function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
