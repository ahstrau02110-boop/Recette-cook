// Mode d'emploi Cookeo+ détaillé pour une étape (réglage, temps, précautions)
import { fmtDuration } from './modes.js';
import { cookeo } from '../data/index.js';

const SWELLING = ['riz', 'riz_rond', 'pates', 'spaghetti', 'semoule', 'boulgour', 'quinoa', 'lentilles_vertes', 'lentilles_corail', 'pois_casses', 'haricots_blancs', 'haricots_rouges', 'pois_chiches'];
const AUTO_WARM = new Set(['pression', 'vapeur', 'cuisson_douce']);

export function cookeoGuide(recipe, index) {
  const step = recipe.étapes[index];
  if (!step.mode) return [];
  const dur = step.minuteur_s ? fmtDuration(Math.max(1, Math.round(step.minuteur_s / 60))) : null;
  const lines = [];
  switch (step.mode) {
    case 'dorer':
      lines.push(`Sélectionnez Dorer${step.niveau ? ` niveau ${step.niveau}` : ''}, couvercle ouvert. Laissez chauffer la cuve 2 à 3 min avant d’ajouter les aliments.`);
      lines.push('Remuez avec une spatule en bois ou silicone pour ne pas rayer la cuve.');
      break;
    case 'pression':
      lines.push('Avant de fermer, grattez le fond pour décoller les sucs : un fond attaché peut empêcher la montée en pression.');
      lines.push(`Fermez et verrouillez le couvercle, sélectionnez Cuisson sous pression${dur ? ` et réglez ${dur}` : ''}.`);
      lines.push('Le décompte démarre une fois la pression atteinte (5 à 10 min de montée selon la quantité).');
      lines.push('La pression est relâchée automatiquement : attendez le déverrouillage du couvercle avant d’ouvrir.');
      if (recipe.ingrédients.some((i) => SWELLING.includes(i.nom))) lines.push('Ne dépassez pas la moitié de la cuve : riz, pâtes et légumineuses gonflent et moussent.');
      break;
    case 'vapeur':
      lines.push('Versez au moins 30 cl d’eau dans la cuve et placez les aliments dans le panier vapeur, sans qu’ils touchent l’eau.');
      lines.push(`Fermez et verrouillez le couvercle, sélectionnez Vapeur${dur ? ` et réglez ${dur}` : ''}. Le temps démarre quand la vapeur est produite.`);
      break;
    case 'mijoter':
      lines.push(`Sélectionnez Mijoter${dur ? ` (${dur})` : ''}, couvercle ouvert, et remuez régulièrement pour que rien n’attache.`);
      break;
    case 'cuisson_douce':
      lines.push(`Fermez le couvercle, sélectionnez Cuisson douce${dur ? ` et réglez ${dur}` : ''}.`);
      lines.push('Astuce : le départ différé permet d’avoir le plat prêt à votre retour.');
      break;
    case 'rechauffer':
      lines.push('Sélectionnez Réchauffer et remuez souvent : la chaleur douce fait fondre sans brûler.');
      break;
  }
  const lastCooking = recipe.étapes.findLastIndex((e) => e.mode) === index;
  if (lastCooking && AUTO_WARM.has(step.mode)) lines.push(`En fin de cuisson, le Cookeo passe en maintien au chaud (${cookeo.automatique.maintien_au_chaud.replace(/^auto en fin de cuisson, /, '')}).`);
  return lines;
}
