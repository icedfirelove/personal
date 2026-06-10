# Reddit post draft — suggested subs: r/singaporefi, r/CreditCardsSG

---

**Title options (pick one):**

1. I built a free miles-optimiser web app that never sees your data — no signup, no card linking, works with any card network
2. Tired of guessing which card to swipe? I built MilesVault — a privacy-first miles tracker for SG cards (free, no account)
3. [Free tool] MilesVault — tells you which card to swipe, tracks your bonus caps and sign-up promos, 100% on-device

---

**Body:**

Hey everyone — I got tired of doing cap math in my head at the counter ("wait, have I burned through my Citi Rewards 4mpd cap this month?") so I built a web app for it. Sharing in case it's useful to anyone else. It's free, there's no account, and your data never leaves your phone.

**MilesVault** → [your-url].vercel.app

**What it does:**

🃏 **Which card do I swipe?** — Type "$85 din tai fung" and it ranks your cards by *effective* miles per dollar — meaning it accounts for how much of each card's monthly bonus cap you've already used. A 4mpd card with a blown cap is really a 0.4mpd card, and most tools ignore this.

🤷 **"Not sure" mode** — The genuinely novel bit. Restaurant inside a hotel — does it code as dining or hotel MCC? Often unknowable in advance. Pick both possibilities and it ranks your cards by *guaranteed worst-case miles*, flagging cards that earn the same either way ("safe either way"). No other tool I know of is honest about MCC uncertainty.

📊 **Overview** — Miles earned per card this month, how much cap headroom is left on each (with bars), and alerts when a cap is nearly full, about to reset, or a min-spend deadline is at risk.

🎯 **Sign-up promo tracker** — Current SG sign-up bonuses (verified against MileLion's roundups, pull-to-refresh for updates), with a "Recommended for you" section that filters by what you're actually eligible for: it knows new-to-bank rules (holding a Citi card? Citi NTB offers get moved to a "tell a friend" section instead), your income bracket, and whether the min spend fits your real spending pace. Track a promo and it shows progress + deadline countdown.

🧾 **Lazy logging** — Type "$300 shopee ocbc" and it parses the amount, matches your OCBC card, and knows Shopee = online spend. It learns your regular merchants from corrections. Or skip typing entirely: **import your bank statement PDF** and it extracts + categorises the transactions on-device.

🔒 **The privacy part** — No account, no database, no analytics, no card linking. Everything lives in your browser's localStorage. There's an export/import for backups and a nuke-everything button. I'm not affiliated with any bank and earn nothing if you apply for any card — so the recommendations have no thumb on the scale.

**Honest limitations** (because this sub can smell marketing from orbit):

- Logging is manual (or via statement import) — it doesn't link to your bank. That's the price of the privacy model. HeyMax's Card Maximiser auto-tracks if you're okay linking, but it's Visa-only; this works with any card.
- Card database is 26+ SG miles cards; rates verified against MileLion but banks change things — always check T&Cs before big spend.
- Data is per-device (no sync) — use the export/import to move between devices. Add to Home Screen on iOS or Safari may evict your data after 7 days of not visiting.
- One-person project, so bugs are possible. Feedback very welcome.

It's a PWA — open the link, "Add to Home Screen", and it behaves like a native app.

Would love to hear what's missing or wrong. If your hotel-restaurant coded as something cursed, tell me and I'll add it to the dictionary.

---

**Posting tips:**
- Replace [your-url] with the actual Vercel URL before posting.
- r/singaporefi may require a weekly thread for self-promo — check sub rules first.
- Have screenshots ready (Overview + Swipe with Not-sure mode are the most impressive); Reddit posts with images get ~3x engagement.
- Expect the first comment to be "how is this different from HeyMax" — answer: no card linking, works with Mastercard/Amex (HeyMax auto-track is Visa-only), no affiliate incentives, and the worst-case Not-sure mode.
