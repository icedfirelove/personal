'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCard, type Card } from '@/data/cards';
import { loadProfile } from '@/lib/storage';
import {
  loadSpend,
  loadSettings,
  loadPromos,
  cardPeriodSummary,
  computeAlerts,
  type SpendEntry,
  type UserSettings,
  type Alert,
  type CardPeriodSummary,
} from '@/lib/spend';
import BottomNav from '@/components/BottomNav';

// ─── Alerts ───────────────────────────────────────────────────

const ALERT_STYLES: Record<Alert['severity'], { box: string; title: string; body: string }> = {
  urgent: { box: 'bg-red-50 border-red-100',     title: 'text-red-800',   body: 'text-red-700' },
  warn:   { box: 'bg-amber-50 border-amber-100', title: 'text-amber-800', body: 'text-amber-700' },
  info:   { box: 'bg-blue-50 border-blue-100',   title: 'text-blue-800',  body: 'text-blue-700' },
};

function AlertsSection({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2 mb-6">
      {alerts.map(a => {
        const s = ALERT_STYLES[a.severity];
        return (
          <div key={a.id} className={`border rounded-xl px-3 py-2.5 flex gap-2 items-start ${s.box}`}>
            <span className="text-sm mt-0.5">{a.icon}</span>
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${s.title}`}>{a.title}</p>
              <p className={`text-xs mt-0.5 leading-relaxed ${s.body}`}>{a.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Card summary row ─────────────────────────────────────────

function SummaryRow({ summary }: { summary: CardPeriodSummary }) {
  const [imgError, setImgError] = useState(false);
  const { card } = summary;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3.5">
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
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

        {/* Name + spend */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{card.cardName}</p>
          <p className="text-[11px] text-gray-400">
            ${Math.round(summary.spentSgd).toLocaleString()} spent this period
          </p>
        </div>

        {/* Miles */}
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-gray-900">
            {Math.round(summary.milesEarned).toLocaleString()}
            <span className="text-[10px] font-semibold text-gray-400"> mi</span>
          </p>
          <p className="text-[10px] text-gray-400">this period</p>
        </div>
      </div>

      {/* Cap bars */}
      {summary.capGroups.length > 0 && (
        <div className="mt-3 space-y-2">
          {summary.capGroups.map(g => {
            const pct = Math.min(100, (g.spentSgd / g.capSgd) * 100);
            const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-teal-600';
            return (
              <div key={g.capSgd + g.labels.join()}>
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="text-[10px] text-gray-400 truncate pr-2">
                    {g.mpd} mpd · {g.labels.join(' / ')}
                  </span>
                  <span className={`text-[10px] font-bold flex-shrink-0 ${pct >= 100 ? 'text-red-600' : 'text-gray-600'}`}>
                    {pct >= 100
                      ? 'Cap hit'
                      : `$${Math.round(g.remainingSgd).toLocaleString()} to cap`}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-gray-300">Resets in {summary.resetInDays} day{summary.resetInDays === 1 ? '' : 's'}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function OverviewPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [summaries, setSummaries] = useState<CardPeriodSummary[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [totals, setTotals] = useState({ miles: 0, spend: 0 });

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    if (!p?.setupComplete) {
      router.replace('/onboarding/income');
      return;
    }
    const cards = p.selectedCardIds.map(id => getCard(id)).filter((c): c is Card => !!c && !c.isAmazePairingCard);
    const entries: SpendEntry[] = loadSpend();
    const settings: UserSettings = loadSettings();
    const sums = cards
      .map(c => cardPeriodSummary(c, entries, settings))
      .sort((a, b) => b.milesEarned - a.milesEarned);
    setSummaries(sums);
    setTotals({
      miles: sums.reduce((s, x) => s + x.milesEarned, 0),
      spend: sums.reduce((s, x) => s + x.spentSgd, 0),
    });
    setAlerts(computeAlerts(cards, entries, settings, loadPromos()));
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Overview</h1>
            <p className="text-xs text-gray-400">Your miles & caps this period</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-gray-900">
              {Math.round(totals.miles).toLocaleString()}
              <span className="text-[10px] font-semibold text-gray-400"> mi</span>
            </p>
            <p className="text-[10px] text-gray-400">${Math.round(totals.spend).toLocaleString()} tracked</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <AlertsSection alerts={alerts} />

        {summaries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">💳</p>
            <h2 className="text-base font-semibold text-gray-900 mb-2">No cards yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Add your cards in the Vault tab to start tracking miles and caps.
            </p>
            <button
              onClick={() => router.push('/onboarding/cards')}
              className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              Add cards
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {summaries.map(s => (
                <SummaryRow key={s.card.id} summary={s} />
              ))}
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
              Numbers are based on transactions you&apos;ve logged. Log spend in the Txns tab or via the Swipe recommender.
            </p>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
