// One-off icon generator: rasterizes scripts/icon-source.svg into the PNG
// sizes the PWA + iOS need, writing them into public/.
// Run with: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const svg = readFileSync(join(here, 'icon-source.svg'));
const pub = join(root, 'public');

const dirt = { r: 0x3b, g: 0x2a, b: 0x1a, alpha: 1 }; // --dirt, opaque (iOS needs no alpha)

const targets = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  // Maskable: same art, padded onto a full-bleed dirt square so the safe zone holds.
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  // iOS Home Screen icon — must be opaque, 180x180.
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32x32.png', size: 32 },
];

for (const t of targets) {
  let img;
  if (t.maskable) {
    // Render art at 80% and center it on a dirt background (10% padding each side).
    const inner = Math.round(t.size * 0.8);
    const art = await sharp(svg).resize(inner, inner).png().toBuffer();
    img = sharp({ create: { width: t.size, height: t.size, channels: 4, background: dirt } })
      .composite([{ input: art, gravity: 'center' }]);
  } else {
    img = sharp(svg).resize(t.size, t.size).flatten({ background: dirt });
  }
  await img.png().toFile(join(pub, t.file));
  console.log('wrote', t.file, `(${t.size}px${t.maskable ? ', maskable' : ''})`);
}

// Crisp SVG favicon too.
import { copyFileSync } from 'node:fs';
copyFileSync(join(here, 'icon-source.svg'), join(pub, 'favicon.svg'));
console.log('wrote favicon.svg');
