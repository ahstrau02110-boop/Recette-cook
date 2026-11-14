import { modes } from '../data/index.js';

// Icônes des modes Cookeo (null = préparation hors appareil)
const ICONS = { pression: '🔒', vapeur: '💨', dorer: '🔥', mijoter: '🫕', cuisson_douce: '🌙', rechauffer: '♨️' };

export function modeInfo(step) {
  if (!step.mode) return { id: 'prep', icon: '🔪', nom: 'Préparation', détail: 'Hors Cookeo' };
  const m = modes.get(step.mode);
  return {
    id: step.mode,
    icon: ICONS[step.mode] ?? '✦',
    nom: m.nom + (step.niveau ? ` · ${step.niveau}` : ''),
    détail: m.usage
  };
}

export const fmtDuration = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? String(min % 60).padStart(2, '0') : ''}` : `${min} min`);
export const fmtClock = (s) => {
  s = Math.max(0, Math.ceil(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
};
