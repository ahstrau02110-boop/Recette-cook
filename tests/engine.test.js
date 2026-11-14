import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';
import { norm } from '../src/engine/text.js';
import { createCatalog } from '../src/engine/catalog.js';
import { createSubstitutions, matchRecipe, rankRecipes, groupByMissing } from '../src/engine/matching.js';
import { scaleQuantity, formatQuantity } from '../src/engine/quantities.js';

const catalog = createCatalog(load('ingredients.json'));
const recipes = load('recipes.json');
const subs = createSubstitutions(load('substitutions.json'));
const recipe = (id) => recipes.find((r) => r.id === id);
const needs = (r) => r.ingrédients.filter((i) => !i.optionnel).map((i) => i.nom);

test('normalisation', () => {
  assert.equal(norm('Œufs  Crème-fraîche'), 'oeufs creme fraiche');
});

test('recherche par synonyme et sans accents', () => {
  assert.equal(catalog.search('cabillaud')[0].id, 'poisson_blanc');
  assert.equal(catalog.search('creme')[0].id, 'creme');
  assert.equal(catalog.search('oeuf')[0].id, 'oeuf');
  assert.equal(catalog.resolve('Maïzena'), 'maizena');
  assert.equal(catalog.search('').length, catalog.all().length);
});

test('recette complète', () => {
  const r = recipe('poulet-moutarde');
  const m = matchRecipe(r, new Set(needs(r)), subs);
  assert.equal(m.complete, true);
  assert.equal(m.score, 100);
});

test('aucun ingrédient supposé présent (sel compris)', () => {
  const r = recipe('poulet-moutarde');
  const m = matchRecipe(r, new Set(needs(r).filter((i) => i !== 'sel')), subs);
  assert.deepEqual(m.missing, ['sel']);
});

test('substitution crème -> lait + beurre', () => {
  const r = recipe('poulet-moutarde');
  const pantry = new Set([...needs(r).filter((i) => i !== 'creme'), 'lait', 'beurre']);
  const m = matchRecipe(r, pantry, subs);
  assert.equal(m.complete, true);
  assert.deepEqual(m.substituted[0].avec, ['lait', 'beurre']);
  assert.ok(m.score < 100);
});

test('substitution incomplète = manquant', () => {
  const r = recipe('poulet-moutarde');
  const pantry = new Set([...needs(r).filter((i) => i !== 'creme'), 'lait']);
  assert.deepEqual(matchRecipe(r, pantry, subs).missing, ['creme']);
});

test('optionnels non bloquants, bonus de score', () => {
  const r = recipe('poulet-curry-coco');
  const base = matchRecipe(r, new Set(needs(r)), subs);
  const plus = matchRecipe(r, new Set([...needs(r), 'coriandre']), subs);
  assert.ok(base.complete && plus.score > base.score);
});

test('classement : complètes puis par manquants', () => {
  const pantry = new Set(['blanc_poulet', 'oignon', 'moutarde', 'creme', 'bouillon_volaille', 'huile', 'sel', 'poivre', 'riz']);
  const ranked = rankRecipes(recipes, pantry, subs);
  assert.equal(ranked[0].complete, true);
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].missing.length <= ranked[i].missing.length);
  const { complètes, parManquants } = groupByMissing(ranked);
  assert.ok(complètes.some((m) => m.recipe.id === 'poulet-moutarde'));
  assert.ok(parManquants.size > 0);
  assert.equal(rankRecipes(recipes, new Set(), subs).length, 0);
  assert.ok(rankRecipes(recipes, pantry, subs, { maxMissing: 1 }).every((m) => m.missing.length <= 1));
});

test('recalcul des quantités', () => {
  assert.equal(scaleQuantity(600, 'g', 4, 2), 300);
  assert.equal(scaleQuantity(1, '', 4, 6), 1.5);
  assert.equal(scaleQuantity(2, 'gousse', 4, 1), 0.5);
  assert.equal(scaleQuantity(null, 'selon goût', 4, 2), null);
  assert.equal(formatQuantity(1.5, ''), '1½');
  assert.equal(formatQuantity(2, 'gousse'), '2 gousses');
  assert.equal(formatQuantity(null, 'selon goût'), 'selon goût');
  assert.equal(scaleQuantity(1, '', 4, 3), 1);
  assert.equal(scaleQuantity(2, 'cs', 4, 3), 1.5);
  assert.equal(formatQuantity(0.35, 'kg'), '350 g');
  assert.equal(formatQuantity(0.5, 'l'), '50 cl');
});

import { filterRecipes, activeCount, DEFAULT_FILTERS } from '../src/engine/filters.js';
import { addToList, toggleItem, removeChecked } from '../src/engine/shopping.js';
import { totalTime } from '../src/engine/matching.js';

test('filtres temps, régime, budget', () => {
  assert.equal(filterRecipes(recipes, DEFAULT_FILTERS).length, recipes.length);
  const f = { ...DEFAULT_FILTERS, tempsMax: 30, régimes: ['végétarien', 'sans gluten'], budgets: ['€'] };
  const out = filterRecipes(recipes, f);
  assert.ok(out.length > 0 && out.length < recipes.length);
  for (const r of out) {
    assert.ok(totalTime(r) <= 30 && r.régime.includes('végétarien') && r.régime.includes('sans gluten') && r.budget === '€');
  }
  assert.equal(activeCount(f), 4);
});

test('liste de courses : fusion par unité, selon goût, recochage', () => {
  let l = addToList([], [{ nom: 'creme', quantité: 20, unité: 'cl' }, { nom: 'sel', quantité: null, unité: 'selon goût' }], 'a');
  l = addToList(l, [{ nom: 'creme', quantité: 10, unité: 'cl' }, { nom: 'creme', quantité: 2, unité: 'cs' }], 'b');
  const creme = l.find((i) => i.id === 'creme');
  assert.deepEqual(creme.qtés, { cl: 30, cs: 2 });
  assert.deepEqual(creme.recettes, ['a', 'b']);
  assert.deepEqual(l.find((i) => i.id === 'sel').qtés, { 'selon goût': null });
  l = toggleItem(l, 'sel');
  assert.equal(removeChecked(l).length, 1);
  l = addToList(l, [{ nom: 'sel', quantité: null, unité: 'selon goût' }], 'c');
  assert.equal(l.find((i) => i.id === 'sel').coché, false);
});

import { hasProtein, usesMode, SORTS } from '../src/engine/filters.js';

test('filtres protéine et mode Cookeo', () => {
  const vol = filterRecipes(recipes, { protéines: ['volaille'] });
  assert.ok(vol.length > 10 && vol.every((r) => hasProtein(r, 'volaille')));
  const vap = filterRecipes(recipes, { modes: ['vapeur'] });
  assert.ok(vap.length > 5 && vap.every((r) => usesMode(r, 'vapeur')));
  const both = filterRecipes(recipes, { protéines: ['poisson & mer'], modes: ['vapeur'] });
  assert.ok(both.some((r) => r.id === 'saumon-vapeur-legumes'));
});

test('tris du catalogue', () => {
  const ms = recipes.map((r) => matchRecipe(r, new Set(), subs));
  const fast = [...ms].sort(SORTS.rapide.cmp);
  assert.ok(totalTime(fast[0].recipe) <= totalTime(fast.at(-1).recipe));
  const cheap = [...ms].sort(SORTS.budget.cmp);
  assert.equal(cheap[0].recipe.budget, '€');
});
