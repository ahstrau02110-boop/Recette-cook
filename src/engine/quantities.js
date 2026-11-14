// Recalcul et affichage des quantités selon le nombre de portions

const FINE = new Set(['g', 'ml']);
const HUNDREDTHS = new Set(['kg', 'l']);
const WHOLE = new Set(['cl', 'pincée', 'feuille']);

/** Arrondi adapté à l'unité (5 g près, demi-pièce, etc.) */
export function roundQuantity(v, unit) {
  if (FINE.has(unit)) return v >= 100 ? Math.round(v / 10) * 10 : Math.max(5, Math.round(v / 5) * 5);
  if (HUNDREDTHS.has(unit)) return Math.round(v * 20) / 20;
  if (WHOLE.has(unit)) return Math.max(1, Math.round(v));
  return Math.max(0.25, Math.round(v * 4) / 4); // pièces, cs, cc, gousses… au quart près
}

export function scaleQuantity(q, unit, from, to) {
  if (q == null || from === to) return q;
  return roundQuantity((q * to) / from, unit);
}

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

/** 1.5 -> "1½", 0.25 -> "¼", 1.05 -> "1,05" */
export function formatNumber(n) {
  const int = Math.floor(n);
  const frac = Math.round((n - int) * 100) / 100;
  if (frac === 0) return String(int);
  if (FRACTIONS[frac]) return (int || '') + FRACTIONS[frac];
  return String(n).replace('.', ',');
}

/** Libellé complet : "2 gousses", "400 g", "selon goût" */
export function formatQuantity(q, unit) {
  if (q == null) return unit || '';
  const n = formatNumber(q);
  if (!unit) return n;
  const plural = q > 1 && /^(gousse|tranche|feuille|branche|boîte|cube|sachet|pot|bouquet|pincée)\b/.test(unit);
  return `${n} ${plural ? unit.replace(/^(\S+)/, '$1s') : unit}`;
}
