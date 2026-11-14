// Moteur de correspondance garde-manger -> recettes

/** Table de substitutions : id manquant -> [{ avec: [ids], note }] */
export function createSubstitutions(list) {
  const map = new Map();
  for (const s of list) map.set(s.ingrédient, s.alternatives.map((avec) => ({ avec, note: s.note ?? null })));
  return map;
}

/**
 * Évalue une recette face au garde-manger.
 * Les ingrédients optionnels ne bloquent jamais ; une substitution n'est retenue
 * que si toutes ses pièces sont présentes.
 */
export function matchRecipe(recipe, pantry, subs = new Map()) {
  const present = [];
  const substituted = [];
  const missing = [];
  let optionalPresent = 0;
  let required = 0;

  for (const ing of recipe.ingrédients) {
    if (ing.optionnel) {
      if (pantry.has(ing.nom)) optionalPresent++;
      continue;
    }
    required++;
    if (pantry.has(ing.nom)) {
      present.push(ing.nom);
      continue;
    }
    const alt = subs.get(ing.nom)?.find((a) => a.avec.every((id) => pantry.has(id)));
    if (alt) substituted.push({ ingrédient: ing.nom, avec: alt.avec, note: alt.note });
    else missing.push(ing.nom);
  }

  // Score sur 100 : présent = 1, substitué = 0,8 ; bonus léger pour les optionnels
  const base = required ? (present.length + substituted.length * 0.8) / required : 1;
  const score = Math.round(base * 100 + optionalPresent * 2);

  return { recipe, complete: missing.length === 0, present, substituted, missing, optionalPresent, score };
}

/**
 * Classe les recettes : d'abord 100 % faisables, puis par nombre de manquants,
 * puis par score, moins de substitutions, temps total.
 * Exclut les recettes sans aucun ingrédient disponible.
 */
export function rankRecipes(recipes, pantry, subs, { maxMissing = Infinity } = {}) {
  return recipes
    .map((r) => matchRecipe(r, pantry, subs))
    .filter((m) => m.missing.length <= maxMissing && m.present.length + m.substituted.length > 0)
    .sort(
      (a, b) =>
        a.missing.length - b.missing.length ||
        b.score - a.score ||
        a.substituted.length - b.substituted.length ||
        totalTime(a.recipe) - totalTime(b.recipe) ||
        a.recipe.nom.localeCompare(b.recipe.nom, 'fr')
    );
}

/** Regroupe un classement : { complètes, parManquants: Map(n -> résultats) } */
export function groupByMissing(results) {
  const complètes = [];
  const parManquants = new Map();
  for (const r of results) {
    if (r.complete) complètes.push(r);
    else {
      const n = r.missing.length;
      if (!parManquants.has(n)) parManquants.set(n, []);
      parManquants.get(n).push(r);
    }
  }
  return { complètes, parManquants };
}

export const totalTime = (r) => r.temps_prépa + r.temps_cuisson;
