/**
 * Elimina el fondo oscuro del logo PNG, dejando solo el logo con transparencia.
 */
import sharp from 'sharp';
import { join } from 'path';
import { renameSync, unlinkSync } from 'fs';

const logoPath = join(process.cwd(), 'public', 'logo-athlento.png');
const tmpPath = join(process.cwd(), 'public', 'logo-athlento-tmp.png');

async function removeBackground() {
  const image = sharp(logoPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const newData = Buffer.from(data);

  // Umbral: píxeles con r,g,b bajos = fondo oscuro (eliminar). #212121=33, #1a1a1a=26
  const BG_THRESHOLD = 85; // Más alto para eliminar grises claros y antialiasing

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = newData[i];
      const g = newData[i + 1];
      const b = newData[i + 2];

      // Si es fondo oscuro (gris/negro), hacer transparente
      if (r < BG_THRESHOLD && g < BG_THRESHOLD && b < BG_THRESHOLD) {
        newData[i + 3] = 0;
      }
    }
  }

  await sharp(newData, {
    raw: { width, height, channels },
  })
    .png()
    .toFile(tmpPath);

  unlinkSync(logoPath);
  renameSync(tmpPath, logoPath);

  console.log('Fondo del logo eliminado. Logo guardado con transparencia.');
}

removeBackground().catch(console.error);
