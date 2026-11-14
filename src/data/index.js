// Point d'entrée des données de l'app
import cookeo from './cookeo.json';
import ingredients from './ingredients.json';
import recipes from './recipes.json';
import substitutions from './substitutions.json';
import { createCatalog } from '../engine/catalog.js';
import { createSubstitutions } from '../engine/matching.js';

export { cookeo, recipes };
export const catalog = createCatalog(ingredients);
export const subs = createSubstitutions(substitutions);
export const modes = new Map(cookeo.modes.map((m) => [m.id, m]));
export const recipeById = new Map(recipes.map((r) => [r.id, r]));
