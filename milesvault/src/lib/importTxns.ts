// ============================================================
// MilesVault — Flexible transaction import
// Accepts bank-statement CSVs or loose JSON arrays and turns
// them into spend entries: auto-detects date/amount/description
// columns, categorises merchants via the parser, and returns a
// preview for the user to confirm before anything is saved.
// ============================================================

import { resolveMerchant } from '@/lib/parser';
import { type SpendCategory } from '@/lib/categories';

export interface ParsedTxn {
  dateISO: string;
  amountSgd: number;
  description: string;
  category: SpendCategory | null;  // null → Everything else
  merchant: string | null;
}

export interface ImportPreview {
  ok: boolean;
  error?: string;
  txns: ParsedTxn[];
  skippedRows: number;             // rows we couldn't make sense of
  detected?: { date: string; amount: string; description: string }; // column names (CSV)
}

// ─── Small CSV parser (handles quoted fields and commas inside) ──

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(f => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some(f => f.trim() !== '')) rows.push(row);
  return rows;
}

// ─── Field interpreters ────────────────────────────────────────

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** "12/05/2026", "2026-05-12", "12 May 2026", "05 MAY" (year inferred) → ISO. SG default: DD/MM. */
function parseDate(raw: string, now = new Date()): string | null {
  const s = raw.trim();
  if (!s) return null;

  // ISO-ish: 2026-05-12 or 2026/05/12
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return toIso(+m[1], +m[2], +m[3]);

  // DD/MM/YYYY or DD-MM-YYYY (SG convention; swap if day position > 12 forces it)
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (m) {
    let day = +m[1], month = +m[2];
    const year = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    if (month > 12 && day <= 12) [day, month] = [month, day]; // it was MM/DD
    return toIso(year, month, day);
  }

  // "18/05" — DD/MM with no year (PDF statements); infer like month-name dates
  m = s.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    let day = +m[1], month = +m[2];
    if (month > 12 && day <= 12) [day, month] = [month, day];
    const year = now.getFullYear();
    const iso = toIso(year, month, day);
    if (iso && new Date(iso).getTime() > now.getTime() + 7 * 86_400_000) {
      return toIso(year - 1, month, day);
    }
    return iso;
  }

  // "05 MAY" / "05 May 2026" — common in PDF statements, often without a year
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?(?:\s+(\d{4}))?$/);
  if (m) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (!month) return null;
    let year = m[3] ? +m[3] : now.getFullYear();
    const iso = toIso(year, month, +m[1]);
    // No explicit year and the date lands in the future → it was last year
    if (!m[3] && iso && new Date(iso).getTime() > now.getTime() + 7 * 86_400_000) {
      year -= 1;
      return toIso(year, month, +m[1]);
    }
    return iso;
  }

  // "May 12, 2026" and friends
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString();

  return null;
}

function toIso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  return new Date(Date.UTC(y, mo - 1, d, 4)).toISOString(); // 4am UTC ≈ midday SGT
}

/** "$1,234.56", "1234.56", "SGD 45", "(12.30)" (credit), "45.00 CR" → number or null. */
function parseAmount(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  const isCredit = /\(.*\)|CR\b/i.test(s);
  s = s.replace(/[^\d.,-]/g, '').replace(/,/g, '');
  if (!s) return null;
  const n = parseFloat(s);
  if (Number.isNaN(n) || n === 0) return null;
  return isCredit ? -Math.abs(n) : Math.abs(n);
}

// ─── Column detection ──────────────────────────────────────────

const DATE_HINTS = ['date', 'transaction date', 'txn date', 'posted'];
const AMOUNT_HINTS = ['amount', 'sgd', 'debit', 'value', 'transaction amount'];
const DESC_HINTS = ['description', 'merchant', 'details', 'narrative', 'transaction', 'particulars'];

function findColumn(headers: string[], hints: string[]): number {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const hint of hints) {
    const i = lower.findIndex(h => h.includes(hint));
    if (i !== -1) return i;
  }
  return -1;
}

/** Fallback: sniff column roles from the data itself. */
function sniffColumns(rows: string[][]): { date: number; amount: number; desc: number } {
  const cols = rows[0]?.length ?? 0;
  let date = -1, amount = -1, desc = -1;
  for (let c = 0; c < cols; c++) {
    const sample = rows.slice(0, 8).map(r => r[c] ?? '');
    const dates = sample.filter(v => parseDate(v) !== null).length;
    const amounts = sample.filter(v => parseAmount(v) !== null && !parseDate(v)).length;
    if (date === -1 && dates >= sample.length / 2) { date = c; continue; }
    if (amount === -1 && amounts >= sample.length / 2) { amount = c; continue; }
    if (desc === -1 && sample.some(v => /[a-zA-Z]{3,}/.test(v))) desc = c;
  }
  return { date, amount, desc };
}

// ─── Loose JSON ────────────────────────────────────────────────

const JSON_DATE_KEYS = ['date', 'dateiso', 'transactiondate', 'txndate', 'time', 'timestamp'];
const JSON_AMOUNT_KEYS = ['amount', 'amountsgd', 'amt', 'value', 'sgd', 'total', 'debit'];
const JSON_DESC_KEYS = ['description', 'merchant', 'name', 'details', 'note', 'narrative', 'payee'];

function pickKey(obj: Record<string, unknown>, candidates: string[]): unknown {
  const keys = Object.keys(obj);
  for (const cand of candidates) {
    const k = keys.find(key => key.toLowerCase().replace(/[_\s]/g, '') === cand);
    if (k !== undefined) return obj[k];
  }
  return undefined;
}

// ─── Entry points ──────────────────────────────────────────────

function finalise(raw: { dateISO: string | null; amountSgd: number | null; description: string }[]): ImportPreview {
  const txns: ParsedTxn[] = [];
  let skipped = 0;

  for (const r of raw) {
    // skip credits/refunds (negative) and unparseable rows
    if (!r.dateISO || r.amountSgd === null || r.amountSgd <= 0) {
      skipped++;
      continue;
    }
    const resolved = r.description ? resolveMerchant(r.description) : { merchant: null, category: null };
    txns.push({
      dateISO: r.dateISO,
      amountSgd: r.amountSgd,
      description: r.description,
      category: resolved.category,
      merchant: resolved.merchant,
    });
  }

  if (txns.length === 0) {
    return { ok: false, error: 'No usable transactions found — needs a date, a positive amount, and ideally a description per row.', txns: [], skippedRows: skipped };
  }
  return { ok: true, txns, skippedRows: skipped };
}

export function parseTransactionsCsv(text: string): ImportPreview {
  const rows = parseCsv(text);
  if (rows.length < 2) return { ok: false, error: 'CSV needs a header row plus at least one transaction.', txns: [], skippedRows: 0 };

  const headers = rows[0];
  let dateCol = findColumn(headers, DATE_HINTS);
  let amountCol = findColumn(headers, AMOUNT_HINTS);
  let descCol = findColumn(headers, DESC_HINTS);
  let dataRows = rows.slice(1);

  // Headerless or unrecognised headers → sniff from data (include first row)
  if (dateCol === -1 || amountCol === -1) {
    const allRows = dateCol === -1 && parseDate(headers[0] ?? '') ? rows : dataRows;
    const sniffed = sniffColumns(allRows);
    if (sniffed.date === -1 || sniffed.amount === -1) {
      return { ok: false, error: "Couldn't find date and amount columns. Expected headers like Date / Amount / Description.", txns: [], skippedRows: 0 };
    }
    dateCol = sniffed.date; amountCol = sniffed.amount; descCol = sniffed.desc;
    dataRows = allRows;
  }

  const preview = finalise(
    dataRows.map(r => ({
      dateISO: parseDate(r[dateCol] ?? ''),
      amountSgd: parseAmount(r[amountCol] ?? ''),
      description: (descCol !== -1 ? r[descCol] ?? '' : '').trim(),
    })),
  );
  preview.detected = {
    date: headers[dateCol] ?? `column ${dateCol + 1}`,
    amount: headers[amountCol] ?? `column ${amountCol + 1}`,
    description: descCol !== -1 ? headers[descCol] ?? `column ${descCol + 1}` : '(none)',
  };
  return preview;
}

export function parseTransactionsLooseJson(text: string): ImportPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Not valid JSON.', txns: [], skippedRows: 0 };
  }
  const arr = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as Record<string, unknown>).transactions)
      ? ((parsed as Record<string, unknown>).transactions as unknown[])
      : null;
  if (!arr) return { ok: false, error: 'Expected a JSON array of transactions (or { "transactions": [...] }).', txns: [], skippedRows: 0 };

  return finalise(
    arr.map(item => {
      if (typeof item !== 'object' || item === null) return { dateISO: null, amountSgd: null, description: '' };
      const o = item as Record<string, unknown>;
      const rawDate = pickKey(o, JSON_DATE_KEYS);
      const rawAmount = pickKey(o, JSON_AMOUNT_KEYS);
      const rawDesc = pickKey(o, JSON_DESC_KEYS);
      return {
        dateISO: typeof rawDate === 'string' ? parseDate(rawDate) : typeof rawDate === 'number' ? new Date(rawDate).toISOString() : null,
        amountSgd: typeof rawAmount === 'number' ? (rawAmount > 0 ? rawAmount : null) : typeof rawAmount === 'string' ? parseAmount(rawAmount) : null,
        description: typeof rawDesc === 'string' ? rawDesc.trim() : '',
      };
    }),
  );
}

// ─── PDF statement rows ────────────────────────────────────────

/**
 * A transaction row in a PDF statement: starts with a date, ends with an
 * amount (optionally CR for credits), description in between. Two dates at
 * the start (transaction + posting date) are also common — keep the first.
 */
const STMT_ROW =
  /^(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{1,2}\s+[A-Za-z]{3,9})\s+(?:(?:\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{1,2}\s+[A-Za-z]{3,9})\s+)?(.+?)\s+(?:S?\$\s?)?(-?[\d,]+\.\d{2})\s*(CR|DR)?$/i;

/** Lines that look like transactions but aren't spending. */
const STMT_NOISE =
  /balance|payment\s+received|payment\s*-\s*thank|giro|total|subtotal|previous|brought\s+forward|carried\s+forward|interest|late\s+charge|annual\s+fee\s+waiver|rebate|statement\s+date|credit\s+limit|minimum\s+payment/i;

/** Parse text lines extracted from a PDF bank statement. */
export function parseStatementLines(lines: string[], now = new Date()): ImportPreview {
  const raw: { dateISO: string | null; amountSgd: number | null; description: string }[] = [];

  for (const line of lines) {
    const m = line.trim().match(STMT_ROW);
    if (!m) continue;
    if (STMT_NOISE.test(line)) continue;
    const isCredit = !!m[4] && m[4].toUpperCase() === 'CR';
    const amount = parseAmount(m[3]);
    raw.push({
      dateISO: parseDate(m[1], now),
      amountSgd: amount === null ? null : isCredit ? -amount : amount,
      description: m[2].trim(),
    });
  }

  if (raw.length === 0) {
    return {
      ok: false,
      error:
        "Couldn't find transaction rows in this PDF. If the statement is a scanned image (rather than text), it can't be read — try the bank's CSV export instead.",
      txns: [],
      skippedRows: 0,
    };
  }
  return finalise(raw);
}

/** Route by content: JSON if it parses, else CSV. */
export function parseTransactionsFlexible(text: string): ImportPreview {
  const trimmed = text.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const asJson = parseTransactionsLooseJson(trimmed);
    if (asJson.ok || trimmed.startsWith('[')) return asJson;
  }
  return parseTransactionsCsv(text);
}
