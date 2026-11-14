import { h } from '../ui/dom.js';
import { recipes, subs, catalog } from '../data/index.js';
import { matchRecipe } from '../engine/matching.js';
import { filterRecipes } from '../engine/filters.js';
import { norm } from '../engine/text.js';
import { pantryStore, filterStore } from '../state.js';
import { recipeCard } from '../ui/recipeCard.js';
import { filterPanel } from '../ui/filterPanel.js';

const TYPES = [['plat', '🍲 Plats'], ['soupe', '🥣 Soupes'], ['entrée', '🥚 Entrées'], ['accompagnement', '🥔 Accompagnements'], ['dessert', '🍮 Desserts']];

// Texte indexé par recette : nom + noms et synonymes des ingrédients
const index = new Map(recipes.map((r) => [r.id, norm([r.nom, ...r.ingrédients.flatMap((i) => {
  const c = catalog.get(i.nom);
  return c ? [c.nom, ...c.synonymes] : [i.nom];
})].join(' '))]));

let type = null; // conservé pendant la session

// Écran Catalogue : toutes les recettes, indépendamment du garde-manger
export function catalogView() {
  const panel = filterPanel();
  const list = h('div.catalog-list');
  const typeBar = h('div.fopts.type-bar');
  const input = h('input.search', { type: 'search', placeholder: 'Nom ou ingrédient…', 'aria-label': 'Rechercher une recette', oninput: () => render() });

  const render = () => {
    typeBar.replaceChildren(
      ...[[null, 'Tout'], ...TYPES].map(([v, l]) =>
        h('button.chip.chip-sm', { type: 'button', 'aria-pressed': String(type === v), onclick: () => { type = v; render(); } }, l))
    );
    const q = norm(input.value);
    const pool = filterRecipes(recipes, filterStore.get())
      .filter((r) => (!type || r.type === type) && (!q || q.split(' ').every((w) => index.get(r.id).includes(w))))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    const pantry = pantryStore.set();
    const groups = TYPES
      .map(([t, label]) => ({ label, items: pool.filter((r) => r.type === t) }))
      .filter((g) => g.items.length);
    list.replaceChildren(
      h('p.lead', `${pool.length} recette${pool.length > 1 ? 's' : ''} sur ${recipes.length}.`),
      ...(pool.length
        ? groups.map((g) => h('div.rgroup',
            h('div.divider', h('span.rgroup-title', `${g.label} (${g.items.length})`)),
            h('div.rlist', g.items.map((r) => recipeCard(matchRecipe(r, pantry, subs), { actions: true })))))
        : [h('article.parchment', h('p', 'Aucune recette ne correspond.'))])
    );
  };

  const view = h('section.view.catalog',
    h('h2.title-deco', '📖 Catalogue'),
    h('div.searchbar', input),
    typeBar,
    panel,
    list
  );
  const unsub = filterStore.subscribe(render);
  view.cleanup = () => { unsub(); panel.cleanup(); };
  render();
  return view;
}
