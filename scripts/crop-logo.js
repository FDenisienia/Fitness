/**
 * Recorta el logo eliminando el espacio vacío (negro) interno.
 * Ajusta la imagen al contenido visual real.
 */
import sharp from 'sharp';
import { unlinkSync, renameSync } from 'fs';
import { join } from 'path';

const logoPath = join(process.cwd(), 'public', 'logo-athlento.png');

async function cropLogo() {
  const image = sharp(logoPath);
  const metadata = await image.metadata();
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  // Considerar "contenido" solo píxeles claros (blanco, naranja) - no negro/fondo
  const hasContent = (r, g, b, a) => (r > 40 || g > 40 || b > 40) && (channels === 3 || a > 50);

  let minX = width, minY = height, maxX = 0, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;

      if (hasContent(r, g, b, a)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const padding = 2;
  const cropLeft = Math.max(0, minX - padding);
  const cropTop = Math.max(0, minY - padding);
  const cropWidth = Math.min(width - cropLeft, maxX - minX + 1 + padding * 2);
  const cropHeight = Math.min(height - cropTop, maxY - minY + 1 + padding * 2);

  await sharp(logoPath)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .png()
    .toFile(logoPath + '.tmp');

  unlinkSync(logoPath);
  renameSync(logoPath + '.tmp', logoPath);

  console.log(`Logo recortado: ${width}x${height} → ${cropWidth}x${cropHeight}`);
  console.log(`Bordes eliminados: left=${cropLeft}, top=${cropTop}`);
}

cropLogo().catch(console.error);
