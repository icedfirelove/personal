// ============================================================
// MilesVault — Smart transaction parser
// Parses free text like "$300 shopee ocbc" into
// { amount, card, category, merchant } with no API calls.
// Learns: when the user corrects a category, the merchant is
// remembered (localStorage) and auto-categorised next time.
// ============================================================

import { type Card } from '@/data/cards';
import { type SpendCategory } from '@/lib/categories';

// ─── Learned merchants (user corrections) ──────────────────────

export interface LearnedMerchant {
  keyword: string;           // lowercase merchant text the user typed
  display: string;
  category: SpendCategory;
}

const LEARNED_KEY = 'milesvault_merchants';

export function loadLearnedMerchants(): LearnedMerchant[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LEARNED_KEY) ?? '[]') as LearnedMerchant[];
  } catch {
    return [];
  }
}

/** Remember "this merchant text → this category" for future parses. */
export function learnMerchant(text: string, category: SpendCategory): void {
  const keyword = text.trim().toLowerCase();
  if (!keyword || keyword.length < 2) return;
  const display = keyword.replace(/\b\w/g, c => c.toUpperCase());
  const list = loadLearnedMerchants().filter(m => m.keyword !== keyword);
  list.push({ keyword, display, category });
  localStorage.setItem(LEARNED_KEY, JSON.stringify(list.slice(-200)));
}

// ─── Merchant dictionary (SG-centric) ──────────────────────────

interface MerchantDef {
  keywords: string[];        // lowercase; may be multi-word ("cold storage")
  display: string;
  category: SpendCategory;
}

const MERCHANTS: MerchantDef[] = [
  // Online shopping
  { keywords: ['shopee'],                          display: 'Shopee',          category: 'online' },
  { keywords: ['lazada'],                          display: 'Lazada',          category: 'online' },
  { keywords: ['amazon'],                          display: 'Amazon',          category: 'online' },
  { keywords: ['taobao'],                          display: 'Taobao',          category: 'online' },
  { keywords: ['qoo10'],                           display: 'Qoo10',           category: 'online' },
  { keywords: ['shein'],                           display: 'Shein',           category: 'online' },
  { keywords: ['temu'],                            display: 'Temu',            category: 'online' },
  { keywords: ['zalora'],                          display: 'Zalora',          category: 'online' },
  { keywords: ['aliexpress'],                      display: 'AliExpress',      category: 'online' },
  { keywords: ['iherb'],                           display: 'iHerb',           category: 'online' },
  { keywords: ['carousell'],                       display: 'Carousell',       category: 'online' },
  { keywords: ['ezbuy'],                           display: 'ezbuy',           category: 'online' },
  { keywords: ['tiktok'],                          display: 'TikTok Shop',     category: 'online' },
  { keywords: ['netflix'],                         display: 'Netflix',         category: 'online' },
  { keywords: ['spotify'],                         display: 'Spotify',         category: 'online' },
  { keywords: ['disney+', 'disney'],               display: 'Disney+',         category: 'online' },
  { keywords: ['youtube'],                         display: 'YouTube Premium', category: 'online' },
  { keywords: ['chatgpt', 'openai'],               display: 'ChatGPT',         category: 'online' },
  { keywords: ['claude', 'anthropic'],             display: 'Claude',          category: 'online' },
  { keywords: ['watsons'],                         display: 'Watsons',         category: 'online' },
  { keywords: ['shopback'],                        display: 'ShopBack',        category: 'online' },
  // Food delivery & dining
  { keywords: ['grabfood'],                        display: 'GrabFood',        category: 'dining' },
  { keywords: ['foodpanda'],                       display: 'Foodpanda',       category: 'dining' },
  { keywords: ['deliveroo'],                       display: 'Deliveroo',       category: 'dining' },
  { keywords: ['mcdonalds', "mcdonald's", 'macs', 'mcd'], display: "McDonald's", category: 'dining' },
  { keywords: ['kfc'],                             display: 'KFC',             category: 'dining' },
  { keywords: ['starbucks', 'sbux'],               display: 'Starbucks',       category: 'dining' },
  { keywords: ['koi'],                             display: 'KOI',             category: 'dining' },
  { keywords: ['liho'],                            display: 'LiHO',            category: 'dining' },
  { keywords: ['gongcha', 'gong cha'],             display: 'Gong Cha',        category: 'dining' },
  { keywords: ['ya kun', 'yakun'],                 display: 'Ya Kun',          category: 'dining' },
  { keywords: ['toast box', 'toastbox'],           display: 'Toast Box',       category: 'dining' },
  { keywords: ['breadtalk'],                       display: 'BreadTalk',       category: 'dining' },
  { keywords: ['subway'],                          display: 'Subway',          category: 'dining' },
  { keywords: ['dominos', "domino's", 'pizza hut', 'pizza'], display: 'Pizza', category: 'dining' },
  { keywords: ['din tai fung', 'dintaifung'],      display: 'Din Tai Fung',    category: 'dining' },
  { keywords: ['haidilao', 'hai di lao'],          display: 'Haidilao',        category: 'dining' },
  { keywords: ['genki', 'sushiro', 'sushi'],       display: 'Sushi',           category: 'dining' },
  { keywords: ['jollibee'],                        display: 'Jollibee',        category: 'dining' },
  { keywords: ['burger king', 'bk'],               display: 'Burger King',     category: 'dining' },
  { keywords: ['mos burger', 'mosburger'],         display: 'MOS Burger',      category: 'dining' },
  { keywords: ['paris baguette'],                  display: 'Paris Baguette',  category: 'dining' },
  { keywords: ['swee choon'],                      display: 'Swee Choon',      category: 'dining' },
  { keywords: ['crystal jade'],                    display: 'Crystal Jade',    category: 'dining' },
  { keywords: ['putien'],                          display: 'PUTIEN',          category: 'dining' },
  { keywords: ['saizeriya'],                       display: 'Saizeriya',       category: 'dining' },
  { keywords: ['collins'],                         display: "Collin's",        category: 'dining' },
  { keywords: ['stuffd', "stuff'd"],               display: "Stuff'd",         category: 'dining' },
  { keywords: ['each a cup', 'playmade', 'chicha', 'milksha'], display: 'Bubble Tea', category: 'dining' },
  // Transport
  { keywords: ['grab'],                            display: 'Grab',            category: 'transport' },
  { keywords: ['gojek'],                           display: 'Gojek',           category: 'transport' },
  { keywords: ['tada'],                            display: 'TADA',            category: 'transport' },
  { keywords: ['ryde'],                            display: 'Ryde',            category: 'transport' },
  { keywords: ['comfort', 'cdg', 'comfortdelgro'], display: 'Taxi',            category: 'transport' },
  { keywords: ['mrt', 'simplygo', 'ezlink', 'ez-link', 'ez link'], display: 'Public Transport', category: 'transport' },
  { keywords: ['bluesg'],                          display: 'BlueSG',          category: 'transport' },
  { keywords: ['parking', 'erp', 'carpark'],       display: 'Parking',         category: 'transport' },
  // Travel
  { keywords: ['agoda'],                           display: 'Agoda',           category: 'travel' },
  { keywords: ['booking.com', 'booking'],          display: 'Booking.com',     category: 'travel' },
  { keywords: ['trip.com'],                        display: 'Trip.com',        category: 'travel' },
  { keywords: ['expedia'],                         display: 'Expedia',         category: 'travel' },
  { keywords: ['airbnb'],                          display: 'Airbnb',          category: 'travel' },
  { keywords: ['klook'],                           display: 'Klook',           category: 'travel' },
  { keywords: ['traveloka'],                       display: 'Traveloka',       category: 'travel' },
  { keywords: ['sia', 'singapore airlines', 'singaporeair', 'krisshop'], display: 'Singapore Airlines', category: 'travel' },
  { keywords: ['scoot'],                           display: 'Scoot',           category: 'travel' },
  { keywords: ['jetstar'],                         display: 'Jetstar',         category: 'travel' },
  { keywords: ['airasia', 'air asia'],             display: 'AirAsia',         category: 'travel' },
  { keywords: ['cathay'],                          display: 'Cathay Pacific',  category: 'travel' },
  { keywords: ['emirates', 'qatar'],               display: 'Airline',         category: 'travel' },
  { keywords: ['marriott', 'hilton', 'shangri-la', 'shangrila'], display: 'Hotel', category: 'travel' },
  // Petrol
  { keywords: ['esso'],                            display: 'Esso',            category: 'petrol' },
  { keywords: ['shell'],                           display: 'Shell',           category: 'petrol' },
  { keywords: ['spc'],                             display: 'SPC',             category: 'petrol' },
  { keywords: ['caltex'],                          display: 'Caltex',          category: 'petrol' },
  { keywords: ['sinopec'],                         display: 'Sinopec',         category: 'petrol' },
  // Groceries / in-store (tap)
  { keywords: ['ntuc', 'fairprice', 'fair price'], display: 'NTUC FairPrice',  category: 'contactless' },
  { keywords: ['cold storage', 'coldstorage'],     display: 'Cold Storage',    category: 'contactless' },
  { keywords: ['sheng siong', 'shengsiong'],       display: 'Sheng Siong',     category: 'contactless' },
  { keywords: ['giant'],                           display: 'Giant',           category: 'contactless' },
  { keywords: ['don don donki', 'donki', 'dondondonki'], display: 'Don Don Donki', category: 'contactless' },
  { keywords: ['prime supermarket'],               display: 'Prime',           category: 'contactless' },
  { keywords: ['7-eleven', '7eleven', '711'],      display: '7-Eleven',        category: 'contactless' },
  { keywords: ['cheers'],                          display: 'Cheers',          category: 'contactless' },
  { keywords: ['guardian'],                        display: 'Guardian',        category: 'contactless' },
  { keywords: ['unity'],                           display: 'Unity',           category: 'contactless' },
  // Retail / shopping
  { keywords: ['uniqlo'],                          display: 'Uniqlo',          category: 'shopping' },
  { keywords: ['ikea'],                            display: 'IKEA',            category: 'shopping' },
  { keywords: ['h&m', 'hm'],                       display: 'H&M',             category: 'shopping' },
  { keywords: ['zara'],                            display: 'Zara',            category: 'shopping' },
  { keywords: ['cotton on', 'cottonon'],           display: 'Cotton On',       category: 'shopping' },
  { keywords: ['sephora'],                         display: 'Sephora',         category: 'shopping' },
  { keywords: ['charles & keith', 'charles keith', 'charleskeith'], display: 'Charles & Keith', category: 'shopping' },
  { keywords: ['lovebonito', 'love bonito'],       display: 'Love, Bonito',    category: 'shopping' },
  { keywords: ['decathlon'],                       display: 'Decathlon',       category: 'shopping' },
  { keywords: ['courts'],                          display: 'Courts',          category: 'shopping' },
  { keywords: ['harvey norman', 'harveynorman'],   display: 'Harvey Norman',   category: 'shopping' },
  { keywords: ['challenger'],                      display: 'Challenger',      category: 'shopping' },
  { keywords: ['best denki', 'bestdenki'],         display: 'Best Denki',      category: 'shopping' },
  { keywords: ['popular'],                         display: 'Popular',         category: 'shopping' },
  { keywords: ['takashimaya', 'isetan', 'tangs', 'metro', 'bhg', 'robinsons'], display: 'Department Store', category: 'shopping' },
  { keywords: ['apple store', 'apple'],            display: 'Apple',           category: 'shopping' },
  { keywords: ['muji'],                            display: 'MUJI',            category: 'shopping' },
];

// Direct category words the user can type
const CATEGORY_WORDS: Record<string, SpendCategory> = {
  online: 'online', subscription: 'online', sub: 'online',
  shopping: 'shopping', retail: 'shopping', clothes: 'shopping', mall: 'shopping',
  dining: 'dining', food: 'dining', dinner: 'dining', lunch: 'dining', breakfast: 'dining',
  brunch: 'dining', supper: 'dining', coffee: 'dining', kopi: 'dining', cafe: 'dining',
  restaurant: 'dining', hawker: 'dining', makan: 'dining', boba: 'dining', bbt: 'dining',
  zichar: 'dining', omakase: 'dining', buffet: 'dining', delivery: 'dining',
  travel: 'travel', hotel: 'travel', flight: 'travel', flights: 'travel', staycay: 'travel', staycation: 'travel',
  transport: 'transport', taxi: 'transport', cab: 'transport', bus: 'transport', train: 'transport',
  petrol: 'petrol', fuel: 'petrol', gas: 'petrol',
  tap: 'contactless', paywave: 'contactless', contactless: 'contactless',
  groceries: 'contactless', grocery: 'contactless', supermarket: 'contactless',
  overseas: 'fcy', fcy: 'fcy', foreign: 'fcy', jb: 'fcy', bangkok: 'fcy', japan: 'fcy',
  general: 'general', bills: 'general', bill: 'general', insurance: 'general',
  tax: 'general', rent: 'general', utilities: 'general', doctor: 'general', clinic: 'general',
};

// ─── Bank aliases ──────────────────────────────────────────────

const BANK_ALIASES: Record<string, string> = {
  ocbc: 'OCBC',
  dbs: 'DBS', posb: 'DBS',
  uob: 'UOB',
  citi: 'Citibank', citibank: 'Citibank',
  hsbc: 'HSBC',
  amex: 'Amex', americanexpress: 'Amex',
  sc: 'Standard Chartered', stanchart: 'Standard Chartered',
  maybank: 'Maybank',
  instarem: 'Instarem', amaze: 'Instarem',
};

/**
 * Generic word stems that hint at a category when the merchant itself is
 * unknown ("$12 kopi cafe near office" → dining). Substring match against
 * leftover tokens, so "rooftop-bar" or "cafes" still hit.
 */
const GENERIC_HINTS: [string, SpendCategory][] = [
  ['cafe', 'dining'], ['coffee', 'dining'], ['bakery', 'dining'], ['bistro', 'dining'],
  ['grill', 'dining'], ['ramen', 'dining'], ['noodle', 'dining'], ['eatery', 'dining'],
  ['kitchen', 'dining'], ['dessert', 'dining'], ['kopitiam', 'dining'], ['seafood', 'dining'],
  ['steamboat', 'dining'], ['hotpot', 'dining'], ['izakaya', 'dining'], ['bites', 'dining'],
  ['resort', 'travel'], ['airline', 'travel'], ['airways', 'travel'], ['cruise', 'travel'],
  ['boutique', 'shopping'], ['outlet', 'shopping'],
  ['minimart', 'contactless'], ['market', 'contactless'],
  ['pharmacy', 'general'], ['dental', 'general'], ['hospital', 'general'],
];

// Shorthand the miles community uses for card names → substring of the real name
const CARD_NAME_ALIASES: Record<string, string> = {
  ppv: 'preferred',
  ww: 'womans world', wwmc: 'womans world',
  kf: 'krisflyer',
  pm: 'premiermiles', pmiles: 'premiermiles',
  vi: 'visa infinite', scvi: 'visa infinite',
  t1: 'travelone',
  revo: 'revolution',
  lady: 'ladys', ladies: 'ladys',
};

const STOPWORDS = new Set([
  'card', 'credit', 'the', 'on', 'at', 'with', 'my', 'for', 'via', 'using', 'paid',
  'visa', 'mastercard', 'mc', 'sgd', 's', 'spent', 'spend', 'bought', 'buy',
  'yesterday', 'today', 'and', 'a', 'an', 'of', 'in', 'to', 'from',
]);

// ─── Parse result ──────────────────────────────────────────────

export interface ParseResult {
  amountSgd: number | null;
  card: Card | null;             // resolved card (exactly one match)
  cardCandidates: Card[];        // >1 when ambiguous, 0 when no signal
  category: SpendCategory | null;
  merchant: string | null;       // display name for the note
  leftoverText: string | null;   // unrecognised merchant-ish words (used for learning)
  dateISO: string;               // today unless "yesterday"
}

function normalise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[,;]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Extract the first money-like number: "300", "$300", "300.50", "$1.2k", "1k" */
function extractAmount(text: string): number | null {
  const m = text.toLowerCase().match(/\$?\s*(\d+(?:[.,]\d+)?)\s*(k\b)?/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(',', '.'));
  if (m[2]) n *= 1000;
  return n > 0 ? n : null;
}

function isPhrase(keyword: string): boolean {
  return keyword.includes(' ') || keyword.includes('.') || keyword.includes('&');
}

/** Exact match: phrase in joined text, or token equality. */
function exactHit(keyword: string, tokens: string[], joined: string): boolean {
  if (isPhrase(keyword)) return joined.includes(keyword);
  return tokens.includes(keyword);
}

/**
 * Fuzzy match (only consulted when nothing matched exactly):
 * - token extends keyword ("uniqlos" → uniqlo), keyword ≥4 chars
 * - token is a near-complete prefix of keyword ("starbuck" → starbucks):
 *   token ≥6 chars AND within 2 chars of the full keyword, so generic
 *   words like "singapore" can't hit "singaporeair".
 */
function fuzzyHit(keyword: string, tokens: string[]): boolean {
  if (isPhrase(keyword)) return false;
  return tokens.some(
    t =>
      (keyword.length >= 4 && t.startsWith(keyword)) ||
      (t.length >= 6 && keyword.startsWith(t) && keyword.length - t.length <= 2),
  );
}


/** Shared merchant + category matching used by parseTransaction and resolveMerchant. */
function matchMerchant(
  tokens: string[],
  joined: string,
  learned: LearnedMerchant[],
): { merchant: string | null; category: SpendCategory | null; matchedTokens: Set<string> } {
  let merchant: string | null = null;
  let category: SpendCategory | null = null;
  const matchedTokens = new Set<string>();

  const learnedSorted = [...learned].sort((a, b) => b.keyword.length - a.keyword.length);
  const defs = MERCHANTS.flatMap(d => d.keywords.map(k => ({ k, d }))).sort(
    (a, b) => b.k.length - a.k.length,
  );

  // Pass 1: EXACT matches (learned first — user corrections beat the
  // dictionary). Pass 2: fuzzy matches, only if nothing matched exactly.
  // This stops "SHOPEE SINGAPORE" fuzzy-matching Singapore Airlines.
  for (const exact of [true, false]) {
    for (const lm of learnedSorted) {
      const hit = exact ? exactHit(lm.keyword, tokens, joined) : fuzzyHit(lm.keyword, tokens);
      if (hit) {
        merchant = lm.display;
        category = lm.category;
        lm.keyword.split(' ').forEach(w => matchedTokens.add(w));
        break;
      }
    }
    if (!merchant) {
      for (const { k, d } of defs) {
        const hit = exact ? exactHit(k, tokens, joined) : fuzzyHit(k, tokens);
        if (hit) {
          merchant = d.display;
          category = d.category;
          k.split(' ').forEach(w => matchedTokens.add(w));
          break;
        }
      }
    }
    if (merchant) break;
  }

  // 3. Explicit category word overrides the merchant's default category
  for (const t of tokens) {
    if (CATEGORY_WORDS[t]) {
      category = CATEGORY_WORDS[t];
      matchedTokens.add(t);
      break;
    }
  }

  return { merchant, category, matchedTokens };
}

function genericHint(tokens: string[]): SpendCategory | null {
  for (const t of tokens) {
    for (const [stem, cat] of GENERIC_HINTS) {
      if (t.includes(stem)) return cat;
    }
  }
  return null;
}

export interface MerchantResolution {
  merchant: string | null;
  category: SpendCategory | null;
}

/**
 * Merchant-only lookup (no amount/card parsing) — powers the Swipe tab's
 * search box. "din tai fung" → { merchant: 'Din Tai Fung', category: 'dining' }.
 */
export function resolveMerchant(
  text: string,
  learned: LearnedMerchant[] = loadLearnedMerchants(),
): MerchantResolution {
  const tokens = normalise(text);
  const joined = ` ${tokens.join(' ')} `.replace(/\s+/g, ' ').trim();
  const m = matchMerchant(tokens, joined, learned);
  let category = m.category;
  let merchant = m.merchant;
  if (!category) category = genericHint(tokens);
  if (!merchant && tokens.length > 0) {
    merchant = tokens.join(' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return { merchant, category };
}

export function parseTransaction(
  text: string,
  myCards: Card[],
  learned: LearnedMerchant[] = loadLearnedMerchants(),
): ParseResult {
  const tokens = normalise(text);
  const joined = ` ${tokens.join(' ')} `.replace(/\s+/g, ' ').trim();

  const amountSgd = extractAmount(text);

  // ── Merchant + category ──
  const matched = matchMerchant(tokens, joined, learned);
  let merchant = matched.merchant;
  let category = matched.category;
  const matchedKeywordTokens = matched.matchedTokens;

  // ── Card matching against the user's wallet ──
  const spendable = myCards.filter(c => !c.isAmazePairingCard);
  let candidates = spendable;
  let narrowed = false;
  const cardTokens = new Set<string>();

  for (const t of tokens) {
    const bank = BANK_ALIASES[t];
    if (bank) {
      cardTokens.add(t);
      const byBank = spendable.filter(c => c.bank === bank);
      if (byBank.length > 0) {
        candidates = byBank;
        narrowed = true;
      }
      break;
    }
  }

  const nameTokens = tokens.filter(
    t => !STOPWORDS.has(t) && !BANK_ALIASES[t] && !CATEGORY_WORDS[t] && !/^\$?\d/.test(t) && !matchedKeywordTokens.has(t),
  );
  if (nameTokens.length > 0) {
    const nameHit = (c: Card, t: string): boolean => {
      const name = c.cardName.toLowerCase().replace(/[''’]/g, '');
      const target = CARD_NAME_ALIASES[t];
      if (target) return name.includes(target);
      return t.length >= 3 && name.includes(t);
    };
    const byName = candidates.filter(c => nameTokens.some(t => nameHit(c, t)));
    if (byName.length > 0 && byName.length < candidates.length) {
      candidates = byName;
      narrowed = true;
      byName.forEach(c => {
        nameTokens.forEach(t => { if (nameHit(c, t)) cardTokens.add(t); });
      });
    }
  }

  const card = narrowed && candidates.length === 1 ? candidates[0] : null;

  // ── Leftover merchant-ish words (for the note + learning) ──
  const leftoverTokens = tokens.filter(
    t =>
      !STOPWORDS.has(t) &&
      !BANK_ALIASES[t] &&
      !CATEGORY_WORDS[t] &&
      !/^\$?\d/.test(t) &&
      !matchedKeywordTokens.has(t) &&
      !cardTokens.has(t),
  );
  const leftoverText = leftoverTokens.length > 0 ? leftoverTokens.join(' ') : null;

  // No dictionary hit but there are leftover words → use them as the merchant label
  if (!merchant && leftoverText) {
    merchant = leftoverText.replace(/\b\w/g, c => c.toUpperCase());
  }

  // Still no category? Look for generic stems in the leftover words
  // ("cafe", "bakery", "resort") before falling back to Everything else.
  if (!category && leftoverTokens.length > 0) {
    outer: for (const t of leftoverTokens) {
      for (const [stem, cat] of GENERIC_HINTS) {
        if (t.includes(stem)) {
          category = cat;
          break outer;
        }
      }
    }
  }

  const dateISO = tokens.includes('yesterday')
    ? new Date(Date.now() - 86_400_000).toISOString()
    : new Date().toISOString();

  return {
    amountSgd,
    card,
    cardCandidates: narrowed ? candidates : [],
    category,
    merchant,
    leftoverText,
    dateISO,
  };
}
