// Filtres de recettes : temps max, régimes (tous requis), budgets, protéines et modes Cookeo (au moins un)
import { totalTime } from './matching.js';

export const DEFAULT_FILTERS = { tempsMax: null, régimes: [], budgets: [], protéines: [], modes: [], portions: null };

export const PROTÉINES = {
  volaille: ['blanc_poulet', 'cuisse_poulet', 'dinde'],
  'bœuf & agneau': ['boeuf_braiser', 'boeuf_hache', 'veau', 'agneau', 'merguez'],
  porc: ['porc_echine', 'saucisse', 'lardons', 'jambon', 'chorizo'],
  'poisson & mer': ['saumon', 'poisson_blanc', 'thon', 'crevettes', 'moules'],
  'œufs & tofu': ['oeuf', 'tofu']
};

const required = (r) => r.ingrédients.filter((i) => !i.optionnel).map((i) => i.nom);
export const hasProtein = (r, p) => required(r).some((id) => PROTÉINES[p]?.includes(id));
export const usesMode = (r, m) => r.étapes.some((e) => e.mode === m);

export function filterRecipes(recipes, filters = DEFAULT_FILTERS) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return recipes.filter(
    (r) =>
      (!f.tempsMax || totalTime(r) <= f.tempsMax) &&
      f.régimes.every((x) => r.régime.includes(x)) &&
      (!f.budgets.length || f.budgets.includes(r.budget)) &&
      (!f.protéines.length || f.protéines.some((p) => hasProtein(r, p))) &&
      (!f.modes.length || f.modes.some((m) => usesMode(r, m)))
  );
}

/** Nombre de critères actifs (pour le badge du bouton Filtres) */
export const activeCount = (filters) => {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return (f.tempsMax ? 1 : 0) + f.régimes.length + f.budgets.length + f.protéines.length + f.modes.length + (f.portions ? 1 : 0);
};

const BUDGET_RANK = { '€': 1, '€€': 2, '€€€': 3 };
/** Tris du catalogue */
export const SORTS = {
  az: { label: 'A → Z', cmp: (a, b) => a.recipe.nom.localeCompare(b.recipe.nom, 'fr') },
  rapide: { label: 'Plus rapide', cmp: (a, b) => totalTime(a.recipe) - totalTime(b.recipe) },
  budget: { label: 'Moins cher', cmp: (a, b) => BUDGET_RANK[a.recipe.budget] - BUDGET_RANK[b.recipe.budget] || totalTime(a.recipe) - totalTime(b.recipe) },
  faisable: { label: 'Plus faisable', cmp: (a, b) => a.missing.length - b.missing.length || b.score - a.score }
};
