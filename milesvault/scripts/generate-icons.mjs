import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharp = require(path.join(__dirname, '..', 'node_modules', 'sharp'));

const outDir = path.join(__dirname, '..', 'public', 'icons');

const planeSvg = (scale = 1, rounded = true) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${rounded
    ? '<rect width="512" height="512" rx="96" fill="#111827"/>'
    : '<rect width="512" height="512" fill="#111827"/>'}
  <g transform="translate(256,260) scale(${scale}) rotate(-30)">
    <!-- Fuselage -->
    <ellipse cx="0" cy="0" rx="28" ry="110" fill="white"/>
    <!-- Wings -->
    <path d="M -10,-10 L -170,60 L -170,90 L -10,30 Z" fill="white" opacity="0.9"/>
    <path d="M 10,-10 L 170,60 L 170,90 L 10,30 Z" fill="white" opacity="0.9"/>
    <!-- Tail -->
    <path d="M -14,75 L -80,110 L -80,130 L -14,110 Z" fill="white" opacity="0.85"/>
    <path d="M 14,75 L 80,110 L 80,130 L 14,110 Z" fill="white" opacity="0.85"/>
  </g>
</svg>`;

async function generate() {
  const svgBuf     = Buffer.from(planeSvg(1.0, true));
  const maskableBuf = Buffer.from(planeSvg(0.72, false));

  await sharp(svgBuf).resize(192,192).png().toFile(`${outDir}/icon-192.png`);
  console.log('✓ icon-192.png');

  await sharp(svgBuf).resize(512,512).png().toFile(`${outDir}/icon-512.png`);
  console.log('✓ icon-512.png');

  await sharp(maskableBuf).resize(512,512).png().toFile(`${outDir}/icon-512-maskable.png`);
  console.log('✓ icon-512-maskable.png');

  await sharp(svgBuf).resize(180,180).png().toFile(`${outDir}/apple-touch-icon.png`);
  console.log('✓ apple-touch-icon.png');

  await sharp(svgBuf).resize(32,32).png().toFile(`${outDir}/favicon-32.png`);
  console.log('✓ favicon-32.png');
}

generate().catch(console.error);
