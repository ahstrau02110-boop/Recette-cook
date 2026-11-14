// Filtres de recettes : temps max, régimes (tous requis), budgets (au moins un)
import { totalTime } from './matching.js';

export const DEFAULT_FILTERS = { tempsMax: null, régimes: [], budgets: [], portions: null };

export function filterRecipes(recipes, f = DEFAULT_FILTERS) {
  return recipes.filter(
    (r) =>
      (!f.tempsMax || totalTime(r) <= f.tempsMax) &&
      f.régimes.every((x) => r.régime.includes(x)) &&
      (!f.budgets.length || f.budgets.includes(r.budget))
  );
}

/** Nombre de critères actifs (pour le badge du bouton Filtres) */
export const activeCount = (f) => (f.tempsMax ? 1 : 0) + f.régimes.length + f.budgets.length + (f.portions ? 1 : 0);
