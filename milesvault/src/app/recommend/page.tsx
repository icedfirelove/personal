'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCard, type Card } from '@/data/cards';
import { loadProfile } from '@/lib/storage';
import { CATEGORIES, categoryMeta, type SpendCategory } from '@/lib/categories';
import {
  loadSpend,
  addSpend,
  deleteSpend,
  loadSettings,
  recommendCards,
  type SpendEntry,
  type UserSettings,
  type Recommendation,
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

// ─── Recommendation row ───────────────────────────────────────

function RecRow({
  rec,
  rank,
  amount,
  onLog,
  logged,
}: {
  rec: Recommendation;
  rank: number;
  amount: number;
  onLog: () => void;
  logged: boolean;
}) {
  const best = rank === 0;
  return (
    <div
      className={`bg-gray-900 rounded-2xl border overflow-hidden ${
        best ? 'border-gray-300 shadow-md' : 'border-gray-800 shadow-sm'
      }`}
    >
      {best && (
        <div className="bg-gray-100 text-gray-900 text-[10px] font-bold tracking-widest uppercase px-4 py-1">
          Best card for this swipe
        </div>
      )}
      <div className="flex items-center gap-3 px-4 py-3">
        <CardThumb card={rec.card} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-100 truncate">{rec.card.cardName}</p>
          <p className="text-[11px] text-gray-400 truncate">
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
          <p className="text-base font-bold text-gray-100">
            {rec.effectiveMpd.toFixed(2)}
            <span className="text-[10px] font-semibold text-gray-400"> mpd</span>
          </p>
          {amount > 0 && (
            <p className="text-[11px] text-gray-500">≈ {Math.round(rec.milesEarned).toLocaleString()} miles</p>
          )}
          {amount > 0 && (
            <button
              onClick={onLog}
              disabled={logged}
              className={`mt-1.5 text-[11px] font-bold rounded-full px-3 py-1 transition-colors ${
                logged
                  ? 'bg-green-950 text-green-300 border border-green-800'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {logged ? '✓ Logged' : 'Log swipe'}
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
  const [category, setCategory] = useState<SpendCategory>('online');
  const [amountStr, setAmountStr] = useState('');
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

  const amount = parseFloat(amountStr) || 0;

  const recs = useMemo(
    () => (myCards.length ? recommendCards(myCards, category, amount || 100, entries, settings) : []),
    [myCards, category, amount, entries, settings],
  );

  const recent = useMemo(
    () => [...entries].sort((a, b) => b.dateISO.localeCompare(a.dateISO)).slice(0, 8),
    [entries],
  );

  function handleLog(cardId: string) {
    if (amount <= 0) return;
    setEntries(
      addSpend({
        cardId,
        category,
        amountSgd: amount,
        dateISO: new Date().toISOString(),
        source: 'recommender',
      }),
    );
    setLoggedCardId(cardId);
    setTimeout(() => setLoggedCardId(null), 2500);
  }

  function handleDelete(id: string) {
    setEntries(deleteSpend(id));
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-100 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 px-4 pb-4 header-safe">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-gray-100">Which card do I swipe?</h1>
          <p className="text-xs text-gray-400">Cap-aware ranking across your {myCards.length} cards</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Category picker */}
        <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
          What are you paying for?
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1.5 transition-colors ${
                category === cat.value
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mb-4">{categoryMeta(category).hint}</p>

        {/* Amount */}
        <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 px-4 py-3 flex items-center gap-3 mb-5">
          <span className="text-sm font-bold text-gray-400">S$</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="Amount (optional — affects cap math)"
            value={amountStr}
            onChange={e => setAmountStr(e.target.value)}
            className="flex-1 text-base font-semibold text-gray-100 placeholder:text-gray-600 placeholder:text-sm placeholder:font-normal outline-none"
          />
          {amountStr && (
            <button onClick={() => setAmountStr('')} className="text-xs text-gray-400 hover:text-gray-300">
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        {myCards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-sm text-gray-500 mb-4">Add cards to your wallet first.</p>
            <button
              onClick={() => router.push('/onboarding/cards')}
              className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-900 font-semibold text-sm"
            >
              Add cards
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recs.map((rec, i) => (
              <RecRow
                key={rec.card.id}
                rec={rec}
                rank={i}
                amount={amount}
                onLog={() => handleLog(rec.card.id)}
                logged={loggedCardId === rec.card.id}
              />
            ))}
            {amount === 0 && (
              <p className="text-[11px] text-gray-400 text-center">
                Ranked assuming a $100 swipe. Enter the actual amount for exact cap-aware miles, then log it.
              </p>
            )}
          </div>
        )}

        {/* Recent activity */}
        {recent.length > 0 && (
          <div className="mt-8">
            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
              Recent logged spend
            </p>
            <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 divide-y divide-gray-800">
              {recent.map(e => {
                const card = getCard(e.cardId);
                const meta = categoryMeta(e.category);
                return (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-base">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-100 truncate">
                        ${e.amountSgd.toLocaleString()} · {card?.cardName ?? e.cardId}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {meta.label} · {new Date(e.dateISO).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-[10px] text-gray-600 hover:text-red-500 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
