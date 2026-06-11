# MilesVault — Session Learnings (June 2026)

A record of what we learned building, designing, and shipping MilesVault in one extended session.
Written for future-project reference: product lessons, technical gotchas, and process notes.

---

## 1. Product & design lessons

**Merge decision and record-keeping into one motion.** Swipe ("which card?") and Transactions ("log it")
started as separate tabs with overlapping inputs. Merging them — type amount + merchant, get ranked cards,
tap "I used this" to log — removed double entry entirely. General rule: if the user must act on a
recommendation, capture the action *as* the confirmation.

**Be honest about uncertainty instead of faking precision.** The hotel-restaurant problem (is it dining
or hotel MCC?) is genuinely unknowable in advance. Rather than guess, the "Not sure" mode ranks cards by
guaranteed worst-case miles and flags "safe either way" picks. Nobody else does this. Lesson: when a
domain has irreducible uncertainty, a product that *manages* it beats one that pretends it doesn't exist.

**Show ineligible options with the reason, don't hide them.** Promos the user can't apply for moved to a
"Not for you · tell a friend" section with the specific blocker ("you already hold a Citibank card").
Hidden information feels like a bug; explained information builds trust and adds a sharing use case.

**Computed reasons beat canned copy.** Promo recommendations carry one-liners assembled from the actual
scoring facts ("you're new to OCBC, the $600 min spend fits your ~$2.7k/mo pace, 26,000 miles with no
fee"). Cheap to build, dramatically more trustworthy than "Recommended for you!".

**A privacy page needs working buttons and admitted trade-offs.** The About page states the costs of
local-only storage (no sync, Safari 7-day eviction) alongside the wins, and ships functional
Export / Import / Erase. A delete button is worth ten paragraphs of promises.

**Names should match the user's mental model, and it takes iterations.** Vault → (gear/Manage?) → "More ⋯".
Also: Edit-cards button belongs next to the cards, income gets its own line item — controls live with the
things they control, not in headers.

**Wrap, don't side-scroll, for option sets the user must see in full.** Category chips wrapped via
`flex-wrap` — screen-size-driven, no platform detection needed.

**Senior-PM critique of the finished app (kept for the roadmap):**
- #1 risk: manual logging is a retention killer; stale-but-confident data is worse than no data.
- Time-to-value is backloaded — the aha-moment needs to be in the first 60 seconds, not day 4.
- App is earn-only; the job-to-be-done ends in a redemption. A balances/"80% to Tokyo" view converts a
  discipline tool into a progress tracker.
- Manually-maintained data (rates, promos) silently rots — needs a staleness banner or automation.
- North-star metric candidate: % of weeks with ≥5 logged transactions.

## 2. Competitive landscape (researched June 2026)

- **HeyMax Card Maximiser**: auto-tracks transactions via Visa partnership (Visa-only!), caps + min-spend
  tracking. **Dobin**: ~90 cards, MCC-based Card Compass. **WhatCard.sg**: crowdsourced merchant→MCC search.
- MilesVault's defensible niche: privacy (no linking, no account), any card network, no affiliate bias,
  uncertainty-aware recommendations. As a venture it loses; as a personal/niche tool it wins.
- Key vocabulary: MCC decides bonuses; NTB (new-to-bank) gates most sign-up offers; cost-per-mile and
  payoff ratio are how MileLion evaluates promos.

## 3. Technical gotchas & patterns

### Parser / NLP-lite
- **Exact matches must beat fuzzy matches** (two-pass), or "SHOPEE SINGAPORE" matches Singapore Airlines
  via the 'singaporeair' keyword. Also cap prefix-fuzz: token must be within 2 chars of full keyword.
- Learned corrections (user fixes a category once → remembered in localStorage) beat dictionary growth.
- Generic word stems ("cafe", "bakery", "resort") catch unknown merchants cheaply.

### Tailwind / theming
- **Bulk class-rename sweeps need word boundaries**: `bg-red-50` matched inside `bg-red-500` → `bg-red-9500`.
  Use a single-pass simultaneous regex with full-token keys, then grep for damage.
- Migrating raw `gray-*` utilities to semantic tokens (`bg-surface`, `text-on-surface`, `bg-primary` via
  Tailwind 4 `@theme`) made the M3 retheme a 12-line file instead of another sweep. Do this from day one.
- M3 dark: tonal surface layers (#141218 → #1d1b20 → #2b2930), on-surface text roles, tone-80 primary.

### PWA / mobile web
- **Service workers will haunt you.** Cache-first JS plus a registered SW caused repeated "old UI" bugs
  that looked like broken features (3-tab nav + new CSS = "dark mode looks terrible"). Fixes: bump cache
  name to purge, and *never register the SW on localhost* (actively unregister + clear caches there).
- iOS safe areas: `viewport-fit=cover` + `env(safe-area-inset-top/bottom)` utility classes on sticky
  headers/bottom nav; remember the fixed-nav clearance (`.page-bottom`) must include the inset too.
- Snappy tabs: `router.prefetch` all tabs on mount, optimistic active state on tap, `loading.tsx`
  skeletons that include the nav, `touch-action: manipulation` + transparent tap highlight.
- localStorage: ~5MB (decades of txns), but Safari evicts after 7 days of non-visit unless the app is
  added to Home Screen. Export/import is the no-backend answer to backup and device moves.

### Data without a backend
- Runtime-fetched JSON (`/promos.json` + raw.githubusercontent fallback) gives "update without redeploy":
  edit file → push → clients pull-to-refresh. Cache in localStorage, fall back to bundled snapshot,
  show a live "last verified" stamp.
- Client-side PDF parsing works for SG bank statements: pdf.js from CDN via
  `Function('u','return import(u)')(url)` (dodges bundler/TS), reconstruct lines by Y-coordinate,
  regex rows (date [+posting date] + description + amount + CR), filter noise (BALANCE/PAYMENT/TOTAL).
  Dates without years ("05 MAY", "18/05") need year inference: assume current, roll back if future.
- A pull-to-refresh is ~70 lines: touch handlers + scrollTop===0 gate + rubber-band resistance.

### Git / deployment in the Cowork sandbox
- Mounted-folder `.git` gets stuck lock files (HEAD.lock can't be unlinked) → local commits fail.
  Workaround that always works: temp index + plumbing —
  `GIT_INDEX_FILE=/tmp/idx git read-tree FETCH_HEAD` → `git rm -r --cached subdir` →
  `read-tree --prefix=subdir/ $TREE` → `commit-tree` → push the commit SHA directly. No ref locks needed.
- Monorepo of project subfolders → Vercel needs **Root Directory** set to the subfolder, else 404 on a
  "successful" deploy.
- `next build` cannot finish in the sandbox (45s call limit kills background processes; mounted FS is
  slow). Verification stack that works: `tsc --noEmit` + `next lint` + tsx unit tests of pure logic in
  /tmp with rewritten imports. Run real builds locally.
- Next.js 15 + react-hooks v6 lint: `set-state-in-effect` fires on the standard
  load-localStorage-after-mount pattern and **fails the production build** — disable the rule for
  client-only localStorage apps.
- npm registry is reachable from the sandbox (npx tsx works); arbitrary binary downloads (curl images)
  are not. Page fetches go through the fetch tool only.

### Security
- A PAT pasted into chat is *exposed* — it lives in transcripts and shell logs. Classic `ghp_` tokens
  scope to ALL repos; use fine-grained single-repo tokens with short expiry, and revoke after use.

## 4. Process lessons

- **Clarify before building, but build the obvious.** Quick option questions (parser approach, tab
  layout, promo data source) avoided rework; conversely the user redirected mid-build several times
  (Recommended section "include this as well", "don't push yet") — staying flexible mid-task mattered.
- **"Don't push yet, let me see locally first"** became the rhythm for UI work: build → user reviews on
  dev server → push on approval. Works well because edits land directly in the user's folder.
- **Verify with unit tests on pure logic**, not just types: tests caught the Shopee/Singapore Airlines
  bug, the 9500-class corruption, cap-math regressions, and date-inference edge cases.
- **Update data at the source**: promos live in promos.json (canonical), bundled TS is just the offline
  fallback. One file to update monthly ("update the promos" → research MileLion → edit → push).

## 5. Current backlog (as of 10 Jun 2026)

1. Auto-refresh promo feed: monthly scheduled task → MileLion roundup → update promos.json → push
   (needs long-lived fine-grained GitHub PAT).
2. Balances / redemption progress view ("80% to Tokyo") — top pick from PM review.
3. Staleness nudges: feed >45 days old banner; no-transactions-in-10-days warning.
4. Device sync / transfer beyond manual export-import (encrypted file sync or QR transfer).
5. Share button on "tell a friend" promos (copy summary line).
6. Brainstorm leftovers: hero top-pick promo card, urgency countdown chips, travel equivalences.
7. First-run aha-moment: show best-card-per-category + one promo rec immediately after onboarding.
8. iOS startup images (apple-touch-startup-image) for a fully branded cold start.
