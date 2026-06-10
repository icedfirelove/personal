// ============================================================
// MilesVault — localStorage persistence layer
// All user data is stored client-side. No account required.
// ============================================================

export type IncomeBracket =
  | 'below-30k'
  | '30k-60k'
  | '60k-80k'
  | '80k-120k'
  | 'above-120k';

export interface UserProfile {
  incomeBracket: IncomeBracket;
  selectedCardIds: string[];   // card IDs from cards.ts
  setupComplete: boolean;
  lastUpdated: string;         // ISO date string
}

const STORAGE_KEY = 'milesvault_profile';

// ─── Read ──────────────────────────────────────────────────────

export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

// ─── Write ─────────────────────────────────────────────────────

export function saveProfile(profile: Partial<UserProfile>): UserProfile {
  const existing = loadProfile();
  const updated: UserProfile = {
    incomeBracket: 'below-30k',
    selectedCardIds: [],
    setupComplete: false,
    ...existing,
    ...profile,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Card selection helpers ────────────────────────────────────

export function toggleCard(cardId: string): string[] {
  const profile = loadProfile();
  const current = profile?.selectedCardIds ?? [];
  const next = current.includes(cardId)
    ? current.filter(id => id !== cardId)
    : [...current, cardId];
  saveProfile({ selectedCardIds: next });
  return next;
}

export function isCardSelected(cardId: string): boolean {
  const profile = loadProfile();
  return profile?.selectedCardIds.includes(cardId) ?? false;
}

// ─── Income bracket label ─────────────────────────────────────

export const INCOME_BRACKETS: { value: IncomeBracket; label: string }[] = [
  { value: 'below-30k',  label: 'Below $30,000' },
  { value: '30k-60k',    label: '$30,000 – $60,000' },
  { value: '60k-80k',    label: '$60,000 – $80,000' },
  { value: '80k-120k',   label: '$80,000 – $120,000' },
  { value: 'above-120k', label: 'Above $120,000' },
];

export function bracketLabel(bracket: IncomeBracket): string {
  return INCOME_BRACKETS.find(b => b.value === bracket)?.label ?? bracket;
}
