// ============================================================
// MilesVault — Export / Import / Erase
// Everything the app knows lives in these localStorage keys.
// Export bundles them into one JSON file; import restores it;
// erase removes them. No servers involved, ever.
// ============================================================

export const STORAGE_KEYS = [
  'milesvault_profile',     // income bracket + selected cards
  'milesvault_spend',       // logged transactions
  'milesvault_promos',      // tracked sign-up promos
  'milesvault_settings',    // statement days etc.
  'milesvault_merchants',   // learned merchant → category corrections
  'milesvault_promo_feed',  // cached promo feed
] as const;

export interface BackupFile {
  app: 'MilesVault';
  schemaVersion: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function buildBackup(): BackupFile {
  const data: Record<string, unknown> = {};
  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  return {
    app: 'MilesVault',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Trigger a download of the backup as a .json file. */
export function downloadBackup(): void {
  const backup = buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `milesvault-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  restoredKeys?: number;
}

/** Restore a previously exported backup. Overwrites current data. */
export function importBackup(jsonText: string): ImportResult {
  let parsed: BackupFile;
  try {
    parsed = JSON.parse(jsonText) as BackupFile;
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (parsed.app !== 'MilesVault' || typeof parsed.data !== 'object' || parsed.data === null) {
    return { ok: false, error: 'That file does not look like a MilesVault backup.' };
  }

  let restored = 0;
  for (const key of STORAGE_KEYS) {
    if (key in parsed.data) {
      localStorage.setItem(key, JSON.stringify(parsed.data[key]));
      restored++;
    }
  }
  if (restored === 0) return { ok: false, error: 'The backup contained no MilesVault data.' };
  return { ok: true, restoredKeys: restored };
}

/** Permanently delete all MilesVault data on this device. */
export function eraseAllData(): void {
  for (const key of STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}
