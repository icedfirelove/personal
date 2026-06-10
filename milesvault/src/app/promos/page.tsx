'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CARDS, getCard } from '@/data/cards';
import { SEEDED_PROMOS, type SeededPromo } from '@/data/promos';
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

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });

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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
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

function SeededRow({ seed, owned, onStart }: { seed: SeededPromo; owned: boolean; onStart: (approvalISO: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [approvalISO, setApprovalISO] = useState(new Date().toISOString().slice(0, 10));
  const card = getCard(seed.cardId);
  const applyByPassed = new Date(seed.applyByISO) < new Date(new Date().toDateString());
  const costPerMile = seed.annualFeeSgd > 0 ? (seed.annualFeeSgd / seed.bonusMiles) * 100 : 0;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-outline overflow-hidden">
      <button className="w-full px-4 py-3 text-left hover:bg-surface-high transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{card?.cardName ?? seed.cardId}</p>
            <p className="text-xs text-on-surface-variant truncate">
              ${seed.minSpendSgd.toLocaleString()} spend → {seed.bonusMiles.toLocaleString()} miles
              {seed.annualFeeSgd > 0 ? ` · $${seed.annualFeeSgd.toFixed(0)} fee` : ' · no fee'}
            </p>
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
  const [entries, setEntries] = useState<SpendEntry[]>([]);
  const [promos, setPromos] = useState<ActivePromo[]>([]);
  const [tab, setTab] = useState<'offers' | 'custom'>('offers');

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    if (!p?.setupComplete) {
      router.replace('/onboarding/income');
      return;
    }
    setMyCardIds(p.selectedCardIds);
    setEntries(loadSpend());
    setPromos(loadPromos());
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-outline-bright border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const trackedSeedIds = new Set(promos.map(p => p.seedId).filter(Boolean));
  const availableSeeds = SEEDED_PROMOS.filter(s => !trackedSeedIds.has(s.seedId));

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
    <div className="min-h-screen bg-background pb-20">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-surface border-b border-outline px-4 pb-4 header-safe">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-on-surface">Sign-up bonus tracker</h1>
          <p className="text-xs text-on-surface-variant">Never miss a min-spend deadline — the cheapest miles you&apos;ll ever earn</p>
        </div>
      </div>

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
            <p className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">
              Verified against MileLion&apos;s June 2026 roundup. Offers vary by channel (direct vs SingSaver) and
              change monthly — confirm the live T&amp;Cs before applying. Tap an offer to start tracking after approval.
            </p>
            <div className="space-y-2.5">
              {availableSeeds.map(seed => (
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

      <BottomNav />
    </div>
  );
}
