'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CARDS, getCard, type Card } from '@/data/cards';
import { type SeededPromo } from '@/data/promos';
import { recommendPromos, splitByEligibility } from '@/lib/promoRecs';
import { getPromoFeed, refreshPromoFeed, timeAgo, type PromoFeed } from '@/lib/remotePromos';
import PullToRefresh from '@/components/PullToRefresh';
import { loadProfile } from '@/lib/storage';
import {
  loadSpend,
  loadPromos,
  addPromo,
  deletePromo,
  promoProgress,
  addSpend,
  type SpendEntry,
  type ActivePromo,
} from '@/lib/spend';
import BottomNav from '@/components/BottomNav';
import PageSkeleton from '@/components/PageSkeleton';
import CardThumb from '@/components/CardThumb';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Tier badges ──────────────────────────────────────────────

function tierBadges(seed: SeededPromo): { icon: string; label: string; cls: string }[] {
  const badges: { icon: string; label: string; cls: string }[] = [];
  const costPerMile = seed.annualFeeSgd > 0 ? (seed.annualFeeSgd / seed.bonusMiles) * 100 : 0;

  if (seed.annualFeeSgd === 0) {
    badges.push({ icon: '💎', label: 'Free miles', cls: 'text-teal-200 bg-teal-950 border-teal-900' });
  } else if (costPerMile > 0 && costPerMile < 0.7) {
    badges.push({ icon: '🔥', label: 'Best value', cls: 'text-amber-200 bg-amber-950 border-amber-900' });
  }
  if (seed.minSpendSgd >= 4000) {
    badges.push({ icon: '🐳', label: 'Big spender', cls: 'text-blue-200 bg-blue-950 border-blue-900' });
  }
  return badges.slice(0, 2);
}

// ─── Active promo card ────────────────────────────────────────

function PromoCard({
  promo,
  entries,
  onDelete,
  onLogSpend,
}: {
  promo: ActivePromo;
  entries: SpendEntry[];
  onDelete: () => void;
  onLogSpend: (amount: number) => void;
}) {
  const [logStr, setLogStr] = useState('');
  const p = promoProgress(promo, entries);
  const card = getCard(promo.cardId);
  const expired = p.daysLeft < 0;

  const barColor = p.done
    ? 'bg-green-500'
    : expired
      ? 'bg-gray-300'
      : p.daysLeft <= 7
        ? 'bg-red-500'
        : 'bg-primary';

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-outline px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        {card && <CardThumb card={card} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-on-surface">{promo.title}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{card?.cardName ?? promo.cardId}</p>
        </div>
        <button onClick={onDelete} className="text-[10px] text-muted hover:text-red-500 font-semibold flex-shrink-0">
          Remove
        </button>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs font-semibold text-on-surface">
            ${p.spentSgd.toLocaleString()} <span className="text-on-surface-variant font-normal">of ${promo.targetSgd.toLocaleString()}</span>
          </span>
          <span
            className={`text-[11px] font-bold ${
              p.done ? 'text-green-400' : expired ? 'text-on-surface-variant' : p.daysLeft <= 7 ? 'text-red-400' : 'text-muted'
            }`}
          >
            {p.done
              ? '✓ Min spend met'
              : expired
                ? 'Deadline passed'
                : `${p.daysLeft} day${p.daysLeft === 1 ? '' : 's'} left`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface-high overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${p.pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-on-surface-variant">
            Deadline {fmtDate(promo.deadlineISO)} · {promo.rewardMiles.toLocaleString()} miles
          </p>
          {!p.done && !expired && (
            <p className="text-[11px] font-semibold text-amber-400">${p.remainingSgd.toLocaleString()} to go</p>
          )}
        </div>
      </div>

      {/* Quick log */}
      {!p.done && !expired && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 bg-background rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-on-surface-variant">S$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="Log spend on this card"
              value={logStr}
              onChange={e => setLogStr(e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold text-on-surface placeholder:text-muted placeholder:font-normal placeholder:text-xs outline-none"
            />
          </div>
          <button
            onClick={() => {
              const amt = parseFloat(logStr);
              if (amt > 0) {
                onLogSpend(amt);
                setLogStr('');
              }
            }}
            className="text-xs font-bold bg-primary text-on-primary rounded-xl px-4 py-2.5 hover:bg-primary-hover transition-colors"
          >
            Log
          </button>
        </div>
      )}

      {promo.notes && <p className="text-[11px] text-on-surface-variant mt-3 leading-relaxed">{promo.notes}</p>}
    </div>
  );
}

// ─── Seeded offer row ─────────────────────────────────────────

function SeededRow({
  seed,
  owned,
  reason,
  onStart,
}: {
  seed: SeededPromo;
  owned: boolean;
  reason?: string;
  onStart: (approvalISO: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [approvalISO, setApprovalISO] = useState(new Date().toISOString().slice(0, 10));
  const card = getCard(seed.cardId);
  const applyByPassed = new Date(seed.applyByISO) < new Date(new Date().toDateString());
  const costPerMile = seed.annualFeeSgd > 0 ? (seed.annualFeeSgd / seed.bonusMiles) * 100 : 0;
  const badges = tierBadges(seed);

  return (
    <div
      className={`bg-surface rounded-2xl shadow-sm border overflow-hidden ${
        reason ? 'border-primary/40' : 'border-outline'
      }`}
    >
      <button className="w-full px-4 py-3 text-left hover:bg-surface-high transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3">
          {card && <CardThumb card={card} />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{card?.cardName ?? seed.cardId}</p>
            <p className="text-xs text-on-surface-variant truncate">
              ${seed.minSpendSgd.toLocaleString()} spend → {seed.bonusMiles.toLocaleString()} miles
              {seed.annualFeeSgd > 0 ? ` · $${seed.annualFeeSgd.toFixed(0)} fee` : ''}
            </p>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {badges.map(b => (
                  <span
                    key={b.label}
                    className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${b.cls}`}
                  >
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-xs font-bold ${applyByPassed ? 'text-red-500' : 'text-on-surface'}`}>
              {applyByPassed ? 'Ended' : `Apply by ${fmtDate(seed.applyByISO)}`}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {costPerMile > 0 ? `${costPerMile.toFixed(2)}¢/mile` : 'Free miles'}
              {owned && ' · in wallet'}
            </p>
          </div>
        </div>
        {reason && (
          <p className="text-[11px] text-primary/90 leading-relaxed mt-2">✨ {reason}</p>
        )}
      </button>

      {expanded && (
        <div className="border-t border-outline bg-background px-4 py-3 space-y-3">
          {seed.notes && <p className="text-[11px] text-muted leading-relaxed">{seed.notes}</p>}
          <p className="text-[11px] text-muted">
            Min spend window: <strong>{seed.spendWindowDays} days from card approval</strong>
            {seed.eligibility === 'NTB' && ' · New-to-bank customers only'}
            {seed.eligibility === 'ETB' && ' · Existing customers'}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
                Card approval date
              </label>
              <input
                type="date"
                value={approvalISO}
                onChange={e => setApprovalISO(e.target.value)}
                className="w-full bg-surface border border-outline-bright rounded-xl px-3 py-2 text-sm text-on-surface outline-none"
              />
            </div>
            <button
              onClick={() => onStart(approvalISO)}
              className="self-end text-xs font-bold bg-primary text-on-primary rounded-xl px-4 py-2.5 hover:bg-primary-hover transition-colors"
            >
              Track this
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom promo form ────────────────────────────────────────

function CustomPromoForm({ onAdd }: { onAdd: (p: Omit<ActivePromo, 'id'>) => void }) {
  const [cardId, setCardId] = useState(CARDS[0].id);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [reward, setReward] = useState('');
  const [deadline, setDeadline] = useState('');

  const valid = title.trim() && parseFloat(target) > 0 && parseFloat(reward) > 0 && deadline;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-outline px-4 py-4 space-y-3">
      <select
        value={cardId}
        onChange={e => setCardId(e.target.value)}
        className="w-full bg-background border border-outline-bright rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none"
      >
        {CARDS.filter(c => !c.isAmazePairingCard).map(c => (
          <option key={c.id} value={c.id}>{c.cardName}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Promo name, e.g. 30k miles welcome offer"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full bg-background border border-outline-bright rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-muted outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number" inputMode="decimal" min="0"
          placeholder="Min spend S$"
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="bg-background border border-outline-bright rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-muted outline-none"
        />
        <input
          type="number" inputMode="numeric" min="0"
          placeholder="Reward miles"
          value={reward}
          onChange={e => setReward(e.target.value)}
          className="bg-background border border-outline-bright rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-muted outline-none"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
          Spend deadline
        </label>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full bg-background border border-outline-bright rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none"
        />
      </div>
      <button
        disabled={!valid}
        onClick={() =>
          onAdd({
            cardId,
            title: title.trim(),
            targetSgd: parseFloat(target),
            rewardMiles: parseFloat(reward),
            startISO: new Date().toISOString().slice(0, 10),
            deadlineISO: deadline,
          })
        }
        className="w-full py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm disabled:opacity-30 hover:bg-primary-hover transition-colors"
      >
        Track promo
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function PromosPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [myCardIds, setMyCardIds] = useState<string[]>([]);
  const [incomeBracket, setIncomeBracket] = useState('below-30k');
  const [entries, setEntries] = useState<SpendEntry[]>([]);
  const [promos, setPromos] = useState<ActivePromo[]>([]);
  const [tab, setTab] = useState<'offers' | 'custom'>('offers');
  const [feed, setFeed] = useState<PromoFeed>({ promos: [], lastVerified: null, fetchedAt: null });
  const [refreshError, setRefreshError] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    if (!p?.setupComplete) {
      router.replace('/onboarding/income');
      return;
    }
    setMyCardIds(p.selectedCardIds);
    setIncomeBracket(p.incomeBracket);
    setEntries(loadSpend());
    setPromos(loadPromos());
    setFeed(getPromoFeed());
  }, [router]);

  async function handleRefresh() {
    setRefreshError(false);
    try {
      const fresh = await refreshPromoFeed();
      setFeed(fresh);
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2500);
    } catch {
      setRefreshError(true);
      setTimeout(() => setRefreshError(false), 4000);
    }
  }

  if (!mounted) {
    return <PageSkeleton />;
  }

  const trackedSeedIds = new Set(promos.map(p => p.seedId).filter(Boolean));
  const availableSeeds = feed.promos.filter(s => !trackedSeedIds.has(s.seedId));

  // Personalised picks: wallet (NTB eligibility), income, tracked spend pace
  const myCards = myCardIds.map(id => getCard(id)).filter((c): c is Card => !!c);
  const recommended = recommendPromos(availableSeeds, myCards, incomeBracket, entries);
  const recommendedIds = new Set(recommended.map(r => r.seed.seedId));
  const { eligible, ineligible } = splitByEligibility(availableSeeds, myCards, incomeBracket);
  const otherSeeds = eligible.filter(s => !recommendedIds.has(s.seedId));

  function startSeeded(seed: SeededPromo, approvalISO: string) {
    const deadline = new Date(approvalISO);
    deadline.setDate(deadline.getDate() + seed.spendWindowDays);
    setPromos(
      addPromo({
        seedId: seed.seedId,
        cardId: seed.cardId,
        title: seed.title,
        targetSgd: seed.minSpendSgd,
        rewardMiles: seed.bonusMiles,
        startISO: approvalISO,
        deadlineISO: deadline.toISOString().slice(0, 10),
        notes: seed.notes,
      }),
    );
  }

  function logSpendFor(promo: ActivePromo, amount: number) {
    setEntries(
      addSpend({
        cardId: promo.cardId,
        category: 'general',
        amountSgd: amount,
        dateISO: new Date().toISOString(),
        source: 'manual',
        note: `Promo: ${promo.title}`,
      }),
    );
  }

  return (
    <div className="min-h-screen bg-background page-bottom">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-surface border-b border-outline px-4 pb-4 header-safe">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-on-surface">Sign-up bonus tracker</h1>
            <p className="text-xs text-on-surface-variant truncate">Never miss a min-spend deadline</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex-shrink-0 text-right group"
            title="Check for new promos"
          >
            <p className="text-[11px] font-semibold text-primary group-hover:underline">↻ Refresh</p>
            <p className="text-[10px] text-muted">
              {justRefreshed
                ? '✓ Up to date'
                : refreshError
                  ? 'Offline — using saved'
                  : feed.fetchedAt
                    ? `Updated ${timeAgo(feed.fetchedAt)}`
                    : 'Bundled data'}
            </p>
          </button>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Active promos */}
        {promos.length > 0 && (
          <div className="mb-7">
            <p className="text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">
              Your tracked promos
            </p>
            <div className="space-y-3">
              {promos.map(promo => (
                <PromoCard
                  key={promo.id}
                  promo={promo}
                  entries={entries}
                  onDelete={() => setPromos(deletePromo(promo.id))}
                  onLogSpend={amt => logSpendFor(promo, amt)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add new */}
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-bold tracking-widest text-on-surface-variant uppercase flex-1">
            Add a promo
          </p>
          <div className="flex bg-surface-high rounded-full p-0.5">
            {(['offers', 'custom'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-[11px] font-semibold rounded-full px-3 py-1 transition-colors ${
                  tab === t ? 'bg-primary text-on-primary shadow-sm' : 'text-muted'
                }`}
              >
                {t === 'offers' ? 'Current offers' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'offers' ? (
          <>
            {/* Recommended for you */}
            {recommended.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-bold tracking-widest text-primary uppercase mb-2">
                  ✨ Recommended for you
                </p>
                <div className="space-y-2.5">
                  {recommended.map(rec => (
                    <SeededRow
                      key={rec.seed.seedId}
                      seed={rec.seed}
                      owned={myCardIds.includes(rec.seed.cardId)}
                      reason={rec.reason}
                      onStart={iso => startSeeded(rec.seed, iso)}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted mt-2 leading-relaxed">
                  Based on your wallet (new-to-bank eligibility), income bracket, and tracked spending pace.
                </p>
              </div>
            )}

            <p className="text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">
              All current offers
            </p>
            <p className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
              Verified against MileLion{feed.lastVerified ? ` as of ${fmtDate(feed.lastVerified)}` : ''}. Offers vary
              by channel (direct vs SingSaver) and change monthly — confirm the live T&amp;Cs before applying.
              Pull down to check for updates.
            </p>
            <div className="space-y-2.5">
              {otherSeeds.map(seed => (
                <SeededRow
                  key={seed.seedId}
                  seed={seed}
                  owned={myCardIds.includes(seed.cardId)}
                  onStart={iso => startSeeded(seed, iso)}
                />
              ))}
              {availableSeeds.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-8">All current offers are already tracked.</p>
              )}
            </div>

            {/* Not eligible — but shareable */}
            {ineligible.length > 0 && (
              <details className="mt-6 group">
                <summary className="cursor-pointer list-none select-none flex items-center gap-2">
                  <p className="text-[11px] font-bold tracking-widest text-on-surface-variant uppercase">
                    🙅 Not for you · tell a friend ({ineligible.length})
                  </p>
                  <span className="text-[10px] text-muted group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[11px] text-muted mt-2 mb-3 leading-relaxed">
                  Offers you can&apos;t apply for — worth passing on to someone who can.
                </p>
                <div className="space-y-2.5">
                  {ineligible.map(({ seed, why }) => (
                    <div key={seed.seedId} className="opacity-75">
                      <SeededRow
                        seed={seed}
                        owned={myCardIds.includes(seed.cardId)}
                        reason={undefined}
                        onStart={iso => startSeeded(seed, iso)}
                      />
                      <p className="text-[10px] text-amber-400/90 mt-1 px-1">🙅 {why}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        ) : (
          <CustomPromoForm
            onAdd={p => {
              setPromos(addPromo(p));
              setTab('offers');
            }}
          />
        )}
      </div>
      </PullToRefresh>

      <BottomNav />
    </div>
  );
}
