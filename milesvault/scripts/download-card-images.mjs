/**
 * MilesVault — Card Image Downloader
 *
 * Downloads card images and saves them to /public/cards/{card-id}.webp
 * Run once: npm run download-images
 *
 * Image source: The MileLion's media library (real card faces, verified
 * working June 2026). Images are saved with a .webp extension regardless
 * of the source format — browsers and Next.js detect the real format from
 * the file contents, so this is fine.
 *
 * NOTE: a few entries are "pair" shots covering two card variants
 * (PRVI Miles Visa/Amex, Lady's/Lady's Solitaire, OCBC 90°N MC/Visa).
 * Replace manually with single-card images if you prefer.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '..', 'public', 'cards');

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const ML = 'https://milelion.com/wp-content/uploads';

const CARD_IMAGES = [
  // ── Citibank ──────────────────────────────────────────────
  { id: 'citi-rewards',          url: `${ML}/2020/05/citi-rewards-transparent-8.png` },
  { id: 'citi-premiermiles',     url: `${ML}/2020/05/citi-premiermiles-transparent-2.png`, fallbackUrl: `${ML}/2020/02/citi-premiermiles-card-3.png` },
  { id: 'citi-prestige',         url: `${ML}/2020/05/citi-prestige-3.jpg` },
  // ── DBS ───────────────────────────────────────────────────
  { id: 'dbs-womans-world',      url: `${ML}/2020/01/DBS-Womans-World-1-1.jpg` },
  { id: 'dbs-altitude-visa',     url: `${ML}/2020/06/dbs-altitude.png` },
  { id: 'dbs-altitude-amex',     url: `${ML}/2022/07/dbs-altitude-visa-amex.jpg` },
  { id: 'dbs-vantage',           url: `${ML}/2022/06/dbs-vantage-transparent.png` },
  // ── UOB ───────────────────────────────────────────────────
  { id: 'uob-ppv',               url: `${ML}/2026/03/uob-preferred-visa.jpg` },
  { id: 'uob-ladys-card',        url: `${ML}/2023/05/uob-lady-card-pair.jpg` },           // pair shot
  { id: 'uob-ladys-solitaire',   url: `${ML}/2023/05/uob-lady-card-pair.jpg` },           // pair shot
  { id: 'uob-prvi-miles-visa',   url: `${ML}/2022/04/uob-prvi-miles-cards.jpg` },         // pair shot
  { id: 'uob-prvi-miles-amex',   url: `${ML}/2022/04/uob-prvi-miles-cards.jpg` },         // pair shot
  { id: 'uob-visa-infinite-metal', url: `${ML}/2020/01/uob-visa-infinite-metal.jpg` },
  { id: 'uob-visa-signature',    url: `${ML}/2017/12/uob-visa-signature-card.png` },
  { id: 'krisflyer-uob',         url: `${ML}/2020/03/uob-krisflyer.jpg` },
  // ── HSBC ──────────────────────────────────────────────────
  { id: 'hsbc-travelone',        url: `${ML}/2023/05/HSBC-TravelOne_Vertical-Full-compressed.jpg` },
  { id: 'hsbc-revolution',       url: `${ML}/2026/03/hsbc-revo-new.png`, fallbackUrl: `${ML}/2020/02/revolution.jpg` },
  { id: 'hsbc-visa-infinite',    url: `${ML}/2019/03/hsbc-vi.jpg` },
  // ── Standard Chartered ────────────────────────────────────
  { id: 'sc-journey',            url: `${ML}/2023/05/Journey-Card.png` },
  { id: 'sc-visa-infinite',      url: `${ML}/2017/12/image_standard-chartered-visa-infinite402x02.png`, fallbackUrl: `${ML}/2019/03/scb-vi.jpg` },
  // ── Maybank ───────────────────────────────────────────────
  { id: 'maybank-world-mc',      url: `${ML}/2020/01/maybank-world-mastercard.jpg` },
  { id: 'maybank-horizon',       url: `${ML}/2020/04/maybank-horizon.jpg` },
  { id: 'maybank-xl-rewards',    url: `${ML}/2025/07/xl_rewards.jpg` },
  // ── Amex ──────────────────────────────────────────────────
  { id: 'amex-krisflyer',        url: `${ML}/2020/05/amex-kfcc-new.png` },
  { id: 'amex-krisflyer-ascend', url: `${ML}/2020/05/amex-kfa-new.png` },
  { id: 'amex-platinum-charge',  url: `${ML}/2020/05/amex-platinum-charge-card.png` },
  // ── OCBC ──────────────────────────────────────────────────
  { id: 'ocbc-90n-mc',           url: `${ML}/2022/08/ocbc-90n-cards.jpg` },               // pair shot
  { id: 'ocbc-90n-visa',         url: `${ML}/2022/08/ocbc-90n-cards.jpg` },               // pair shot
  { id: 'ocbc-voyage',           url: `${ML}/2021/03/OCBC-VOYAGE-BLUE-Name-Only-Merge-LR.jpg` },
  { id: 'ocbc-rewards',          url: `${ML}/2024/01/ocbc-rewards-card-3.jpg` },
  // ── Instarem ──────────────────────────────────────────────
  { id: 'instarem-amaze',        url: `${ML}/2022/01/amaze-crmc.jpg` },
];

async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'image/webp,image/png,image/*,*/*',
    },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) throw new Error(`Not an image (got ${contentType})`);

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buffer);
}

async function main() {
  console.log(`\nMilesVault — Downloading card images to public/cards/\n${'─'.repeat(60)}`);

  const results = { ok: 0, failed: 0 };

  for (const card of CARD_IMAGES) {
    const dest = join(outputDir, `${card.id}.webp`);

    // Skip if already downloaded (delete the file to force a re-download)
    if (existsSync(dest)) {
      console.log(`  ✓ ${card.id} (already exists)`);
      results.ok++;
      continue;
    }

    try {
      await downloadImage(card.url, dest);
      console.log(`  ✓ ${card.id}`);
      results.ok++;
    } catch (err) {
      if (card.fallbackUrl) {
        try {
          await downloadImage(card.fallbackUrl, dest);
          console.log(`  ✓ ${card.id} (via fallback)`);
          results.ok++;
          continue;
        } catch {
          // fall through to failure
        }
      }
      console.log(`  ✗ ${card.id} — ${err.message}`);
      console.log(`    → Manually save image to: public/cards/${card.id}.webp`);
      results.failed++;
    }

    // Small delay to be polite to the server
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Done: ${results.ok} succeeded, ${results.failed} failed`);
  if (results.failed > 0) {
    console.log('\nFor failed images, save them manually as public/cards/{card-id}.webp');
    console.log('The app shows a CSS colour fallback until the image is present.\n');
  }
}

main().catch(console.error);
