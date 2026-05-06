/** Input de peso: solo dígitos y un punto decimal; vacío permitido. */
export function sanitizeWeightInput(raw) {
  if (raw === '' || raw == null) return '';
  let s = String(raw).replace(',', '.');
  s = s.replace(/[^\d.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot === -1) return s;
  return s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
}
