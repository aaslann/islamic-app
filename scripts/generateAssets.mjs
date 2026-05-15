/**
 * Generates app icon (1024x1024) and splash screen (2048x2048) PNG files
 * using sharp + inline SVG.  Run once with: node scripts/generateAssets.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';

const GOLD  = '#C8A24A';
const GREEN = '#0F3D2E';
const BG    = '#0D1F18';

// ── Icon SVG (1024x1024) ─────────────────────────────────────────────────────
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A6648"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F0C96B"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>

  <!-- Decorative outer ring -->
  <circle cx="512" cy="512" r="420" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.15"/>
  <circle cx="512" cy="512" r="390" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.1"/>

  <!-- Crescent moon -->
  <circle cx="512" cy="490" r="200" fill="url(#gold)"/>
  <circle cx="585" cy="450" r="175" fill="url(#bg)"/>

  <!-- Star (5-pointed) -->
  <polygon
    points="750,280 762,318 802,318 771,341 783,379 750,356 717,379 729,341 698,318 738,318"
    fill="url(#gold)"/>

  <!-- App name text -->
  <text x="512" y="760" font-family="Georgia, serif" font-size="72" font-weight="bold"
        fill="${GOLD}" text-anchor="middle" letter-spacing="2">İslami</text>
  <text x="512" y="840" font-family="Georgia, serif" font-size="52"
        fill="rgba(255,255,255,0.7)" text-anchor="middle" letter-spacing="4">ASİSTAN</text>
</svg>`;

// ── Splash SVG (2048x2048) ───────────────────────────────────────────────────
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048">
  <defs>
    <linearGradient id="sbg" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#1A6648"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
    <linearGradient id="sgold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F0C96B"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>

  <rect width="2048" height="2048" fill="url(#sbg)"/>

  <!-- Decorative rings -->
  <circle cx="1024" cy="1024" r="700" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.1"/>
  <circle cx="1024" cy="1024" r="600" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.08"/>

  <!-- Crescent -->
  <circle cx="1024" cy="960" r="320" fill="url(#sgold)"/>
  <circle cx="1120" cy="905" r="280" fill="url(#sbg)"/>

  <!-- Star -->
  <polygon
    points="1380,480 1400,540 1464,540 1412,578 1432,638 1380,600 1328,638 1348,578 1296,540 1360,540"
    fill="url(#sgold)"/>

  <!-- Title -->
  <text x="1024" y="1430" font-family="Georgia, serif" font-size="130" font-weight="bold"
        fill="${GOLD}" text-anchor="middle" letter-spacing="4">İslami</text>
  <text x="1024" y="1560" font-family="Georgia, serif" font-size="90"
        fill="rgba(255,255,255,0.65)" text-anchor="middle" letter-spacing="8">ASİSTAN</text>

  <!-- Tagline -->
  <text x="1024" y="1650" font-family="Helvetica, sans-serif" font-size="52"
        fill="rgba(255,255,255,0.35)" text-anchor="middle">Günlük ibadetlerin için rehber</text>
</svg>`;

async function generate() {
  console.log('Generating app icon (1024×1024)...');
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile('assets/icon.png');

  console.log('Generating splash screen (2048×2048)...');
  await sharp(Buffer.from(splashSvg))
    .resize(2048, 2048)
    .png()
    .toFile('assets/splash-icon.png');

  console.log('Generating Android adaptive foreground (1024×1024)...');
  // For adaptive icon, the foreground is centered on transparent background
  const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#F0C96B"/><stop offset="100%" stop-color="${GOLD}"/>
      </linearGradient>
    </defs>
    <circle cx="430" cy="490" r="200" fill="url(#g)"/>
    <circle cx="503" cy="450" r="175" fill="rgba(13,31,24,0)"/>
    <polygon points="680,280 692,318 732,318 701,341 713,379 680,356 647,379 659,341 628,318 668,318" fill="url(#g)"/>
  </svg>`;

  await sharp(Buffer.from(fgSvg))
    .resize(1024, 1024)
    .png()
    .toFile('assets/android-icon-foreground.png');

  console.log('Generating Android adaptive background (1024×1024)...');
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <defs>
      <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1A6648"/><stop offset="100%" stop-color="${BG}"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#b)"/>
  </svg>`;
  await sharp(Buffer.from(bgSvg)).resize(1024, 1024).png().toFile('assets/android-icon-background.png');

  console.log('Generating favicon (48×48)...');
  await sharp(Buffer.from(iconSvg)).resize(48, 48).png().toFile('assets/favicon.png');

  console.log('✅ All assets generated successfully!');
}

generate().catch((e) => { console.error('Error:', e.message); process.exit(1); });
