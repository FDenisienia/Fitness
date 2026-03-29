/**
 * Exportación PDF rutinas Athlento — una sola hoja A4 con logo grande en portada.
 * El cuerpo (título, tarjetas, ejercicios) escala con factor `contentScale` para caber;
 * el logo de página 1 no se reduce (tamaño hero acorde a la marca).
 */

import { jsPDF } from 'jspdf';

export const PDF_BRAND_NAME = import.meta.env.VITE_APP_BRAND_NAME || 'Athlento';
export const PDF_TAGLINE = 'Entrená inteligente';

const COL = {
  bgRoot: [13, 13, 13],
  bgCard: [26, 26, 26],
  bgSurface: [46, 46, 46],
  text: [247, 247, 245],
  muted: [224, 224, 220],
  dim: [168, 168, 162],
  accent: [255, 92, 0],
  onAccent: [255, 255, 255],
  border: [46, 46, 46],
  borderSubtle: [30, 30, 30],
};

function fillPageBackground(doc) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...COL.bgRoot);
  doc.rect(0, 0, w, h, 'F');
}

/** Márgenes compactos para maximizar espacio útil en 1 hoja */
const M = { L: 8, R: 8, T: 6, B: 6 };
const FOOTER_H = 7;

const contentBottomMm = () => 297 - M.B - FOOTER_H;

const GAP_AFTER_EXERCISE = 2.2;
const AFTER_BLOCK_BAND = 3.5;
const BLOCK_BAND_H = 6.5;

function groupExercisesBySession(exercises) {
  const sorted = [...(exercises || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  if (!sorted.length) return [{ day: 1, exercises: [] }];
  const map = new Map();
  for (const ex of sorted) {
    const s = Math.max(1, ex.sessionIndex ?? ex.session ?? 1);
    if (!map.has(s)) map.set(s, []);
    map.get(s).push(ex);
  }
  const keys = [...map.keys()].sort((a, b) => a - b);
  return keys.map((k) => ({ day: k, exercises: map.get(k) }));
}

function getLevelLabel(level) {
  const l = String(level || '').toLowerCase();
  return { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' }[l] || level || '—';
}

function capFirst(s) {
  if (!s) return '—';
  const t = String(s);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

async function loadLogoDataUrl() {
  const path = `${import.meta.env.BASE_URL}logo-athlento.png`.replace(/\/+/g, '/');
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function loadImageNaturalSize(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve({ w: 0, h: 0 });
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = dataUrl;
  });
}

/**
 * Logo portada: tamaño “hero” (alto similar al bloque ATHLENTO + subtítulo).
 * Referencia UI: logo a la izquierda, altura comparable a las dos líneas de texto.
 */
function getPrimaryLogoMm(natW, natH) {
  if (!natW || !natH) return { w: 72, h: 28 };
  const maxW = 78;
  const maxH = 34;
  const ratio = natH / natW;
  let w = maxW;
  let h = w * ratio;
  if (h > maxH) {
    h = maxH;
    w = h / ratio;
  }
  return { w, h };
}

function measureFirstPageHeaderBottomMm(logoMm, hasLogo) {
  let y = M.T;
  if (hasLogo && logoMm.w > 0) {
    y += Math.max(logoMm.h, 16) + 3;
  } else {
    y += 16;
  }
  return y + 4;
}

const gy = (n, k) => n * k;
const fs = (n, k) => Math.max(5.2, n * k);

function exerciseCardHeightMm(doc, ex, innerW, k) {
  const innerCardW = innerW - 6;
  let lineY = gy(9.5, k);
  if (ex.muscleGroup) lineY += gy(3.8, k);
  if (ex.time) lineY += gy(3.8, k);
  lineY += gy(3.4, k) + gy(5.2, k);
  if (ex.videoUrl) lineY += gy(4.8, k);
  if (ex.observations) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(fs(7.8, k));
    const lines = doc.splitTextToSize(`Nota: ${ex.observations}`, innerCardW - 2);
    lineY += lines.length * gy(3.8, k);
    doc.setFont('helvetica', 'normal');
  }
  return Math.max(lineY + gy(3, k), gy(12, k));
}

function sumBlockContentHeightMm(doc, dayExs, innerW, k) {
  let s = gy(BLOCK_BAND_H, k) + gy(AFTER_BLOCK_BAND, k);
  for (const ex of dayExs) {
    s += exerciseCardHeightMm(doc, ex, innerW, k) + gy(GAP_AFTER_EXERCISE, k);
  }
  return s;
}

function estimateMetaCardHeightMm(coachLine, k) {
  let h = gy(3.5, k) + gy(4.5, k) + gy(4.5, k);
  if (coachLine) h += gy(4.2, k);
  h += gy(4.2, k) * 3;
  h += gy(3.5, k);
  return h;
}

/**
 * Altura total del contenido bajo el header (sin header), con escala k.
 */
function estimateTotalBodyHeightMm(doc, routine, innerW, k, coachLine) {
  let y = 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fs(17, k));
  const titleLines = doc.splitTextToSize(routine.name || 'Rutina', innerW);
  y += titleLines.length * gy(6.8, k) + gy(2.5, k);

  y += estimateMetaCardHeightMm(coachLine, k) + gy(4, k);

  if (routine.description?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs(9, k));
    const dLines = doc.splitTextToSize(routine.description.trim(), innerW);
    y += gy(4, k) + dLines.length * gy(3.8, k) + gy(3.5, k);
  }

  y += gy(6, k);

  const dayBlocks = groupExercisesBySession(routine.exercises || []);
  for (const { exercises: dayExs } of dayBlocks) {
    y += sumBlockContentHeightMm(doc, dayExs, innerW, k);
  }

  const noteBodies = [];
  if (routine.recommendations?.trim()) noteBodies.push(routine.recommendations.trim());
  if (routine.warnings?.trim()) noteBodies.push(routine.warnings.trim());
  for (const body of noteBodies) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs(8.8, k));
    const split = doc.splitTextToSize(body, innerW - 4);
    y += gy(9, k) + split.length * gy(3.8, k) + gy(2.5, k);
  }

  return y;
}

function findContentScale(doc, routine, innerW, logoMm, hasLogo, coachLine) {
  const headerBottom = measureFirstPageHeaderBottomMm(logoMm, hasLogo);
  const avail = contentBottomMm() - headerBottom;
  if (avail < 40) return 0.42;

  let lo = 0.38;
  let hi = 1.0;
  let best = 0.38;
  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2;
    const est = estimateTotalBodyHeightMm(doc, routine, innerW, mid, coachLine);
    if (est <= avail) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return Math.max(0.38, Math.min(1, best));
}

function drawFooter(doc, generatedAtLabel) {
  const w = doc.internal.pageSize.getWidth();
  const yLine = 297 - M.B - 4;
  doc.setDrawColor(...COL.borderSubtle);
  doc.setLineWidth(0.15);
  doc.line(M.L, yLine, w - M.R, yLine);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COL.dim);
  doc.text(`${PDF_BRAND_NAME} · ${generatedAtLabel}`, M.L, 297 - M.B - 0.5);
  doc.text(`${PDF_TAGLINE} · 1/1`, w - M.R, 297 - M.B - 0.5, { align: 'right' });
  doc.setTextColor(...COL.text);
}

function drawBlockBand(doc, pageW, y, innerW, day, count, k) {
  const bh = gy(BLOCK_BAND_H, k);
  doc.setFillColor(...COL.bgSurface);
  doc.setDrawColor(...COL.border);
  doc.setLineWidth(0.15);
  doc.roundedRect(M.L, y, innerW, bh, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fs(10.5, k));
  doc.setTextColor(...COL.accent);
  doc.text(`Bloque ${day}`, M.L + 2, y + bh * 0.62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fs(8.2, k));
  doc.setTextColor(...COL.dim);
  doc.text(`${count} ejercicio${count !== 1 ? 's' : ''}`, pageW - M.R - 2, y + bh * 0.62, { align: 'right' });
  doc.setTextColor(...COL.text);
  return y + bh + gy(AFTER_BLOCK_BAND, k);
}

const LINK_LABEL = '▶ Ver video';

function drawExerciseCard(doc, ex, globalIndex, yStart, innerW, k) {
  const boxX = M.L;
  const boxW = innerW;
  const innerCardW = innerW - 6;
  const padL = 9;
  const baseX = boxX + padL;
  const colW = innerCardW / 3;
  const boxH = exerciseCardHeightMm(doc, ex, innerW, k);
  const r = gy(3.2, k);

  doc.setFillColor(...COL.bgCard);
  doc.setDrawColor(...COL.border);
  doc.setLineWidth(0.15);
  doc.roundedRect(boxX, yStart, boxW, boxH, 1.2, 1.2, 'FD');

  const cx = boxX + gy(5.5, k);
  const cyCirc = yStart + gy(5.8, k);
  doc.setFillColor(...COL.accent);
  doc.circle(cx, cyCirc, r, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fs(8, k));
  doc.setTextColor(...COL.onAccent);
  doc.text(String(globalIndex), cx, cyCirc + r * 0.35, { align: 'center' });
  doc.setTextColor(...COL.text);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fs(10.8, k));
  doc.text(ex.name || 'Ejercicio', boxX + padL + gy(2, k), yStart + gy(5.2, k));

  let lineY = yStart + gy(9.5, k);
  if (ex.muscleGroup) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs(7.6, k));
    doc.setTextColor(...COL.muted);
    doc.text(String(ex.muscleGroup), boxX + padL + gy(2, k), lineY);
    lineY += gy(3.8, k);
    doc.setTextColor(...COL.text);
  }
  if (ex.time) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs(7.6, k));
    doc.setTextColor(...COL.muted);
    doc.text(`Tiempo: ${ex.time}`, boxX + padL + gy(2, k), lineY);
    lineY += gy(3.8, k);
    doc.setTextColor(...COL.text);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fs(7.4, k));
  doc.setTextColor(...COL.dim);
  doc.text('Series', baseX + gy(1, k), lineY);
  doc.text('Reps', baseX + colW, lineY);
  doc.text('Descanso', baseX + colW * 2, lineY);
  lineY += gy(3.4, k);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fs(9.8, k));
  doc.setTextColor(...COL.text);
  doc.text(String(ex.sets ?? '—'), baseX + gy(1, k), lineY);
  doc.text(ex.reps != null && ex.reps !== '' ? String(ex.reps) : '—', baseX + colW, lineY);
  doc.text(ex.rest != null && ex.rest !== '' ? String(ex.rest) : '—', baseX + colW * 2, lineY);
  lineY += gy(5.2, k);

  if (ex.videoUrl) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fs(8.8, k));
    doc.setTextColor(...COL.accent);
    doc.text(LINK_LABEL, baseX + gy(1, k), lineY);
    const tw = doc.getTextWidth(LINK_LABEL);
    doc.link(baseX + gy(1, k), lineY - gy(3.8, k), tw, gy(5, k), { url: String(ex.videoUrl) });
    lineY += gy(4.8, k);
    doc.setTextColor(...COL.text);
  }

  if (ex.observations) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(fs(7.8, k));
    doc.setTextColor(...COL.muted);
    const obsLines = doc.splitTextToSize(`Nota: ${ex.observations}`, innerCardW - 2);
    doc.text(obsLines, baseX + gy(1, k), lineY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COL.text);
  }

  return yStart + boxH;
}

function drawFirstPageHeader(doc, pageW, logoDataUrl, logoMm) {
  let y = M.T;
  if (logoDataUrl && logoMm.w > 0) {
    try {
      doc.addImage(logoDataUrl, 'PNG', M.L, y, logoMm.w, logoMm.h, undefined, 'SLOW');
    } catch {
      /* ignore */
    }
    const textX = M.L + logoMm.w + gy(4, 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...COL.accent);
    doc.text(PDF_BRAND_NAME.toUpperCase(), textX, y + logoMm.h * 0.38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...COL.text);
    doc.text('Plan de entrenamiento', textX, y + logoMm.h * 0.38 + gy(6.5, 1));
    y += Math.max(logoMm.h, 16) + 3;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...COL.accent);
    doc.text(PDF_BRAND_NAME.toUpperCase(), M.L, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...COL.text);
    doc.text('Plan de entrenamiento', M.L, y + 13);
    y += 16;
  }
  doc.setDrawColor(...COL.borderSubtle);
  doc.setLineWidth(0.25);
  doc.line(M.L, y, pageW - M.R, y);
  return y + 4;
}

export async function buildRoutinePdf(opts) {
  const { routine, displayClientName = null, coachName = null } = opts;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  fillPageBackground(doc);
  const pageW = doc.internal.pageSize.getWidth();
  const innerW = pageW - M.L - M.R;
  const generatedAtLabel = new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const logoDataUrl = await loadLogoDataUrl();
  const nat = await loadImageNaturalSize(logoDataUrl);
  const primaryLogoMm = getPrimaryLogoMm(nat.w, nat.h);
  const hasLogo = !!(logoDataUrl && primaryLogoMm.w > 0);
  const coachLine = coachName ? `Coach: ${coachName}` : null;

  const k = findContentScale(doc, routine, innerW, primaryLogoMm, hasLogo, coachLine);

  let y = drawFirstPageHeader(doc, pageW, logoDataUrl, primaryLogoMm);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fs(17, k));
  doc.setTextColor(...COL.text);
  const titleLines = doc.splitTextToSize(routine.name || 'Rutina', innerW);
  doc.text(titleLines, M.L, y);
  y += titleLines.length * gy(6.8, k) + gy(2.5, k);

  const objLabel = capFirst(routine.objective);
  const levelLabel = getLevelLabel(routine.level);
  const duration = routine.durationMinutes != null ? `~${routine.durationMinutes} min` : '—';
  const clientLine = displayClientName ? `Cliente: ${displayClientName}` : null;

  const cardTextH = estimateMetaCardHeightMm(coachLine, k);
  const cardY = y;
  doc.setFillColor(...COL.accent);
  doc.rect(M.L, cardY, 0.9, cardTextH, 'F');
  doc.setFillColor(...COL.bgCard);
  doc.setDrawColor(...COL.border);
  doc.roundedRect(M.L + 0.9, cardY, innerW - 0.9, cardTextH, 1, 1, 'FD');

  let cy = cardY + gy(3.5, k) + gy(4.5, k);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fs(10, k));
  doc.setTextColor(...COL.text);
  if (clientLine) doc.text(clientLine, M.L + gy(4, k), cy);
  else doc.text('Plan general', M.L + gy(4, k), cy);
  cy += gy(4.5, k);
  if (coachLine) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs(9, k));
    doc.setTextColor(...COL.muted);
    doc.text(coachLine, M.L + gy(4, k), cy);
    cy += gy(4.2, k);
    doc.setTextColor(...COL.text);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fs(9.5, k));
  doc.setTextColor(...COL.muted);
  doc.text(`Objetivo: ${objLabel}`, M.L + gy(4, k), cy);
  cy += gy(4.2, k);
  doc.text(`Nivel: ${levelLabel}`, M.L + gy(4, k), cy);
  cy += gy(4.2, k);
  doc.text(`Duración: ${duration}`, M.L + gy(4, k), cy);
  doc.setTextColor(...COL.text);
  y = cardY + cardTextH + gy(4, k);

  if (routine.description?.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fs(9, k));
    doc.setTextColor(...COL.text);
    doc.text('Resumen', M.L, y);
    y += gy(4, k);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs(8.8, k));
    doc.setTextColor(...COL.muted);
    const dLines = doc.splitTextToSize(routine.description.trim(), innerW);
    doc.text(dLines, M.L, y);
    y += dLines.length * gy(3.8, k) + gy(3.5, k);
    doc.setTextColor(...COL.text);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fs(12, k));
  doc.setTextColor(...COL.text);
  doc.text('Tu rutina', M.L, y);
  y += gy(6, k);

  const dayBlocks = groupExercisesBySession(routine.exercises || []);
  let globalIndex = 0;

  for (const { day, exercises: dayExs } of dayBlocks) {
    y = drawBlockBand(doc, pageW, y, innerW, day, dayExs.length, k);
    for (const ex of dayExs) {
      globalIndex += 1;
      y = drawExerciseCard(doc, ex, globalIndex, y, innerW, k) + gy(GAP_AFTER_EXERCISE, k);
    }
  }

  const notesSections = [];
  if (routine.recommendations?.trim()) {
    notesSections.push({ title: 'Notas del coach', body: routine.recommendations.trim() });
  }
  if (routine.warnings?.trim()) {
    notesSections.push({ title: 'Importante', body: routine.warnings.trim() });
  }

  for (const section of notesSections) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs(8.8, k));
    const split = doc.splitTextToSize(section.body, innerW - 4);
    const secH = gy(9, k) + split.length * gy(3.8, k) + gy(2.5, k);
    doc.setFillColor(...COL.bgCard);
    doc.setDrawColor(...COL.border);
    doc.roundedRect(M.L, y, innerW, secH, 1.2, 1.2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fs(9.8, k));
    doc.setTextColor(...COL.text);
    doc.text(section.title, M.L + gy(2.5, k), y + gy(5, k));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs(8.8, k));
    doc.setTextColor(...COL.muted);
    doc.text(split, M.L + gy(2.5, k), y + gy(9, k));
    doc.setTextColor(...COL.text);
    y += secH + gy(2, k);
  }

  doc.setPage(1);
  drawFooter(doc, generatedAtLabel);
  return doc;
}

export async function downloadRoutinePdf(opts) {
  const doc = await buildRoutinePdf(opts);
  const raw = (opts.routine?.name || 'Rutina').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
  doc.save(`${PDF_BRAND_NAME}-${raw}.pdf`);
}
