'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCard, type Card } from '@/data/cards';
import { loadProfile, bracketLabel, type UserProfile } from '@/lib/storage';
import {
  HEYMAX_CATEGORIES,
  HEYMAX_INFO,
  getMerchantsByCategory,
  getMcc5311Merchants,
  type HeyMaxCategory,
} from '@/data/heymax';
import {
  loadSpend,
  loadSettings,
  setStatementDay,
  getCapGroups,
  daysUntilReset,
  usesStatementCycle,
  type SpendEntry,
  type UserSettings,
} from '@/lib/spend';
import BottomNav from '@/components/BottomNav';

// ─── Cap Meter ────────────────────────────────────────────────

function CapMeters({
  card,
  entries,
  settings,
  onStatementDayChange,
}: {
  card: Card;
  entries: SpendEntry[];
  settings: UserSettings;
  onStatementDayChange: (day: number | null) => void;
}) {
  const groups = getCapGroups(card, entries, settings);
  if (groups.length === 0) return null;
  const resetDays = daysUntilReset(card, settings);
  const needsStatementDay = usesStatementCycle(card);
  const statementDay = settings.statementDays[card.id];

  return (
    <div>
      <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
        Bonus cap this period
      </p>
      <div className="space-y-2.5">
        {groups.map(g => {
          const pct = Math.min(100, (g.spentSgd / g.capSgd) * 100);
          const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-gray-900';
          return (
            <div key={g.capSgd + g.labels.join()}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-gray-600 truncate pr-2">{g.labels.join(' / ')}</span>
                <span className="text-xs font-semibold text-gray-900 flex-shrink-0">
                  ${Math.round(g.spentSgd).toLocaleString()} / ${g.capSgd.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        Based on spend you&apos;ve logged in Swipe. Resets in {resetDays} day{resetDays === 1 ? '' : 's'}.
      </p>
      {needsStatementDay && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-gray-400">Statement day:</span>
          <select
            value={statementDay ?? ''}
            onClick={e => e.stopPropagation()}
            onChange={e => onStatementDayChange(e.target.value ? parseInt(e.target.value) : null)}
            className="text-[11px] font-semibold text-gray-700 bg-gray-100 rounded-lg px-2 py-1 outline-none"
          >
            <option value="">Not set (uses 1st)</option>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ─── Expandable Card Detail ───────────────────────────────────

function CardDetail({
  card,
  entries,
  settings,
  onStatementDayChange,
}: {
  card: Card;
  entries: SpendEntry[];
  settings: UserSettings;
  onStatementDayChange: (day: number | null) => void;
}) {
  if (card.isAmazePairingCard) {
    return (
      <div className="card-detail-enter bg-gray-50 border-t border-gray-100 px-4 py-4">
        <p className="text-xs text-gray-500 leading-relaxed">{card.notes}</p>
      </div>
    );
  }

  return (
    <div className="card-detail-enter bg-gray-50 border-t border-gray-100 px-4 py-4 space-y-4">
      {/* Earn Rates */}
      {card.earnRates.length > 0 && (
        <div>
          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">Earn Rates</p>
          <div className="space-y-1.5">
            {card.earnRates.map((rate, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900">{rate.label}</span>
                  {rate.notes && (
                    <p className="text-xs text-gray-400 leading-tight mt-0.5">{rate.notes}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-sm font-bold text-gray-900">{rate.mpd} mpd</span>
                  {rate.capSgd != null && (
                    <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                      Cap: ${rate.capSgd.toLocaleString()}/mth
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cap usage meters */}
      <CapMeters
        card={card}
        entries={entries}
        settings={settings}
        onStatementDayChange={onStatementDayChange}
      />

      {/* Cap Reset */}
      {card.earnRates.some(r => r.capSgd != null) && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 flex gap-2 items-start">
          <span className="text-amber-500 text-sm mt-0.5">🗓</span>
          <div>
            <p className="text-xs font-semibold text-amber-800">Bonus cap resets</p>
            <p className="text-xs text-amber-700 mt-0.5">{card.capResetDay}</p>
          </div>
        </div>
      )}

      {/* Transfer Partners */}
      {card.transferPartners.length > 0 && (
        <div>
          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">Transfer Partners</p>
          <div className="space-y-1.5">
            {card.transferPartners.map((tp, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{tp.programme}</span>
                  <p className="text-xs text-gray-400">{tp.airline}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{tp.pointsPerMile}:{' '}1 pts→mile</p>
                  {tp.conversionFeeSgd > 0 ? (
                    <p className="text-red-500">${tp.conversionFeeSgd} fee</p>
                  ) : (
                    <p className="text-green-600">No fee</p>
                  )}
                  <p>{tp.blockSizeMiles.toLocaleString()} min · {tp.transferTimeDaysMin}–{tp.transferTimeDaysMax}d</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amaze Compatible */}
      {card.amazeCompatible && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5 flex gap-2 items-center">
          <span className="text-purple-500 text-sm">⚡</span>
          <p className="text-xs text-purple-800 font-medium">
            Amaze-compatible — pair with Instarem Amaze to unlock higher rates on online spend.
          </p>
        </div>
      )}

      {/* HeyMax Compatible */}
      {card.heymaxCompatible && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl px-3 py-2.5 flex gap-2 items-start">
          <span className="text-teal-500 text-sm mt-0.5">✦</span>
          <div>
            <p className="text-xs text-teal-800 font-semibold">HeyMax compatible</p>
            <p className="text-xs text-teal-700 mt-0.5 leading-relaxed">
              Shop via HeyMax to earn Max Miles on top of this card&apos;s miles. Some merchants (Shopee, Grab, Deliveroo) use gift cards that code as MCC 5311 — potentially unlocking this card&apos;s shopping bonus tier too.
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {card.notes && (
        <div>
          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Notes</p>
          <p className="text-xs text-gray-500 leading-relaxed">{card.notes}</p>
        </div>
      )}

      {/* Annual fee */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-xs text-gray-400">Annual fee</span>
        <span className="text-xs font-semibold text-gray-700">
          {card.annualFeeSgd === 0 ? 'Free' : `$${card.annualFeeSgd.toFixed(2)}`}
        </span>
      </div>

      {/* Official page link */}
      <a
        href={card.officialPageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
        onClick={e => e.stopPropagation()}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Official card page
      </a>
    </div>
  );
}

// ─── Dashboard Card Row ───────────────────────────────────────

function DashboardCard({
  card,
  entries,
  settings,
  onStatementDayChange,
}: {
  card: Card;
  entries: SpendEntry[];
  settings: UserSettings;
  onStatementDayChange: (day: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card row — tappable header */}
      <button
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Thumbnail */}
        <div
          className="relative w-16 h-10 rounded-lg flex-shrink-0 overflow-hidden"
          style={imgError || !card.imagePath ? { backgroundColor: card.bankColor } : {}}
        >
          {!imgError && card.imagePath ? (
            <Image
              src={card.imagePath}
              alt={card.cardName}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              sizes="64px"
            />
          ) : (
            <div className="absolute inset-0 flex items-end p-1" style={{ backgroundColor: card.bankColor }}>
              <span className="text-[8px] font-bold leading-tight" style={{ color: card.bankTextColor }}>
                {card.bank.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Name & tagline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900 truncate">{card.cardName}</p>
            {card.heymaxCompatible && (
              <span className="flex-shrink-0 text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-1.5 py-0.5 leading-none">
                HeyMax
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{card.tagline}</p>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable detail */}
      {expanded && (
        <CardDetail
          card={card}
          entries={entries}
          settings={settings}
          onStatementDayChange={onStatementDayChange}
        />
      )}
    </div>
  );
}

// ─── HeyMax Section ───────────────────────────────────────────

const CATEGORY_ICONS: Record<HeyMaxCategory, string> = {
  'Travel':          '✈️',
  'Shopping':        '🛍️',
  'Food & Delivery': '🍜',
  'Lifestyle':       '🎵',
  'Finance':         '💸',
  'Telco':           '📱',
};

function HeyMaxSection({ myCards }: { myCards: Card[] }) {
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<HeyMaxCategory>('Travel');

  const compatibleCards = myCards.filter(c => c.heymaxCompatible);
  const merchants = getMerchantsByCategory(activeCategory);
  const mcc5311Merchants = getMcc5311Merchants();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      {/* Header — always visible */}
      <button
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">✦</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">HeyMax — Stack Max Miles</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Earn extra miles at 500+ merchants on top of your card
          </p>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="card-detail-enter border-t border-gray-100">
          {/* How it works */}
          <div className="px-4 pt-4 pb-3 space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              {HEYMAX_INFO.howItWorks}
            </p>

            {/* Key facts */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Transfer ratio', value: HEYMAX_INFO.transferRatio },
                { label: 'Transfer fee',   value: HEYMAX_INFO.transferFee },
                { label: 'Programmes',     value: HEYMAX_INFO.numPartners },
              ].map(fact => (
                <div key={fact.label} className="bg-gray-50 rounded-xl px-2.5 py-2 text-center">
                  <p className="text-xs font-bold text-gray-900">{fact.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{fact.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Your compatible cards */}
          {compatibleCards.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
                Your HeyMax-compatible cards
              </p>
              <div className="flex flex-wrap gap-2">
                {compatibleCards.map(card => (
                  <div
                    key={card.id}
                    className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-100 rounded-full px-2.5 py-1"
                  >
                    <span className="text-[10px] font-semibold text-teal-800">{card.cardName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MCC 5311 tip */}
          <div className="mx-4 mb-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-800 mb-1">💡 MCC 5311 gift card trick</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              {HEYMAX_INFO.mcc5311Note}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {mcc5311Merchants.slice(0, 6).map(m => (
                <span key={m.name} className="text-[10px] bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 font-medium">
                  {m.name}
                </span>
              ))}
              {mcc5311Merchants.length > 6 && (
                <span className="text-[10px] text-amber-600 px-1 py-0.5">+{mcc5311Merchants.length - 6} more</span>
              )}
            </div>
          </div>

          {/* Category tabs */}
          <div className="px-4 pb-2">
            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
              Top merchants by category
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
              {HEYMAX_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1.5 transition-colors ${
                    activeCategory === cat
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Merchant list for active category */}
          <div className="px-4 pb-4">
            <div className="space-y-1">
              {merchants.map(m => (
                <div key={m.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900">{m.name}</span>
                      {m.giftCardMcc5311 && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5 leading-none">
                          MCC 5311
                        </span>
                      )}
                    </div>
                    {m.notes && (
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">{m.notes}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-3 text-right">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1"
                    >
                      <span className="text-sm font-bold text-teal-700">{m.milesPerDollar}</span>
                      <span className="text-[10px] text-teal-600 font-medium">mpd</span>
                      <svg className="w-3 h-3 text-teal-500 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 pb-4">
            <a
              href={HEYMAX_INFO.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition-colors"
            >
              <span>✦</span>
              Visit HeyMax — heymax.ai
            </a>
            <p className="text-[10px] text-gray-400 text-center mt-2 leading-relaxed">
              Earn rates are estimates. Always verify on heymax.ai before transacting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<SpendEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ statementDays: {} });

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    if (!p?.setupComplete) {
      router.replace('/onboarding/income');
      return;
    }
    setProfile(p);
    setEntries(loadSpend());
    setSettings(loadSettings());
  }, [router]);

  function handleStatementDayChange(cardId: string, day: number | null) {
    setSettings({ ...setStatementDay(cardId, day) });
  }

  if (!mounted || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const myCards = profile.selectedCardIds
    .map(id => getCard(id))
    .filter((c): c is Card => c !== undefined);

  const incomeLabel = bracketLabel(profile.incomeBracket);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Vault</h1>
            <p className="text-xs text-gray-400">Your card library · Income: {incomeLabel}</p>
          </div>
          <button
            onClick={() => router.push('/onboarding/cards')}
            className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 transition-colors"
          >
            Edit cards
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Summary chip */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-sm font-bold text-gray-900">
            {myCards.length} {myCards.length === 1 ? 'card' : 'cards'} in your wallet
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-500">tap any card to expand</span>
        </div>

        {myCards.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <p className="text-4xl mb-4">💳</p>
            <h2 className="text-base font-semibold text-gray-900 mb-2">No cards added yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Add the credit cards you own to see earn rates, caps, and transfer partners.
            </p>
            <button
              onClick={() => router.push('/onboarding/cards')}
              className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              Add cards
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myCards.map(card => (
              <DashboardCard
                key={card.id}
                card={card}
                entries={entries}
                settings={settings}
                onStatementDayChange={day => handleStatementDayChange(card.id, day)}
              />
            ))}

            {/* Add more */}
            <button
              onClick={() => router.push('/onboarding/cards')}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              + Add or remove cards
            </button>
          </div>
        )}

        {/* HeyMax section — always visible */}
        <HeyMaxSection myCards={myCards} />

        {/* Disclaimer */}
        <p className="text-[11px] text-gray-400 text-center mt-8 leading-relaxed">
          Earn rates are indicative as of May 2026. Always verify with your bank&apos;s current terms before optimising spend.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
