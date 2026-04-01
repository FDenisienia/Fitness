/**
 * Genera favicon y apple-touch-icon desde public/favicon-source.png (logo A con fondo oscuro).
 * Fondo → transparente, recorte al icono, escala. Regenerar: npm run build:favicon
 */
import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const publicDir = join(process.cwd(), 'public');

function bboxNonTransparent(data, width, height, channels) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const a = channels === 4 ? data[i + 3] : 255;
      if (a > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX) return null;
  return { minX, minY, maxX, maxY };
}

async function main() {
  const srcPath = join(publicDir, 'favicon-source.png');
  if (!existsSync(srcPath)) {
    console.error('Falta public/favicon-source.png (PNG del icono con fondo oscuro).');
    process.exit(1);
  }
  const input = readFileSync(srcPath);

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const newData = Buffer.from(data);
  const BG = 55;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = newData[i];
      const g = newData[i + 1];
      const b = newData[i + 2];
      if (r < BG && g < BG && b < BG) {
        newData[i + 3] = 0;
      }
    }
  }

  const box = bboxNonTransparent(newData, width, height, channels);
  if (!box) {
    console.error('No se encontró contenido opaco tras quitar el fondo.');
    process.exit(1);
  }

  const pad = 1;
  const left = Math.max(0, box.minX - pad);
  const top = Math.max(0, box.minY - pad);
  const w = Math.min(width - left, box.maxX - box.minX + 1 + pad * 2);
  const h = Math.min(height - top, box.maxY - box.minY + 1 + pad * 2);

  const cropped = await sharp(newData, { raw: { width, height, channels } })
    .extract({ left, top, width: w, height: h })
    .png()
    .toBuffer();

  // Margen transparente para que el logo no toque el borde (la pestaña no recorte la punta).
  const meta = await sharp(cropped).metadata();
  const side = Math.max(meta.width || w, meta.height || h);
  const safePad = Math.max(2, Math.round(side * 0.08));
  const padded = await sharp(cropped)
    .extend({
      top: safePad,
      bottom: safePad,
      left: safePad,
      right: safePad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const out32 = join(publicDir, 'favicon.png');
  const out48 = join(publicDir, 'favicon-48.png');
  const outApple = join(publicDir, 'apple-touch-icon.png');

  // contain = logo entero visible (cover recortaba la parte superior del icono).
  const resizeOpts = {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  };

  await sharp(padded).resize(32, 32, resizeOpts).png().toFile(out32);

  await sharp(padded).resize(48, 48, resizeOpts).png().toFile(out48);

  await sharp(padded).resize(180, 180, resizeOpts).png().toFile(outApple);

  console.log(`Favicon regenerado: ${w}x${h} recorte → 32/48/180 px (contain + margen), fondo transparente.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
