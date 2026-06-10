'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCard, type Card } from '@/data/cards';
import { loadProfile } from '@/lib/storage';
import { getPromoFeed } from '@/lib/remotePromos';
import { downloadBackup, importBackup, eraseAllData } from '@/lib/backup';
import { parseTransactionsFlexible, parseStatementLines, type ImportPreview } from '@/lib/importTxns';
import { addSpendBulk } from '@/lib/spend';
import { categoryMeta } from '@/lib/categories';
import BottomNav from '@/components/BottomNav';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-2xl border border-outline px-4 py-4">
      <h2 className="text-sm font-bold text-on-surface mb-2">{title}</h2>
      <div className="text-xs text-on-surface-variant leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  const router = useRouter();
  const [lastVerified, setLastVerified] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [eraseArmed, setEraseArmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const txnFileRef = useRef<HTMLInputElement>(null);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [txnPreview, setTxnPreview] = useState<ImportPreview | null>(null);
  const [txnCardId, setTxnCardId] = useState<string>('');
  const [txnMsg, setTxnMsg] = useState<string | null>(null);

  useEffect(() => {
    setLastVerified(getPromoFeed().lastVerified);
    const p = loadProfile();
    const cards = (p?.selectedCardIds ?? [])
      .map(id => getCard(id))
      .filter((c): c is Card => !!c && !c.isAmazePairingCard);
    setMyCards(cards);
    if (cards.length > 0) setTxnCardId(cards[0].id);
  }, []);

  async function handleTxnFile(file: File) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setTxnMsg('⏳ Reading PDF…');
      try {
        const { extractPdfLines } = await import('@/lib/pdfExtract');
        const lines = await extractPdfLines(await file.arrayBuffer());
        const preview = parseStatementLines(lines);
        setTxnPreview(preview);
        setTxnMsg(preview.ok ? null : preview.error ?? 'Could not read that PDF.');
      } catch {
        setTxnMsg('✗ Could not open this PDF. Password-protected statements need the password removed first (open in Preview → File → Export as PDF).');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const preview = parseTransactionsFlexible(String(reader.result));
      setTxnPreview(preview);
      setTxnMsg(preview.ok ? null : preview.error ?? 'Could not read that file.');
    };
    reader.readAsText(file);
  }

  function confirmTxnImport() {
    if (!txnPreview?.ok || !txnCardId) return;
    addSpendBulk(
      txnPreview.txns.map(t => ({
        cardId: txnCardId,
        category: t.category ?? 'general',
        amountSgd: t.amountSgd,
        dateISO: t.dateISO,
        source: 'manual' as const,
        note: t.merchant ?? (t.description || undefined),
      })),
    );
    setTxnMsg(`✓ Imported ${txnPreview.txns.length} transactions to ${getCard(txnCardId)?.cardName}.`);
    setTxnPreview(null);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importBackup(String(reader.result));
      if (result.ok) {
        setImportMsg(`✓ Restored ${result.restoredKeys} data sets. Reloading…`);
        setTimeout(() => (window.location.href = '/overview'), 1200);
      } else {
        setImportMsg(`✗ ${result.error}`);
      }
    };
    reader.readAsText(file);
  }

  function handleErase() {
    if (!eraseArmed) {
      setEraseArmed(true);
      setTimeout(() => setEraseArmed(false), 4000);
      return;
    }
    eraseAllData();
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-background page-bottom">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface border-b border-outline px-4 pb-4 header-safe">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-on-surface-variant hover:text-on-surface text-lg leading-none"
            aria-label="Back"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-on-surface">About MilesVault</h1>
            <p className="text-xs text-on-surface-variant">Private by design</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-3">
        {/* Ethos */}
        <Section title="What this is">
          <p>
            MilesVault tells you which credit card to swipe so every dollar earns the most miles —
            tracking your bonus caps, sign-up promos, and spending along the way. And it does this
            without ever seeing your data.
          </p>
        </Section>

        {/* Privacy */}
        <Section title="🔒 Your data never leaves this device">
          <p>
            There is no account, no database, no analytics, and no tracking. Everything you enter —
            your cards, transactions, income bracket, tracked promos — is stored in your browser&apos;s
            local storage on this device. The app never transmits it anywhere. We couldn&apos;t read
            your data even if we wanted to: there is no server to send it to.
          </p>
          <p className="text-muted">
            The honest trade-offs: data lives on <em>this device only</em> (no sync between phone and
            laptop), clearing your browser data erases it, and iOS Safari may evict data from websites
            you haven&apos;t opened in 7 days. Two protections: add MilesVault to your Home Screen
            (exempts it from eviction), and export a backup below now and then.
          </p>
        </Section>

        {/* Data sources */}
        <Section title="📚 Where our data comes from">
          <p>
            Card earn rates, caps, and transfer partners are compiled by hand and verified against{' '}
            <a href="https://milelion.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              The MileLion
            </a>{' '}
            and the banks&apos; published terms. Sign-up promos come from our own feed, checked against
            MileLion&apos;s monthly roundups{lastVerified ? ` — last verified ${new Date(lastVerified).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}.
            Card images are the banks&apos; own marketing assets.
          </p>
          <p className="font-semibold text-on-surface">
            We are not affiliated with any bank, MileLion, or HeyMax — and we earn nothing if you
            sign up for any card. Recommendations have no sponsor.
          </p>
        </Section>

        {/* How recommendations work */}
        <Section title="🧮 How recommendations work">
          <p>
            Swipe rankings are pure arithmetic: each card&apos;s earn rate for the category, minus
            whatever you&apos;ve already used of its monthly bonus cap. Promo picks check whether
            you&apos;re actually eligible (new-to-bank rules, income requirement) and whether the
            minimum spend fits your real spending pace from logged transactions. No black box,
            no sponsored placement.
          </p>
        </Section>

        {/* Limitations */}
        <Section title="⚠️ Honest limitations">
          <p>
            Banks change earn rates, caps, and promos without notice — always confirm against the
            bank&apos;s current terms before committing big spend. Whether a purchase earns bonus
            miles depends on the merchant&apos;s category code (MCC), which is set by the
            merchant&apos;s bank and isn&apos;t always predictable — that&apos;s why the Swipe tab
            has a &ldquo;Not sure&rdquo; mode. Shared-cap maths is a close approximation. None of
            this is financial advice.
          </p>
        </Section>

        {/* Data tools */}
        <Section title="🧰 Your data, your controls">
          <p>
            Export downloads everything as a single JSON file — your backup against lost phones and
            cleared browsers, and the way to move data between devices.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={downloadBackup}
              className="text-xs font-bold bg-primary text-on-primary rounded-xl px-4 py-2.5 hover:bg-primary-hover transition-colors"
            >
              ⬇ Export my data
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs font-bold bg-surface-high text-on-surface rounded-xl px-4 py-2.5 hover:bg-surface-bright transition-colors"
            >
              ⬆ Import backup
            </button>
            <button
              onClick={handleErase}
              className={`text-xs font-bold rounded-xl px-4 py-2.5 transition-colors ${
                eraseArmed
                  ? 'bg-red-500 text-white'
                  : 'bg-red-950 text-red-300 border border-red-900 hover:bg-red-900'
              }`}
            >
              {eraseArmed ? 'Tap again to erase everything' : '🗑 Erase all data'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = '';
            }}
          />
          {importMsg && (
            <p className={`text-xs font-semibold ${importMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {importMsg}
            </p>
          )}
          <p className="text-muted">
            Importing overwrites this device&apos;s current data. Erasing is permanent — there is no
            server copy to recover from.
          </p>
        </Section>

        {/* Flexible transaction import */}
        <Section title="📄 Import transactions from any file">
          <p>
            Backfill your spending history from a bank statement <strong className="text-on-surface">PDF</strong>,
            CSV, or a JSON list of transactions. Merchants are auto-categorised (Shopee → Online, etc.);
            payments, refunds, and credits are skipped. Statements are per-card, so pick which card the
            file belongs to. PDFs are read entirely on this device — the file is never uploaded.
          </p>

          {myCards.length === 0 ? (
            <p className="text-muted">Add cards to your wallet first.</p>
          ) : !txnPreview?.ok ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => txnFileRef.current?.click()}
                className="text-xs font-bold bg-surface-high text-on-surface rounded-xl px-4 py-2.5 hover:bg-surface-bright transition-colors"
              >
                📄 Choose PDF / CSV / JSON file
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {/* Card picker + summary */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={txnCardId}
                  onChange={e => setTxnCardId(e.target.value)}
                  className="text-xs font-semibold text-on-surface bg-surface-high rounded-xl px-3 py-2.5 outline-none"
                >
                  {myCards.map(c => (
                    <option key={c.id} value={c.id}>{c.cardName}</option>
                  ))}
                </select>
                <span className="text-[11px] text-on-surface-variant">
                  {txnPreview.txns.length} transactions
                  {txnPreview.skippedRows > 0 && ` · ${txnPreview.skippedRows} rows skipped`}
                  {txnPreview.detected && ` · columns: ${txnPreview.detected.date} / ${txnPreview.detected.amount} / ${txnPreview.detected.description}`}
                </span>
              </div>

              {/* Preview table */}
              <div className="border border-outline rounded-xl overflow-hidden">
                {txnPreview.txns.slice(0, 6).map((t, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-outline last:border-0 bg-background">
                    <span className="text-sm">{categoryMeta(t.category ?? 'general').icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">{t.merchant ?? t.description ?? '—'}</p>
                      <p className="text-[10px] text-muted">
                        {new Date(t.dateISO).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{categoryMeta(t.category ?? 'general').label}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-on-surface flex-shrink-0">
                      ${t.amountSgd.toLocaleString()}
                    </span>
                  </div>
                ))}
                {txnPreview.txns.length > 6 && (
                  <p className="text-[10px] text-muted text-center py-1.5 bg-background">
                    + {txnPreview.txns.length - 6} more
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={confirmTxnImport}
                  className="text-xs font-bold bg-primary text-on-primary rounded-xl px-4 py-2.5 hover:bg-primary-hover transition-colors"
                >
                  ✓ Import {txnPreview.txns.length} transactions
                </button>
                <button
                  onClick={() => { setTxnPreview(null); setTxnMsg(null); }}
                  className="text-xs font-bold bg-surface-high text-on-surface rounded-xl px-4 py-2.5 hover:bg-surface-bright transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <input
            ref={txnFileRef}
            type="file"
            accept=".pdf,.csv,.json,application/pdf,text/csv,application/json"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleTxnFile(f);
              e.target.value = '';
            }}
          />
          {txnMsg && (
            <p className={`text-xs font-semibold ${txnMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {txnMsg}
            </p>
          )}
        </Section>

        {/* Credits */}
        <Section title="🙏 Credits">
          <p>
            Rate and promo research builds on the work of{' '}
            <a href="https://milelion.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              The MileLion
            </a>
            , the best miles resource in Singapore. MilesVault — June 2026 build.
          </p>
        </Section>
      </div>

      <BottomNav />
    </div>
  );
}
