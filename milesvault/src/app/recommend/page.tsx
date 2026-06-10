'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCard, type Card } from '@/data/cards';
import { loadProfile } from '@/lib/storage';
import { CATEGORIES, categoryMeta, type SpendCategory } from '@/lib/categories';
import { parseTransaction, learnMerchant, type ParseResult } from '@/lib/parser';
import {
  loadSpend,
  addSpend,
  loadSettings,
  recommendCards,
  recommendCardsUncertain,
  type SpendEntry,
  type UserSettings,
  type Recommendation,
  type UncertainRecommendation,
} from '@/lib/spend';
import BottomNav from '@/components/BottomNav';

// ─── Card thumbnail ───────────────────────────────────────────

function CardThumb({ card }: { card: Card }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="relative w-14 h-9 rounded-lg flex-shrink-0 overflow-hidden"
      style={imgError || !card.imagePath ? { backgroundColor: card.bankColor } : {}}
    >
      {!imgError && card.imagePath ? (
        <Image
          src={card.imagePath}
          alt={card.cardName}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          sizes="56px"
        />
      ) : (
        <div className="absolute inset-0 flex items-end p-1" style={{ backgroundColor: card.bankColor }}>
          <span className="text-[7px] font-bold leading-tight" style={{ color: card.bankTextColor }}>
            {card.bank.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Single-category result row ───────────────────────────────

function RecRow({
  rec,
  rank,
  amount,
  onUse,
  logged,
}: {
  rec: Recommendation;
  rank: number;
  amount: number;
  onUse: () => void;
  logged: boolean;
}) {
  const best = rank === 0;
  return (
    <div
      className={`bg-surface rounded-2xl border overflow-hidden ${
        best ? 'border-primary shadow-md' : 'border-outline shadow-sm'
      }`}
    >
      {best && (
        <div className="bg-primary text-on-primary text-[10px] font-bold tracking-widest uppercase px-4 py-1">
          Best card for this swipe
        </div>
      )}
      <div className="flex items-center gap-3 px-4 py-3">
        <CardThumb card={rec.card} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{rec.card.cardName}</p>
          <p className="text-[11px] text-on-surface-variant truncate">
            {rec.bonusLabel ?? 'Base rate'}
            {rec.remainingCapSgd != null && (
              <span className={rec.hitsCap ? 'text-red-500 font-medium' : 'text-amber-400'}>
                {' '}· ${Math.round(rec.remainingCapSgd).toLocaleString()} cap left
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {rec.hitsCap && (
              <span className="text-[9px] font-bold text-red-400 bg-red-950 border border-red-900 rounded-full px-1.5 py-0.5">
                Partially over cap
              </span>
            )}
            {rec.conditional && (
              <span className="text-[9px] font-bold text-blue-400 bg-blue-950 border border-blue-900 rounded-full px-1.5 py-0.5">
                Only if chosen bonus category
              </span>
            )}
            {rec.amazeBoost && (
              <span className="text-[9px] font-bold text-purple-400 bg-purple-950 border border-purple-900 rounded-full px-1.5 py-0.5">
                ⚡ Amaze-compatible
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-on-surface">
            {rec.effectiveMpd.toFixed(2)}
            <span className="text-[10px] font-semibold text-on-surface-variant"> mpd</span>
          </p>
          {amount > 0 && (
            <p className="text-[11px] text-muted">≈ {Math.round(rec.milesEarned).toLocaleString()} miles</p>
          )}
          {amount > 0 && (
            <button
              onClick={onUse}
              disabled={logged}
              className={`mt-1.5 text-[11px] font-bold rounded-full px-3 py-1 transition-colors ${
                logged
                  ? 'bg-green-950 text-green-300 border border-green-800'
                  : 'bg-primary text-on-primary hover:bg-primary-hover'
              }`}
            >
              {logged ? '✓ Logged' : 'I used this'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Not-sure (dual-category) result row ──────────────────────

function UncertainRow({
  rec,
  rank,
  catA,
  catB,
  amount,
  onUse,
  logged,
}: {
  rec: UncertainRecommendation;
  rank: number;
  catA: SpendCategory;
  catB: SpendCategory;
  amount: number;
  onUse: () => void;
  logged: boolean;
}) {
  const best = rank === 0;
  const worstMpd = amount > 0 ? rec.worstMiles / amount : 0;
  return (
    <div
      className={`bg-surface rounded-2xl border overflow-hidden ${
        best ? 'border-primary shadow-md' : 'border-outline shadow-sm'
      }`}
    >
      {best && (
        <div className="bg-primary text-on-primary text-[10px] font-bold tracking-widest uppercase px-4 py-1">
          Safest card for this swipe
        </div>
      )}
      <div className="flex items-center gap-3 px-4 py-3">
        <CardThumb card={rec.card} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-on-surface truncate">{rec.card.cardName}</p>
            {rec.sameEitherWay && (
              <span className="flex-shrink-0 text-[9px] font-bold text-green-300 bg-green-950 border border-green-800 rounded-full px-1.5 py-0.5">
                Safe either way
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {categoryMeta(catA).label}: {rec.scenarioA.effectiveMpd.toFixed(1)} mpd ·{' '}
            {categoryMeta(catB).label}: {rec.scenarioB.effectiveMpd.toFixed(1)} mpd
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-on-surface">
            {worstMpd.toFixed(2)}
            <span className="text-[10px] font-semibold text-on-surface-variant"> mpd min</span>
          </p>
          {amount > 0 && (
            <p className="text-[11px] text-muted">
              ≥ {Math.round(rec.worstMiles).toLocaleString()} miles
            </p>
          )}
          {amount > 0 && (
            <button
              onClick={onUse}
              disabled={logged}
              className={`mt-1.5 text-[11px] font-bold rounded-full px-3 py-1 transition-colors ${
                logged
                  ? 'bg-green-950 text-green-300 border border-green-800'
                  : 'bg-primary text-on-primary hover:bg-primary-hover'
              }`}
            >
              {logged ? '✓ Logged' : 'I used this'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function RecommendPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [entries, setEntries] = useState<SpendEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ statementDays: {} });
  const [text, setText] = useState('');
  const [chosenCategory, setChosenCategory] = useState<SpendCategory | null>(null);
  const [notSure, setNotSure] = useState(false);
  const [dualCats, setDualCats] = useState<SpendCategory[]>(['dining', 'travel']);
  const [loggedCardId, setLoggedCardId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    if (!p?.setupComplete) {
      router.replace('/onboarding/income');
      return;
    }
    setMyCards(p.selectedCardIds.map(id => getCard(id)).filter((c): c is Card => !!c));
    setEntries(loadSpend());
    setSettings(loadSettings());
  }, [router]);

  const parsed: ParseResult | null = useMemo(
    () => (text.trim() ? parseTransaction(text, myCards) : null),
    [text, myCards],
  );

  const amount = parsed?.amountSgd ?? 0;
  const category: SpendCategory = chosenCategory ?? parsed?.category ?? 'general';
  const categoryKnown = !!(chosenCategory ?? parsed?.category);

  const recs = useMemo(
    () =>
      myCards.length && !notSure
        ? recommendCards(myCards, category, amount || 100, entries, settings)
        : [],
    [myCards, category, amount, entries, settings, notSure],
  );

  const uncertainRecs = useMemo(
    () =>
      myCards.length && notSure && dualCats.length === 2
        ? recommendCardsUncertain(myCards, dualCats[0], dualCats[1], amount || 100, entries, settings)
        : [],
    [myCards, notSure, dualCats, amount, entries, settings],
  );

  function toggleDualCat(cat: SpendCategory) {
    setDualCats(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev.slice(-1), cat], // keep last picked + new one
    );
  }

  function logUse(cardId: string, logCategory: SpendCategory) {
    if (amount <= 0) return;
    // Learn: user explicitly picked a category for an unknown merchant
    if (chosenCategory && parsed?.leftoverText) {
      learnMerchant(parsed.leftoverText, chosenCategory);
    }
    setEntries(
      addSpend({
        cardId,
        category: logCategory,
        amountSgd: amount,
        dateISO: new Date().toISOString(),
        source: 'recommender',
        note: parsed?.merchant ?? undefined,
      }),
    );
    setLoggedCardId(cardId);
    setTimeout(() => {
      setLoggedCardId(null);
      setText('');
      setChosenCategory(null);
      setNotSure(false);
    }, 1800);
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-outline-bright border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const catMeta = categoryMeta(category);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-surface border-b border-outline px-4 pb-4 header-safe">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-on-surface">Which card do I swipe?</h1>
          <p className="text-xs text-on-surface-variant">
            Type it, pick the best card, and it&apos;s logged — one motion
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {myCards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-sm text-muted mb-4">Add cards to your wallet first.</p>
            <button
              onClick={() => router.push('/onboarding/cards')}
              className="px-6 py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm"
            >
              Add cards
            </button>
          </div>
        ) : (
          <>
            {/* Smart input */}
            <div className="bg-surface rounded-2xl shadow-sm border border-outline p-4 mb-4">
              <input
                type="text"
                placeholder='Try "$85 din tai fung" or "120 hotel restaurant"'
                value={text}
                onChange={e => {
                  setText(e.target.value);
                  setChosenCategory(null);
                }}
                className="w-full text-base font-medium text-on-surface placeholder:text-muted placeholder:text-sm outline-none"
              />

              {parsed && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span
                    className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${
                      amount > 0 ? 'bg-primary text-on-primary' : 'bg-amber-950 text-amber-300 border border-amber-900'
                    }`}
                  >
                    {amount > 0 ? `S$${amount.toLocaleString()}` : 'Amount? (needed to log)'}
                  </span>
                  {parsed.merchant && (
                    <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 bg-surface-high text-on-surface">
                      {catMeta.icon} {parsed.merchant}
                    </span>
                  )}
                  {!notSure && (
                    <span
                      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${
                        categoryKnown
                          ? 'bg-teal-950 text-teal-200 border border-teal-900'
                          : 'bg-amber-950 text-amber-300 border border-amber-900'
                      }`}
                    >
                      {categoryKnown ? `→ ${catMeta.label}` : 'Category? Pick below or 🤷'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Category chips + Not sure */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4">
              <button
                onClick={() => setNotSure(s => !s)}
                className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1.5 transition-colors ${
                  notSure ? 'bg-primary text-on-primary' : 'bg-surface-high text-on-surface-variant hover:bg-surface-bright'
                }`}
              >
                <span>🤷</span>
                <span>Not sure</span>
              </button>
              {CATEGORIES.map(cat => {
                const active = notSure ? dualCats.includes(cat.value) : !notSure && category === cat.value && categoryKnown;
                return (
                  <button
                    key={cat.value}
                    onClick={() => {
                      if (notSure) toggleDualCat(cat.value);
                      else setChosenCategory(cat.value);
                    }}
                    className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1.5 transition-colors ${
                      active ? 'bg-primary text-on-primary' : 'bg-surface-high text-on-surface-variant hover:bg-surface-bright'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted mb-4">
              {notSure
                ? `Pick the two ways it might code (now: ${dualCats.map(c => categoryMeta(c).label).join(' vs ')}). Ranked by guaranteed miles — e.g. a hotel restaurant can code as either.`
                : categoryKnown
                  ? catMeta.hint
                  : 'Unknown merchant — pick a category, or tap 🤷 Not sure if it could code two ways.'}
            </p>

            {/* Results */}
            <div className="space-y-3">
              {notSure
                ? uncertainRecs.map((rec, i) => (
                    <UncertainRow
                      key={rec.card.id}
                      rec={rec}
                      rank={i}
                      catA={dualCats[0]}
                      catB={dualCats[1]}
                      amount={amount}
                      logged={loggedCardId === rec.card.id}
                      onUse={() =>
                        logUse(
                          rec.card.id,
                          // log conservatively under the worse-paying scenario
                          rec.scenarioA.milesEarned <= rec.scenarioB.milesEarned ? dualCats[0] : dualCats[1],
                        )
                      }
                    />
                  ))
                : recs.map((rec, i) => (
                    <RecRow
                      key={rec.card.id}
                      rec={rec}
                      rank={i}
                      amount={amount}
                      logged={loggedCardId === rec.card.id}
                      onUse={() => logUse(rec.card.id, category)}
                    />
                  ))}
            </div>

            {amount === 0 && (
              <p className="text-[11px] text-muted text-center mt-3">
                Ranked assuming a $100 swipe. Include the amount (e.g. &ldquo;$85 din tai fung&rdquo;) to get exact
                miles and one-tap logging.
              </p>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
