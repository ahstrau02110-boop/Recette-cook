// Actions partagées sur une recette : portions choisies, ajout des manquants aux courses
import { filterStore, shoppingStore } from './state.js';
import { scaleQuantity } from './engine/quantities.js';

// Portions choisies par recette (session), partagées entre fiche, cartes et mode cuisine
const chosen = new Map();
export const portionsFor = (r) => chosen.get(r.id) ?? filterStore.get().portions ?? r.portions;
export const setPortionsFor = (r, n) => chosen.set(r.id, n);

/** Ajoute les ingrédients obligatoires manquants (quantités adaptées) ; renvoie leur nombre */
export function addMissingToShopping(r, match, portions = portionsFor(r)) {
  const needs = r.ingrédients
    .filter((i) => match.missing.includes(i.nom))
    .map((i) => ({ nom: i.nom, unité: i.unité, quantité: scaleQuantity(i.quantité, i.unité, r.portions, portions) }));
  if (needs.length) shoppingStore.add(needs, r.id);
  return needs.length;
}
