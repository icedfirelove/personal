// ============================================================
// MilesVault — Singapore Miles-Earning Credit Card Database
// Last verified: Jan 2026 against MileLion (milelion.com).
// Rates change — always confirm with your bank's official
// terms and milelion.com before optimising spend.
// ============================================================

export interface EarnRate {
  label: string;         // e.g. "Online Shopping"
  mpd: number;           // miles per dollar (effective, post-conversion)
  capSgd?: number;       // monthly spend cap in SGD (undefined = uncapped)
  notes?: string;        // e.g. "Weekends only", "Contactless tap required"
}

export interface TransferPartner {
  programme: string;     // e.g. "KrisFlyer"
  airline: string;
  pointsPerMile: number; // e.g. 2 → 2 points = 1 mile
  conversionFeeSgd: number;
  blockSizeMiles: number;
  transferTimeDaysMin: number;
  transferTimeDaysMax: number;
}

export interface Card {
  id: string;
  cardName: string;
  bank: string;
  cardType: 'Visa' | 'Mastercard' | 'Amex';
  annualFeeSgd: number;
  incomeRequirementSgd: number;
  pointsCurrency: string | null;    // null = earns miles directly (Amex KF)
  earnRates: EarnRate[];
  capResetDay: string;              // e.g. "1st of each calendar month"
  amazeCompatible: boolean;
  /**
   * True when this card earns bonus mpd that stacks with HeyMax Max Miles.
   * Cards with an online-shopping or department-store (MCC 5311) bonus tier
   * benefit most — either via HeyMax affiliate links (online shopping cards)
   * or via HeyMax gift cards that code as MCC 5311.
   */
  heymaxCompatible: boolean;
  transferPartners: TransferPartner[];
  officialPageUrl: string;
  imagePath: string;                // /cards/{id}.webp — run scripts/download-card-images.mjs
  bankColor: string;
  bankTextColor: string;
  tagline: string;                  // one-line sell, shown on card tile
  notes: string;
  isAmazePairingCard?: boolean;
}

// ─── Transfer Partner Templates ──────────────────────────────

const krisflyer = (ppm: number, fee: number, block = 5000): TransferPartner => ({
  programme: 'KrisFlyer',
  airline: 'Singapore Airlines / Scoot',
  pointsPerMile: ppm,
  conversionFeeSgd: fee,
  blockSizeMiles: block,
  transferTimeDaysMin: 3,
  transferTimeDaysMax: 7,
});

const asiaMiles = (ppm: number, fee: number, block = 5000): TransferPartner => ({
  programme: 'Asia Miles',
  airline: 'Cathay Pacific',
  pointsPerMile: ppm,
  conversionFeeSgd: fee,
  blockSizeMiles: block,
  transferTimeDaysMin: 3,
  transferTimeDaysMax: 7,
});

const avios = (ppm: number, fee: number, block = 5000): TransferPartner => ({
  programme: 'Avios',
  airline: 'British Airways / Qatar Airways',
  pointsPerMile: ppm,
  conversionFeeSgd: fee,
  blockSizeMiles: block,
  transferTimeDaysMin: 5,
  transferTimeDaysMax: 10,
});

const flyingBlue = (ppm: number, fee: number, block = 5000): TransferPartner => ({
  programme: 'Flying Blue',
  airline: 'Air France / KLM',
  pointsPerMile: ppm,
  conversionFeeSgd: fee,
  blockSizeMiles: block,
  transferTimeDaysMin: 3,
  transferTimeDaysMax: 7,
});

const velocity = (ppm: number, fee: number, block = 5000): TransferPartner => ({
  programme: 'Velocity',
  airline: 'Virgin Australia',
  pointsPerMile: ppm,
  conversionFeeSgd: fee,
  blockSizeMiles: block,
  transferTimeDaysMin: 5,
  transferTimeDaysMax: 10,
});

const milesAndMore = (ppm: number, fee: number, block = 5000): TransferPartner => ({
  programme: 'Miles & More',
  airline: 'Lufthansa Group',
  pointsPerMile: ppm,
  conversionFeeSgd: fee,
  blockSizeMiles: block,
  transferTimeDaysMin: 5,
  transferTimeDaysMax: 10,
});

// ─── Bank Colours ────────────────────────────────────────────

const bankColors: Record<string, { bg: string; text: string }> = {
  Citibank:            { bg: '#003B70', text: '#FFFFFF' },
  DBS:                 { bg: '#EF3E42', text: '#FFFFFF' },
  UOB:                 { bg: '#004B8D', text: '#FFFFFF' },
  HSBC:                { bg: '#DB0011', text: '#FFFFFF' },
  'Standard Chartered':{ bg: '#0B2E5F', text: '#FFFFFF' },
  Maybank:             { bg: '#F0A500', text: '#FFFFFF' },
  Amex:                { bg: '#007BC1', text: '#FFFFFF' },
  OCBC:                { bg: '#E3001B', text: '#FFFFFF' },
  Instarem:            { bg: '#6B2D8B', text: '#FFFFFF' },
};

const bc = (bank: string) => bankColors[bank] ?? { bg: '#374151', text: '#FFFFFF' };

// ─── Card Database ────────────────────────────────────────────

export const CARDS: Card[] = [
  // ── Citibank ────────────────────────────────────────────────
  {
    id: 'citi-rewards',
    cardName: 'Citi Rewards Mastercard',
    bank: 'Citibank',
    cardType: 'Mastercard',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'ThankYou Points',
    tagline: '4 mpd on online & retail shopping',
    earnRates: [
      { label: 'Online Shopping',   mpd: 4,   capSgd: 1000 },
      { label: 'Retail Shopping',   mpd: 4,   capSgd: 1000, notes: 'Bags, clothes, shoes, accessories. Combined cap with online.' },
      { label: 'General',           mpd: 0.4 },
    ],
    capResetDay: '1st of each calendar month (statement month)',
    amazeCompatible: true,
    heymaxCompatible: true,
    transferPartners: [
      krisflyer(2.5, 27.25, 10000),
      asiaMiles(2.5, 27.25, 10000),
      avios(2.5, 27.25, 10000),
      flyingBlue(2.5, 27.25, 10000),
      velocity(2.5, 27.25, 10000),
    ],
    officialPageUrl: 'https://www.citibank.com.sg/credit-cards/rewards/citi-rewards-card/',
    imagePath: '/cards/citi-rewards.webp',
    ...{ bankColor: bc('Citibank').bg, bankTextColor: bc('Citibank').text },
    notes: 'Cap is 9,000 bonus ThankYou Points per statement month (= $1,000 @ 4 mpd). Hotels booked direct and airline tickets earn only 0.4 mpd. ThankYou Points do not expire while card is active.',
  },
  {
    id: 'citi-premiermiles',
    cardName: 'Citi PremierMiles Visa',
    bank: 'Citibank',
    cardType: 'Visa',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'ThankYou Points',
    tagline: '2 mpd FCY · 1.2 mpd local · widest transfer network',
    earnRates: [
      { label: 'Foreign Currency (FCY)', mpd: 2 },
      { label: 'Local Spend',            mpd: 1.2 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2.5, 27.25, 10000),
      asiaMiles(2.5, 27.25, 10000),
      avios(2.5, 27.25, 10000),
      flyingBlue(2.5, 27.25, 10000),
      velocity(2.5, 27.25, 10000),
    ],
    officialPageUrl: 'https://www.citibank.com.sg/credit-cards/premiermiles/',
    imagePath: '/cards/citi-premiermiles.webp',
    ...{ bankColor: bc('Citibank').bg, bankTextColor: bc('Citibank').text },
    notes: 'Good everyday card. ThankYou Points do not expire while card is active — ideal for stockpiling before a big transfer.',
  },
  {
    id: 'citi-prestige',
    cardName: 'Citi Prestige Card',
    bank: 'Citibank',
    cardType: 'Mastercard',
    annualFeeSgd: 535.00,
    incomeRequirementSgd: 120000,
    pointsCurrency: 'ThankYou Points',
    tagline: '3.25 mpd airlines & hotels · 2 mpd FCY',
    earnRates: [
      { label: 'Airlines & Hotels',       mpd: 3.25, notes: 'Airline & hotel spend only' },
      { label: 'Foreign Currency (FCY)',   mpd: 2 },
      { label: 'Local Spend',             mpd: 1.3 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2.5, 27.25, 10000),
      asiaMiles(2.5, 27.25, 10000),
      avios(2.5, 27.25, 10000),
      flyingBlue(2.5, 27.25, 10000),
    ],
    officialPageUrl: 'https://www.citibank.com.sg/credit-cards/prestige/',
    imagePath: '/cards/citi-prestige.webp',
    ...{ bankColor: bc('Citibank').bg, bankTextColor: bc('Citibank').text },
    notes: 'Includes 4th night free at hotels (twice per year), Priority Pass, unlimited lounge access. Best for premium travel spend.',
  },

  // ── DBS ─────────────────────────────────────────────────────
  {
    id: 'dbs-womans-world',
    cardName: "DBS Woman's World Mastercard",
    bank: 'DBS',
    cardType: 'Mastercard',
    annualFeeSgd: 192.60,
    incomeRequirementSgd: 80000,
    pointsCurrency: 'DBS Points',
    tagline: '4 mpd online shopping · no earning blocks',
    earnRates: [
      { label: 'Online Shopping', mpd: 4,   capSgd: 1000 },
      { label: 'FCY Spend',       mpd: 1.2 },
      { label: 'General',         mpd: 0.4 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: true,
    transferPartners: [
      krisflyer(2, 26.75, 5000),
      asiaMiles(2, 26.75, 5000),
      avios(2, 26.75, 5000),
      flyingBlue(2, 26.75, 5000),
    ],
    officialPageUrl: 'https://www.dbs.com.sg/personal/cards/credit-cards/dbs-woman-mastercard-card',
    imagePath: '/cards/dbs-womans-world.webp',
    ...{ bankColor: bc('DBS').bg, bankTextColor: bc('DBS').text },
    notes: "Points calculated on exact transaction amount ÷ 5 — no $5 rounding blocks. Requires $80k income. Open to all genders despite the name.",
  },
  {
    id: 'dbs-altitude-visa',
    cardName: 'DBS Altitude Visa Signature',
    bank: 'DBS',
    cardType: 'Visa',
    annualFeeSgd: 192.60,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'DBS Points',
    tagline: '3 mpd travel · 2 mpd FCY · uncapped',
    earnRates: [
      { label: 'Travel (Flights & Hotels)', mpd: 3, notes: 'Online flight/hotel bookings via travel sites' },
      { label: 'Foreign Currency (FCY)',     mpd: 2 },
      { label: 'Local Spend',               mpd: 1.3 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2, 26.75, 5000),
      asiaMiles(2, 26.75, 5000),
      avios(2, 26.75, 5000),
      flyingBlue(2, 26.75, 5000),
      milesAndMore(2, 26.75, 5000),
    ],
    officialPageUrl: 'https://www.dbs.com.sg/personal/cards/credit-cards/dbs-altitude-visa-signature-card',
    imagePath: '/cards/dbs-altitude-visa.webp',
    ...{ bankColor: bc('DBS').bg, bankTextColor: bc('DBS').text },
    notes: 'Solid all-rounder. Best used for travel bookings where it hits 3 mpd uncapped. Annual fee waivable with $25k annual spend.',
  },
  {
    id: 'dbs-altitude-amex',
    cardName: 'DBS Altitude American Express',
    bank: 'DBS',
    cardType: 'Amex',
    annualFeeSgd: 192.60,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'DBS Points',
    tagline: '3 mpd travel · 2 mpd FCY · Amex benefits',
    earnRates: [
      { label: 'Travel (Flights & Hotels)', mpd: 3 },
      { label: 'Foreign Currency (FCY)',     mpd: 2 },
      { label: 'Local Spend',               mpd: 1.3 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2, 26.75, 5000),
      asiaMiles(2, 26.75, 5000),
      avios(2, 26.75, 5000),
      flyingBlue(2, 26.75, 5000),
    ],
    officialPageUrl: 'https://www.dbs.com.sg/personal/cards/credit-cards/dbs-altitude-american-express-card',
    imagePath: '/cards/dbs-altitude-amex.webp',
    ...{ bankColor: bc('DBS').bg, bankTextColor: bc('DBS').text },
    notes: 'Same earn rates as Altitude Visa. Amex acceptance is narrower — carry both if you hold them. Shares the same DBS Points pool.',
  },
  {
    id: 'dbs-vantage',
    cardName: 'DBS Vantage Visa Infinite',
    bank: 'DBS',
    cardType: 'Visa',
    annualFeeSgd: 588.50,
    incomeRequirementSgd: 120000,
    pointsCurrency: 'DBS Points',
    tagline: '2.3 mpd FCY · 1.5 mpd local · concierge & lounge',
    earnRates: [
      { label: 'Foreign Currency (FCY)', mpd: 2.3 },
      { label: 'Local Spend',            mpd: 1.5 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2, 26.75, 5000),
      asiaMiles(2, 26.75, 5000),
      avios(2, 26.75, 5000),
      flyingBlue(2, 26.75, 5000),
    ],
    officialPageUrl: 'https://www.dbs.com.sg/personal/cards/credit-cards/dbs-vantage-visa-infinite-card',
    imagePath: '/cards/dbs-vantage.webp',
    ...{ bankColor: bc('DBS').bg, bankTextColor: bc('DBS').text },
    notes: 'Premium card with unlimited Priority Pass, concierge, and travel insurance. Earn rates are solid but not best-in-class. Requires $120k income.',
  },

  // ── UOB ─────────────────────────────────────────────────────
  {
    id: 'uob-ppv',
    cardName: 'UOB Preferred Visa',
    bank: 'UOB',
    cardType: 'Visa',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'UNI$',
    tagline: '4 mpd via Apple/Google Pay at ANY shop · split $600/$600 caps',
    earnRates: [
      { label: 'Online Shopping',    mpd: 4, capSgd: 600,  notes: 'Separate $600/month cap. Excludes air tickets & cruises (0.4 mpd).' },
      { label: 'Contactless Tap',    mpd: 4, capSgd: 600,  notes: 'PHONE tap only (Apple/Google/Samsung Pay) — physical card tap and in-app payments earn 0.4 mpd. Works at any merchant category. Separate $600/month cap. Min $5 transaction.' },
      { label: 'General',            mpd: 0.4 },
    ],
    capResetDay: 'Your UOB statement date (check your bill)',
    amazeCompatible: true,
    heymaxCompatible: true,
    transferPartners: [
      krisflyer(2, 25.00, 5000),
      asiaMiles(2, 25.00, 5000),
      avios(2, 25.00, 5000),
      flyingBlue(2, 25.00, 5000),
      velocity(2, 25.00, 5000),
    ],
    officialPageUrl: 'https://www.uob.com.sg/personal/cards/credit-cards/uob-preferred-platinum-visa-card.page',
    imagePath: '/cards/uob-ppv.webp',
    ...{ bankColor: bc('UOB').bg, bankTextColor: bc('UOB').text },
    notes: 'Renamed from "UOB Preferred Platinum Visa" in Mar 2026. The killer feature: paying by PHONE tap (Apple/Google/Samsung Pay) earns 4 mpd at virtually any physical merchant — dining, groceries, retail, anything. Caveats: physical card tap does NOT count, in-app payments do NOT count, SMART$ merchants excluded. UNI$ expire 2 years from end of month earned. From Oct 2025: separate $600/month sub-caps for online and mobile contactless (previously combined $1,100).',
  },
  {
    id: 'uob-ladys-card',
    cardName: "UOB Lady's Card Mastercard",
    bank: 'UOB',
    cardType: 'Mastercard',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'UNI$',
    tagline: '4 mpd on your chosen category (1 quarter at a time)',
    earnRates: [
      { label: 'Chosen Bonus Category', mpd: 4, capSgd: 1000, notes: 'Pick 1 category per quarter: dining, travel, fashion, entertainment, or transport' },
      { label: 'General',               mpd: 0.4 },
    ],
    capResetDay: 'Your UOB statement date (check your bill)',
    amazeCompatible: true,
    heymaxCompatible: true,
    transferPartners: [
      krisflyer(2, 25.00, 5000),
      asiaMiles(2, 25.00, 5000),
      avios(2, 25.00, 5000),
    ],
    officialPageUrl: "https://www.uob.com.sg/personal/cards/credit-cards/uob-ladys-mastercard.page",
    imagePath: "/cards/uob-ladys-card.webp",
    ...{ bankColor: bc('UOB').bg, bankTextColor: bc('UOB').text },
    notes: "Open to all genders. Select your bonus category via UOB TMRW app each quarter. $1,000/month cap on chosen category. UNI$ expire 2 years from end of month earned.",
  },
  {
    id: 'uob-ladys-solitaire',
    cardName: "UOB Lady's Solitaire Mastercard",
    bank: 'UOB',
    cardType: 'Mastercard',
    annualFeeSgd: 588.50,
    incomeRequirementSgd: 120000,
    pointsCurrency: 'UNI$',
    tagline: '4 mpd on 2 chosen categories · $750 cap each',
    earnRates: [
      { label: 'Bonus Category 1', mpd: 4, capSgd: 750, notes: 'Pick 2 categories per quarter: dining, travel, fashion, beauty, entertainment, family, or transport' },
      { label: 'Bonus Category 2', mpd: 4, capSgd: 750, notes: 'Second chosen category — same list, $750/month cap each' },
      { label: 'General',          mpd: 0.4 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: true,
    heymaxCompatible: true,
    transferPartners: [
      krisflyer(2, 25.00, 5000),
      asiaMiles(2, 25.00, 5000),
      avios(2, 25.00, 5000),
    ],
    officialPageUrl: "https://www.uob.com.sg/personal/cards/credit-cards/uob-ladys-solitaire-mastercard.page",
    imagePath: "/cards/uob-ladys-solitaire.webp",
    ...{ bankColor: bc('UOB').bg, bankTextColor: bc('UOB').text },
    notes: "As of 2026: 4 mpd on TWO bonus categories (previously 6 mpd on one). Each category capped at $750/month. Select via UOB TMRW app each quarter. Premium perks: Priority Pass, concierge, travel insurance. Verify current earn rates at uob.com.sg.",
  },
  {
    id: 'uob-prvi-miles-visa',
    cardName: 'UOB PRVI Miles Visa',
    bank: 'UOB',
    cardType: 'Visa',
    annualFeeSgd: 256.80,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'UNI$',
    tagline: '2.4 mpd FCY · 1.4 mpd local · 6 mpd select travel',
    earnRates: [
      { label: 'Travel (via UOB Travel)',    mpd: 6,   notes: 'Flights/hotels booked through UOB Travel or selected platforms' },
      { label: 'Foreign Currency (FCY)',     mpd: 2.4 },
      { label: 'Local Spend',               mpd: 1.4 },
    ],
    capResetDay: 'Your UOB statement date (check your bill)',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2, 25.00, 5000),
      asiaMiles(2, 25.00, 5000),
      avios(2, 25.00, 5000),
      flyingBlue(2, 25.00, 5000),
    ],
    officialPageUrl: 'https://www.uob.com.sg/personal/cards/credit-cards/uob-prvi-miles-visa-card.page',
    imagePath: '/cards/uob-prvi-miles-visa.webp',
    ...{ bankColor: bc('UOB').bg, bankTextColor: bc('UOB').text },
    notes: 'Strong everyday earner. 6 mpd through UOB Travel portal is very competitive for travel bookings. Annual fee worth paying for the FCY rate.',
  },
  {
    id: 'uob-prvi-miles-amex',
    cardName: 'UOB PRVI Miles Amex',
    bank: 'UOB',
    cardType: 'Amex',
    annualFeeSgd: 256.80,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'UNI$',
    tagline: '2.4 mpd FCY · 1.4 mpd local · Amex variant',
    earnRates: [
      { label: 'Travel (via UOB Travel)',    mpd: 6 },
      { label: 'Foreign Currency (FCY)',     mpd: 2.4 },
      { label: 'Local Spend',               mpd: 1.4 },
    ],
    capResetDay: 'Your UOB statement date (check your bill)',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2, 25.00, 5000),
      asiaMiles(2, 25.00, 5000),
    ],
    officialPageUrl: 'https://www.uob.com.sg/personal/cards/credit-cards/uob-prvi-miles-american-express-card.page',
    imagePath: '/cards/uob-prvi-miles-amex.webp',
    ...{ bankColor: bc('UOB').bg, bankTextColor: bc('UOB').text },
    notes: 'Same earn rates as PRVI Miles Visa. Shares the same UNI$ pool. Carry both if you want the flexibility of two networks.',
  },
  {
    id: 'uob-visa-infinite-metal',
    cardName: 'UOB Visa Infinite Metal Card',
    bank: 'UOB',
    cardType: 'Visa',
    annualFeeSgd: 654.00,
    incomeRequirementSgd: 150000,
    pointsCurrency: 'UNI$',
    tagline: '2 mpd FCY · 1.6 mpd local · metal card & premium perks',
    earnRates: [
      { label: 'Foreign Currency (FCY)', mpd: 2 },
      { label: 'Local Spend',            mpd: 1.6 },
    ],
    capResetDay: 'Your UOB statement date (check your bill)',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2, 25.00, 5000),
      asiaMiles(2, 25.00, 5000),
    ],
    officialPageUrl: 'https://www.uob.com.sg/personal/cards/credit-cards/uob-visa-infinite-metal-card.page',
    imagePath: '/cards/uob-visa-infinite-metal.webp',
    ...{ bankColor: bc('UOB').bg, bankTextColor: bc('UOB').text },
    notes: 'Ultra-premium metal card. Earn rates are decent but not exceptional — value is in perks: unlimited Priority Pass, travel insurance, and concierge. Requires $150k+ income.',
  },

  // ── HSBC ────────────────────────────────────────────────────
  {
    id: 'hsbc-travelone',
    cardName: 'HSBC TravelOne Visa',
    bank: 'HSBC',
    cardType: 'Visa',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'HSBC Reward Points',
    tagline: '2.4 mpd FCY · 10+ transfer partners · no conversion fee',
    earnRates: [
      { label: 'Foreign Currency (FCY)', mpd: 2.4 },
      { label: 'Local Spend',            mpd: 1.2 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      { programme: 'KrisFlyer',    airline: 'Singapore Airlines / Scoot',  pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Asia Miles',   airline: 'Cathay Pacific',               pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Avios',        airline: 'British Airways / Qatar',      pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Flying Blue',  airline: 'Air France / KLM',            pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Velocity',     airline: 'Virgin Australia',             pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Miles & More', airline: 'Lufthansa Group',             pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Etihad Guest', airline: 'Etihad Airways',              pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'ANA Mileage Club', airline: 'ANA',                     pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
    ],
    officialPageUrl: 'https://www.hsbc.com.sg/credit-cards/products/travelone/',
    imagePath: '/cards/hsbc-travelone.webp',
    ...{ bankColor: bc('HSBC').bg, bankTextColor: bc('HSBC').text },
    notes: 'Widest transfer network in Singapore (10+ partners). No conversion fee, 1:1 ratio to all partners, smallest block size (1,000 miles). Best card for transfer flexibility. Points valid 3 years.',
  },
  {
    id: 'hsbc-revolution',
    cardName: 'HSBC Revolution Credit Card',
    bank: 'HSBC',
    cardType: 'Mastercard',
    annualFeeSgd: 160.50,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'HSBC Reward Points',
    tagline: '4 mpd online & contactless · $1,000/month cap',
    earnRates: [
      { label: 'Online Shopping',    mpd: 4, capSgd: 1000, notes: 'Combined cap with Contactless. From March 2026.' },
      { label: 'Contactless Tap',    mpd: 4, capSgd: 1000, notes: 'Combined cap with Online. Also covers travel MCCs till further notice.' },
      { label: 'General',            mpd: 0.4 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: true,
    heymaxCompatible: true,
    transferPartners: [
      { programme: 'KrisFlyer',   airline: 'Singapore Airlines / Scoot', pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Asia Miles',  airline: 'Cathay Pacific',              pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Avios',       airline: 'British Airways / Qatar',     pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
    ],
    officialPageUrl: 'https://www.hsbc.com.sg/credit-cards/products/revolution/',
    imagePath: '/cards/hsbc-revolution.webp',
    ...{ bankColor: bc('HSBC').bg, bankTextColor: bc('HSBC').text },
    notes: 'Annual fee waived with $12,500 annual spend. Combined cap of $1,000/month across online + contactless. No conversion fee to transfer partners.',
  },
  {
    id: 'hsbc-visa-infinite',
    cardName: 'HSBC Visa Infinite',
    bank: 'HSBC',
    cardType: 'Visa',
    annualFeeSgd: 650.00,
    incomeRequirementSgd: 120000,
    pointsCurrency: 'HSBC Reward Points',
    tagline: '2.25 mpd FCY · 1.25 mpd local · unlimited lounge',
    earnRates: [
      { label: 'Foreign Currency (FCY)', mpd: 2.25 },
      { label: 'Local Spend',            mpd: 1.25 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      { programme: 'KrisFlyer',   airline: 'Singapore Airlines / Scoot', pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Asia Miles',  airline: 'Cathay Pacific',              pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Avios',       airline: 'British Airways / Qatar',     pointsPerMile: 1, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
    ],
    officialPageUrl: 'https://www.hsbc.com.sg/credit-cards/products/visa-infinite/',
    imagePath: '/cards/hsbc-visa-infinite.webp',
    ...{ bankColor: bc('HSBC').bg, bankTextColor: bc('HSBC').text },
    notes: 'Unlimited Priority Pass, travel insurance, concierge. Earn rates decent for a premium card but not exceptional. $120k income required.',
  },

  // ── Standard Chartered ───────────────────────────────────────
  {
    id: 'sc-journey',
    cardName: 'Standard Chartered Journey Visa',
    bank: 'Standard Chartered',
    cardType: 'Visa',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: '360° Rewards Points',
    tagline: '3 mpd dining & travel · 2 mpd FCY · no caps',
    earnRates: [
      { label: 'Dining',                  mpd: 3 },
      { label: 'Travel Bookings',         mpd: 3 },
      { label: 'Foreign Currency (FCY)',   mpd: 2 },
      { label: 'General',                 mpd: 1 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2, 0, 5000),
      asiaMiles(2, 0, 5000),
      avios(2, 0, 5000),
      flyingBlue(2, 0, 5000),
      velocity(2, 0, 5000),
    ],
    officialPageUrl: 'https://www.sc.com/sg/credit-cards/journey-credit-card/',
    imagePath: '/cards/sc-journey.webp',
    ...{ bankColor: bc('Standard Chartered').bg, bankTextColor: bc('Standard Chartered').text },
    notes: '3 mpd on dining and travel is uncapped — strong for heavy diners. No conversion fee is a bonus. 360° Points expire after 3 years.',
  },
  {
    id: 'sc-visa-infinite',
    cardName: 'Standard Chartered Visa Infinite',
    bank: 'Standard Chartered',
    cardType: 'Visa',
    annualFeeSgd: 588.50,
    incomeRequirementSgd: 150000,
    pointsCurrency: '360° Rewards Points',
    tagline: '3 mpd FCY · 1.4 mpd local · premium travel benefits',
    earnRates: [
      { label: 'Foreign Currency (FCY)', mpd: 3 },
      { label: 'Local Spend',            mpd: 1.4 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2, 0, 5000),
      asiaMiles(2, 0, 5000),
      avios(2, 0, 5000),
    ],
    officialPageUrl: 'https://www.sc.com/sg/credit-cards/visa-infinite/',
    imagePath: '/cards/sc-visa-infinite.webp',
    ...{ bankColor: bc('Standard Chartered').bg, bankTextColor: bc('Standard Chartered').text },
    notes: 'Best FCY rate in its class at 3 mpd. Unlimited Priority Pass. Suited for frequent travellers who spend heavily overseas. High income bar ($150k).',
  },

  // ── Maybank ──────────────────────────────────────────────────
  {
    id: 'maybank-world-mc',
    cardName: 'Maybank World Mastercard',
    bank: 'Maybank',
    cardType: 'Mastercard',
    annualFeeSgd: 240.00,
    incomeRequirementSgd: 80000,
    pointsCurrency: 'Treats Points',
    tagline: '2 mpd weekends (dining & shopping) · uncapped',
    earnRates: [
      { label: 'Weekend Dining',     mpd: 2,   notes: 'Saturdays & Sundays only — uncapped' },
      { label: 'Weekend Shopping',   mpd: 2,   notes: 'Saturdays & Sundays only — uncapped' },
      { label: 'FCY Spend',          mpd: 0.8 },
      { label: 'General',            mpd: 0.4 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      { programme: 'KrisFlyer', airline: 'Singapore Airlines / Scoot', pointsPerMile: 5, conversionFeeSgd: 26.75, blockSizeMiles: 5000, transferTimeDaysMin: 5, transferTimeDaysMax: 10 },
    ],
    officialPageUrl: 'https://www.maybank2u.com.sg/en/promotions/cards/world-mastercard.page',
    imagePath: '/cards/maybank-world-mc.webp',
    ...{ bankColor: bc('Maybank').bg, bankTextColor: bc('Maybank').text },
    notes: 'Uncapped 2 mpd on weekends is the headline. Conversion ratio is poor (5 Treats Points = 1 mile), and conversion is slow (5–10 days). Verify current Treats Points ratio as Maybank has changed this before.',
  },
  {
    id: 'maybank-horizon',
    cardName: 'Maybank Horizon Visa Signature',
    bank: 'Maybank',
    cardType: 'Visa',
    annualFeeSgd: 180.00,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'Treats Points',
    tagline: '3.2 mpd dining, transport & petrol',
    earnRates: [
      { label: 'Dining',            mpd: 3.2, capSgd: 3000 },
      { label: 'Public Transport',  mpd: 3.2, capSgd: 3000, notes: 'Combined cap with Dining & Petrol' },
      { label: 'Petrol',            mpd: 3.2, capSgd: 3000, notes: 'Combined cap' },
      { label: 'FCY Spend',         mpd: 2 },
      { label: 'General',           mpd: 0.4 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      { programme: 'KrisFlyer', airline: 'Singapore Airlines / Scoot', pointsPerMile: 5, conversionFeeSgd: 26.75, blockSizeMiles: 5000, transferTimeDaysMin: 5, transferTimeDaysMax: 10 },
    ],
    officialPageUrl: 'https://www.maybank2u.com.sg/en/promotions/cards/horizon-visa-signature.page',
    imagePath: '/cards/maybank-horizon.webp',
    ...{ bankColor: bc('Maybank').bg, bankTextColor: bc('Maybank').text },
    notes: 'Good for everyday dining and commuting spend. 5 Treats Points = 1 KrisFlyer mile — verify current ratio. Cap of $3,000/month across dining, transport, and petrol combined.',
  },

  // ── American Express ─────────────────────────────────────────
  {
    id: 'amex-krisflyer',
    cardName: 'Amex KrisFlyer Credit Card',
    bank: 'Amex',
    cardType: 'Amex',
    annualFeeSgd: 176.55,
    incomeRequirementSgd: 30000,
    pointsCurrency: null,
    tagline: 'Earns KrisFlyer miles directly · no transfer needed',
    earnRates: [
      { label: 'SIA / Scoot / KrisShop', mpd: 2,   notes: 'Singapore Airlines, Scoot, and KrisShop spend' },
      { label: 'General',                mpd: 1.1 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [],
    officialPageUrl: 'https://www.americanexpress.com/en-sg/credit-cards/krisflyer/',
    imagePath: '/cards/amex-krisflyer.webp',
    ...{ bankColor: bc('Amex').bg, bankTextColor: bc('Amex').text },
    notes: 'Miles credited directly to your KrisFlyer account — no conversion, no fee, no delay. Simple. Amex acceptance is the main limitation in Singapore.',
  },
  {
    id: 'amex-krisflyer-ascend',
    cardName: 'Amex KrisFlyer Ascend',
    bank: 'Amex',
    cardType: 'Amex',
    annualFeeSgd: 337.05,
    incomeRequirementSgd: 80000,
    pointsCurrency: null,
    tagline: '1.2 mpd local · 2 mpd SIA & Scoot · lounge access',
    earnRates: [
      { label: 'SIA / Scoot / KrisShop', mpd: 2,   notes: 'Earns directly to KrisFlyer, no transfer' },
      { label: 'General',                mpd: 1.2 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [],
    officialPageUrl: 'https://www.americanexpress.com/en-sg/credit-cards/krisflyer-ascend/',
    imagePath: '/cards/amex-krisflyer-ascend.webp',
    ...{ bankColor: bc('Amex').bg, bankTextColor: bc('Amex').text },
    notes: 'Comes with 2 KrisFlyer lounge passes and 4 SilverKris lounge visits per year. Miles credited directly to KrisFlyer. Higher annual fee than base KrisFlyer card.',
  },

  // ── OCBC ─────────────────────────────────────────────────────
  {
    id: 'ocbc-90n-mc',
    cardName: 'OCBC 90°N Mastercard',
    bank: 'OCBC',
    cardType: 'Mastercard',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'OCBC$',
    tagline: '2.1 mpd FCY · 1.3 mpd local · widest travel redemptions',
    earnRates: [
      { label: 'Foreign Currency (FCY)', mpd: 2.1 },
      { label: 'Local Spend',            mpd: 1.3 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(1, 0, 1000),
      asiaMiles(1, 0, 1000),
    ],
    officialPageUrl: 'https://www.ocbc.com/personal-banking/cards/90n-mastercard.page',
    imagePath: '/cards/ocbc-90n-mc.webp',
    ...{ bankColor: bc('OCBC').bg, bankTextColor: bc('OCBC').text },
    notes: 'OCBC$ can also be used for hotel stays, cashback, and retail vouchers — not just miles. No conversion fee. Points valid while card is active.',
  },
  {
    id: 'ocbc-90n-visa',
    cardName: 'OCBC 90°N Visa',
    bank: 'OCBC',
    cardType: 'Visa',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'OCBC$',
    tagline: '2.1 mpd FCY · 1.3 mpd local · Visa acceptance',
    earnRates: [
      { label: 'Foreign Currency (FCY)', mpd: 2.1 },
      { label: 'Local Spend',            mpd: 1.3 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(1, 0, 1000),
      asiaMiles(1, 0, 1000),
    ],
    officialPageUrl: 'https://www.ocbc.com/personal-banking/cards/90n-visa.page',
    imagePath: '/cards/ocbc-90n-visa.webp',
    ...{ bankColor: bc('OCBC').bg, bankTextColor: bc('OCBC').text },
    notes: 'Same earn rates as the Mastercard version. Visa network gives wider acceptance in Singapore. Shares the same OCBC$ rewards pool.',
  },
  {
    id: 'ocbc-voyage',
    cardName: 'OCBC Voyage Card',
    bank: 'OCBC',
    cardType: 'Visa',
    annualFeeSgd: 488.00,
    incomeRequirementSgd: 120000,
    pointsCurrency: 'VOYAGE Miles',
    tagline: '2.3 mpd FCY · 1.3 mpd local · VOYAGE Miles',
    earnRates: [
      { label: 'Dining',                  mpd: 2.2, notes: 'Via VOYAGE dining partners' },
      { label: 'Foreign Currency (FCY)',   mpd: 2.3 },
      { label: 'Local Spend',             mpd: 1.3 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(1, 0, 1000),
      asiaMiles(1, 0, 1000),
      avios(1, 0, 1000),
    ],
    officialPageUrl: 'https://www.ocbc.com/personal-banking/cards/voyage.page',
    imagePath: '/cards/ocbc-voyage.webp',
    ...{ bankColor: bc('OCBC').bg, bankTextColor: bc('OCBC').text },
    notes: 'VOYAGE Miles can be used to offset flights and hotels dollar-for-dollar. Priority Pass included. Requires $120k income.',
  },

  // ── Maybank ──────────────────────────────────────────────────
  {
    id: 'maybank-xl-rewards',
    cardName: 'Maybank XL Rewards Card',
    bank: 'Maybank',
    cardType: 'Mastercard',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'Treats Points',
    tagline: '4 mpd shopping & dining · 27 MCCs · min $500/month',
    earnRates: [
      { label: 'Shopping & Dining',      mpd: 4,   capSgd: 1000, notes: 'Covers 27 MCCs across dining, shopping, entertainment. Min $500/month spend required to trigger bonus.' },
      { label: 'Foreign Currency (FCY)', mpd: 2,   notes: 'Also earns 4 mpd on FCY (see notes)' },
      { label: 'General',               mpd: 0.4 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: true,
    transferPartners: [
      { programme: 'KrisFlyer', airline: 'Singapore Airlines / Scoot', pointsPerMile: 5, conversionFeeSgd: 26.75, blockSizeMiles: 5000, transferTimeDaysMin: 5, transferTimeDaysMax: 10 },
    ],
    officialPageUrl: 'https://apply.maybank.com.sg/cards/',
    imagePath: '/cards/maybank-xl-rewards.webp',
    ...{ bankColor: bc('Maybank').bg, bankTextColor: bc('Maybank').text },
    notes: 'Minimum $500/month spend required to unlock 4 mpd bonus (no partial bonus below this threshold). Covers 27 MCCs across dining (including fast food/MCC 5814), shopping, and travel. Also earns 4 mpd on FCY and air tickets with same cap. 5 Treats Points = 1 KrisFlyer mile.',
  },

  // ── OCBC ─────────────────────────────────────────────────────
  {
    id: 'ocbc-rewards',
    cardName: 'OCBC Rewards Card',
    bank: 'OCBC',
    cardType: 'Mastercard',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'OCBC$',
    tagline: '4 mpd shopping · 6 mpd Shopee/Lazada/Watsons',
    earnRates: [
      { label: 'Shopee, Lazada, Watsons, TikTok, Taobao', mpd: 6, capSgd: 1100, notes: 'Promo rate — verify current end date at ocbc.com' },
      { label: 'Shopping (13 MCCs)',                       mpd: 4, capSgd: 1100, notes: 'Covers major shopping MCCs incl. department stores, fashion, pharmacies' },
      { label: 'General',                                  mpd: 0.4 },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: true,
    transferPartners: [
      krisflyer(1, 0, 1000),
      asiaMiles(1, 0, 1000),
    ],
    officialPageUrl: 'https://www.ocbc.com/personal-banking/cards/rewards-card.page',
    imagePath: '/cards/ocbc-rewards.webp',
    ...{ bankColor: bc('OCBC').bg, bankTextColor: bc('OCBC').text },
    notes: 'Also known as OCBC Titanium Rewards. Whitelists specific merchant names beyond MCCs: Alibaba, AliExpress, Amazon, Guardian, Lazada, Mustafa Centre, NTUC Unity, Shopee, Taobao, TikTok Shop, Watsons. The 6 mpd promo rate for key e-commerce platforms has been extended multiple times — check ocbc.com for current dates. OCBC$ can also be used for cash rebates, hotel stays, and retail vouchers.',
  },

  // ── UOB ─────────────────────────────────────────────────────
  {
    id: 'krisflyer-uob',
    cardName: 'KrisFlyer UOB Credit Card',
    bank: 'UOB',
    cardType: 'Visa',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: null,
    tagline: '3 mpd SIA Group uncapped · 2.4 mpd online uncapped',
    earnRates: [
      { label: 'SIA / Scoot / KrisShop / Kris+ / Pelago', mpd: 3,   notes: 'Uncapped — earns KrisFlyer miles directly. Requires min $1,000 SIA Group spend per membership year.' },
      { label: 'Dining, Food Delivery, Online, Travel, Transport', mpd: 2.4, notes: 'Uncapped. Covers 33 MCCs + whitelisted merchant names (Agoda, Airbnb, Booking.com, Expedia, etc.). Online shopping MCCs only.' },
      { label: 'General',                                  mpd: 1.2 },
    ],
    capResetDay: 'Membership year anniversary (not calendar month)',
    amazeCompatible: false,
    heymaxCompatible: true,
    transferPartners: [],
    officialPageUrl: 'https://www.uob.com.sg/personal/cards/credit-cards/krisflyer-uob-credit-card.page',
    imagePath: '/cards/krisflyer-uob.webp',
    ...{ bankColor: bc('UOB').bg, bankTextColor: bc('UOB').text },
    notes: 'Earns KrisFlyer miles directly — no conversion needed, no fee. Bonus rates require a minimum of $1,000 SIA Group spend (Singapore Airlines, Scoot, KrisShop) in a membership year; otherwise earn rate drops to base rate. Uncapped 2.4 mpd on a wide range of online MCCs is a standout for big spenders. Reduced from 3 mpd in June 2025.',
  },
  {
    id: 'uob-visa-signature',
    cardName: 'UOB Visa Signature',
    bank: 'UOB',
    cardType: 'Visa',
    annualFeeSgd: 196.20,
    incomeRequirementSgd: 30000,
    pointsCurrency: 'UNI$',
    tagline: '4 mpd overseas + petrol + offline contactless (blacklist)',
    earnRates: [
      { label: 'Overseas Spend (FCY)',    mpd: 4, capSgd: 1200, notes: 'Separate $1,200/month cap (from July 2025)' },
      { label: 'Petrol',                 mpd: 4, capSgd: 1200, notes: 'Separate $1,200/month cap' },
      { label: 'Offline Contactless',    mpd: 4, capSgd: 1200, notes: 'Separate $1,200/month cap. Blacklist card — earns 4 mpd on all contactless except exclusions.' },
      { label: 'General',               mpd: 0.4 },
    ],
    capResetDay: 'Your UOB statement date (check your bill)',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      krisflyer(2, 25.00, 5000),
      asiaMiles(2, 25.00, 5000),
      avios(2, 25.00, 5000),
    ],
    officialPageUrl: 'https://www.uob.com.sg/personal/cards/credit-cards/uob-visa-signature-card.page',
    imagePath: '/cards/uob-visa-signature.webp',
    ...{ bankColor: bc('UOB').bg, bankTextColor: bc('UOB').text },
    notes: 'Blacklist card for offline contactless — earns 4 mpd on all contactless tap (not just whitelisted categories). Separate $1,200/month caps per category from July 2025. Strong for overseas trips and petrol. UNI$ expire 2 years from end of month earned.',
  },

  // ── American Express ─────────────────────────────────────────
  {
    id: 'amex-platinum-charge',
    cardName: 'AMEX Platinum Charge Card',
    bank: 'Amex',
    cardType: 'Amex',
    annualFeeSgd: 1712.00,
    incomeRequirementSgd: 200000,
    pointsCurrency: 'Membership Rewards Points',
    tagline: 'Premium charge card · up to 2 mpd · best-in-class perks',
    earnRates: [
      { label: 'Overseas Spend (FCY)', mpd: 2,   notes: 'Earns MR Points transferable to KrisFlyer and other programmes' },
      { label: 'Local Spend',         mpd: 0.87, notes: 'Base earn; MR Points transfer rate may vary' },
    ],
    capResetDay: '1st of each calendar month',
    amazeCompatible: false,
    heymaxCompatible: false,
    transferPartners: [
      { programme: 'KrisFlyer',    airline: 'Singapore Airlines / Scoot',  pointsPerMile: 2.5, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Asia Miles',   airline: 'Cathay Pacific',               pointsPerMile: 2.5, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Flying Blue',  airline: 'Air France / KLM',            pointsPerMile: 2.5, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
      { programme: 'Velocity',     airline: 'Virgin Australia',             pointsPerMile: 2.5, conversionFeeSgd: 0, blockSizeMiles: 1000, transferTimeDaysMin: 1, transferTimeDaysMax: 3 },
    ],
    officialPageUrl: 'https://www.americanexpress.com/en-sg/charge-cards/platinum/',
    imagePath: '/cards/amex-platinum-charge.webp',
    ...{ bankColor: bc('Amex').bg, bankTextColor: bc('Amex').text },
    notes: 'This is a charge card (no preset spending limit, must pay in full monthly). Valued primarily for its perks: unlimited Centurion Lounge + Priority Pass access, $1,200 annual travel credit, Fine Hotels + Resorts programme, Platinum Concierge. MR Points transfer ratio to KrisFlyer was devalued in 2025 — verify current ratio at amex.sg. High annual fee ($1,712) is offset by travel credits for frequent travellers.',
  },

  // ── Instarem ─────────────────────────────────────────────────
  {
    id: 'instarem-amaze',
    cardName: 'Instarem Amaze Card',
    bank: 'Instarem',
    cardType: 'Mastercard',
    annualFeeSgd: 0,
    incomeRequirementSgd: 0,
    pointsCurrency: null,
    tagline: 'Pairing card — converts online spend to contactless',
    earnRates: [],
    capResetDay: 'N/A',
    amazeCompatible: false,
    heymaxCompatible: false,
    isAmazePairingCard: true,
    transferPartners: [],
    officialPageUrl: 'https://www.instarem.com/en-sg/amaze/',
    imagePath: '/cards/instarem-amaze.webp',
    ...{ bankColor: bc('Instarem').bg, bankTextColor: bc('Instarem').text },
    notes: 'Not a miles-earning card itself. Pair with UOB PPV or Citi Rewards: when you pay online with Amaze (linked to those cards), Amaze re-codes the transaction as contactless, unlocking higher earn rates.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────

/** All unique banks in the card list */
export const BANKS = [...new Set(CARDS.map(c => c.bank))].sort();

/** Filter cards by income bracket */
export function getEligibleCards(incomePerYear: number): Card[] {
  return CARDS.filter(c => c.incomeRequirementSgd <= incomePerYear);
}

/** Get a card by ID */
export function getCard(id: string): Card | undefined {
  return CARDS.find(c => c.id === id);
}

/** Income bracket → numeric annual income (midpoint or boundary) */
export function bracketToIncome(bracket: string): number {
  switch (bracket) {
    case 'below-30k':  return 25000;
    case '30k-60k':    return 45000;
    case '60k-80k':    return 70000;
    case '80k-120k':   return 100000;
    case 'above-120k': return 150000;
    default:           return 0;
  }
}
