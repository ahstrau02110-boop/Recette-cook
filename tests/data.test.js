// Cohérence des données : ids, modes Cookeo, capacités
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';

const cookeo = load('cookeo.json');
const catalog = load('ingredients.json');
const recipes = load('recipes.json');
const subs = load('substitutions.json');
const modeIds = new Set(cookeo.modes.map((m) => m.id));
const ingIds = new Set(catalog.catégories.flatMap((c) => c.ingrédients.map((i) => i.id)));

test('au moins 100 recettes, ids uniques', () => {
  assert.ok(recipes.length >= 100);
  assert.equal(new Set(recipes.map((r) => r.id)).size, recipes.length);
});

test('catalogue : ids uniques, essentiels présents comme ingrédients cochables', () => {
  const all = catalog.catégories.flatMap((c) => c.ingrédients.map((i) => i.id));
  assert.equal(new Set(all).size, all.length);
  for (const id of ['sel', 'poivre', 'huile', 'eau', 'bouillon_volaille', 'bouillon_legumes']) assert.ok(ingIds.has(id), id);
});

test('recettes valides vis-à-vis du Cookeo+', () => {
  for (const r of recipes) {
    assert.ok(r.portions >= 1 && r.portions <= cookeo.personnes_max, r.id);
    assert.ok(['€', '€€', '€€€'].includes(r.budget), r.id);
    assert.ok(r.emoji && r.nom && Array.isArray(r.régime), r.id);
    for (const i of r.ingrédients) {
      assert.ok(ingIds.has(i.nom), `${r.id} : ${i.nom}`);
      assert.equal(typeof i.optionnel, 'boolean');
    }
    assert.ok(r.étapes.some((e) => e.mode), `${r.id} sans mode`);
    for (const e of r.étapes) {
      if (e.mode) assert.ok(modeIds.has(e.mode), `${r.id} : ${e.mode}`);
      if (e.niveau) assert.ok(cookeo.modes.find((m) => m.id === 'dorer').niveaux.includes(e.niveau));
      assert.ok(e.minuteur_s === null || e.minuteur_s > 0);
    }
  }
});

test('substitutions : ids connus', () => {
  for (const s of subs) {
    assert.ok(ingIds.has(s.ingrédient), s.ingrédient);
    for (const alt of s.alternatives) for (const id of alt) assert.ok(ingIds.has(id), id);
  }
});
