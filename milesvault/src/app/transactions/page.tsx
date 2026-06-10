'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCard, type Card } from '@/data/cards';
import { loadProfile } from '@/lib/storage';
import { categoryMeta, CATEGORIES, type SpendCategory } from '@/lib/categories';
import { parseTransaction, learnMerchant, type ParseResult } from '@/lib/parser';
import { loadSpend, addSpend, deleteSpend, type SpendEntry } from '@/lib/spend';
import BottomNav from '@/components/BottomNav';

// ─── Smart input ──────────────────────────────────────────────

function SmartInput({
  myCards,
  todayISO,
  onAdd,
}: {
  myCards: Card[];
  todayISO: string;
  onAdd: (e: Omit<SpendEntry, 'id'>) => void;
}) {
  const [text, setText] = useState('');
  const [chosenCardId, setChosenCardId] = useState<string | null>(null);
  const [chosenCategory, setChosenCategory] = useState<SpendCategory | null>(null);

  const parsed: ParseResult | null = useMemo(
    () => (text.trim() ? parseTransaction(text, myCards) : null),
    [text, myCards],
  );

  // Resolve card: parser hit → that; ambiguity + user pick → pick
  const resolvedCard =
    parsed?.card ??
    (chosenCardId ? myCards.find(c => c.id === chosenCardId) ?? null : null);
  const resolvedCategory: SpendCategory = chosenCategory ?? parsed?.category ?? 'general';
  const ambiguous = parsed && !parsed.card && parsed.cardCandidates.length > 1;
  const noCardSignal = parsed && !parsed.card && parsed.cardCandidates.length === 0;
  const canAdd = !!parsed?.amountSgd && !!resolvedCard;

  function handleAdd() {
    if (!parsed?.amountSgd || !resolvedCard) return;
    // Learn from corrections: user explicitly set a category for an
    // unrecognised merchant → remember it for next time.
    if (chosenCategory && parsed.leftoverText) {
      learnMerchant(parsed.leftoverText, chosenCategory);
    }
    onAdd({
      cardId: resolvedCard.id,
      category: resolvedCategory,
      amountSgd: parsed.amountSgd,
      dateISO: parsed.dateISO,
      source: 'manual',
      note: parsed.merchant ?? undefined,
    });
    setText('');
    setChosenCardId(null);
    setChosenCategory(null);
  }

  const catMeta = categoryMeta(resolvedCategory);

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-outline p-4">
      <input
        type="text"
        placeholder='Try "$300 shopee ocbc" or "45 dinner uob yesterday"'
        value={text}
        onChange={e => {
          setText(e.target.value);
          setChosenCardId(null);
          setChosenCategory(null);
        }}
        onKeyDown={e => e.key === 'Enter' && canAdd && handleAdd()}
        className="w-full text-base font-medium text-on-surface placeholder:text-muted placeholder:text-sm outline-none"
      />

      {parsed && (
        <div className="mt-3 space-y-2.5">
          {/* Parse preview chips */}
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${
                parsed.amountSgd ? 'bg-primary text-on-primary' : 'bg-red-950 text-red-400 border border-red-900'
              }`}
            >
              {parsed.amountSgd ? `S$${parsed.amountSgd.toLocaleString()}` : 'Amount?'}
            </span>
            <span
              className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${
                resolvedCard ? 'bg-teal-950 text-teal-200 border border-teal-900' : 'bg-amber-950 text-amber-300 border border-amber-900'
              }`}
            >
              {resolvedCard ? `💳 ${resolvedCard.cardName}` : ambiguous ? 'Which card?' : 'Card?'}
            </span>
            <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 bg-surface-high text-on-surface">
              {catMeta.icon} {parsed.merchant ? `${parsed.merchant} · ` : ''}{catMeta.label}
            </span>
            {parsed.dateISO.slice(0, 10) !== todayISO && (
              <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 bg-surface-high text-on-surface">
                🗓 Yesterday
              </span>
            )}
          </div>

          {/* Card disambiguation */}
          {(ambiguous || noCardSignal) && !resolvedCard && (
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                {ambiguous ? 'Multiple matches — pick one' : 'Pick the card'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(ambiguous ? parsed.cardCandidates : myCards).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setChosenCardId(c.id)}
                    className="text-[11px] font-semibold rounded-full px-3 py-1.5 bg-surface-high text-on-surface hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    {c.cardName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category correction */}
          <details className="group">
            <summary className="text-[10px] font-semibold text-on-surface-variant cursor-pointer list-none hover:text-on-surface">
              Wrong category? Tap to change ▾
            </summary>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setChosenCategory(cat.value)}
                  className={`text-[11px] font-semibold rounded-full px-2.5 py-1 transition-colors ${
                    resolvedCategory === cat.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-high text-on-surface-variant hover:bg-surface-bright'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            {chosenCategory && parsed.leftoverText && (
              <p className="text-[10px] text-teal-400 font-medium mt-1.5">
                ✓ I&apos;ll remember &ldquo;{parsed.leftoverText}&rdquo; = {categoryMeta(chosenCategory).label} next time
              </p>
            )}
          </details>

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="w-full py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm disabled:opacity-30 hover:bg-primary-hover transition-colors"
          >
            {canAdd
              ? `Log S$${parsed.amountSgd!.toLocaleString()} on ${resolvedCard!.cardName}`
              : !parsed.amountSgd
                ? 'Enter an amount'
                : 'Pick a card'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function TransactionsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [entries, setEntries] = useState<SpendEntry[]>([]);
  const [todayISO, setTodayISO] = useState('');
  const [yesterdayISO, setYesterdayISO] = useState('');

  useEffect(() => {
    setMounted(true);
    setTodayISO(new Date().toISOString().slice(0, 10));
    setYesterdayISO(new Date(Date.now() - 86_400_000).toISOString().slice(0, 10));
    const p = loadProfile();
    if (!p?.setupComplete) {
      router.replace('/onboarding/income');
      return;
    }
    setMyCards(p.selectedCardIds.map(id => getCard(id)).filter((c): c is Card => !!c && !c.isAmazePairingCard));
    setEntries(loadSpend());
  }, [router]);

  const grouped = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
    const groups: { date: string; items: SpendEntry[] }[] = [];
    for (const e of sorted) {
      const day = e.dateISO.slice(0, 10);
      const last = groups[groups.length - 1];
      if (last && last.date === day) last.items.push(e);
      else groups.push({ date: day, items: [e] });
    }
    return groups;
  }, [entries]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-outline-bright border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const fmtDay = (day: string) => {
    if (day === todayISO) return 'Today';
    if (day === yesterdayISO) return 'Yesterday';
    return new Date(day).toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-surface border-b border-outline px-4 pb-4 header-safe">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-on-surface">Transactions</h1>
          <p className="text-xs text-on-surface-variant">Type it like you&apos;d say it — amount, merchant, card</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <SmartInput myCards={myCards} todayISO={todayISO} onAdd={e => setEntries(addSpend(e))} />

        {/* Transaction list */}
        {grouped.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-16">
            No transactions yet. Log your first one above.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {grouped.map(g => (
              <div key={g.date}>
                <p className="text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">
                  {fmtDay(g.date)}
                </p>
                <div className="bg-surface rounded-2xl shadow-sm border border-outline divide-y divide-outline">
                  {g.items.map(e => {
                    const card = getCard(e.cardId);
                    const meta = categoryMeta(e.category);
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-lg">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {e.note ?? meta.label}
                          </p>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            {card?.cardName ?? e.cardId} · {meta.label}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-on-surface">
                            ${e.amountSgd.toLocaleString()}
                          </p>
                          <button
                            onClick={() => setEntries(deleteSpend(e.id))}
                            className="text-[10px] text-muted hover:text-red-500 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
