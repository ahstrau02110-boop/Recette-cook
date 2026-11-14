import { h } from '../ui/dom.js';
import { recipes, subs, catalog } from '../data/index.js';
import { matchRecipe } from '../engine/matching.js';
import { filterRecipes, SORTS } from '../engine/filters.js';
import { norm } from '../engine/text.js';
import { pantryStore, filterStore, favStore } from '../state.js';
import { recipeCard } from '../ui/recipeCard.js';
import { filterPanel, opt, frow } from '../ui/filterPanel.js';

const TYPES = [['plat', '🍲 Plats'], ['soupe', '🥣 Soupes'], ['entrée', '🥚 Entrées'], ['accompagnement', '🥔 Accompagnements'], ['dessert', '🍮 Desserts'], ['petit-déjeuner', '☕ Petit-déj']];
const DISPO = [['toutes', 'Toutes'], ['0', '✦ Prêtes'], ['1', '≤ 1 manquant'], ['2', '≤ 2 manquants']];

// Texte indexé par recette : nom + noms et synonymes des ingrédients
const index = new Map(recipes.map((r) => [r.id, norm([r.nom, ...r.ingrédients.flatMap((i) => {
  const c = catalog.get(i.nom);
  return c ? [c.nom, ...c.synonymes] : [i.nom];
})].join(' '))]));

// État de session du catalogue
const ui = { type: null, dispo: 'toutes', tri: 'az', favoris: false };

// Écran Catalogue : toutes les recettes, indépendamment du garde-manger
export function catalogView() {
  const list = h('div.catalog-list');
  const typeBar = h('div.fopts.type-bar');
  const input = h('input.search', { type: 'search', placeholder: 'Nom ou ingrédient…', 'aria-label': 'Rechercher une recette', oninput: () => render() });
  const set = (patch) => { Object.assign(ui, patch); panel.refresh(); render(); };

  const panel = filterPanel({
    title: 'Filtres et tri',
    extraCount: () => (ui.dispo !== 'toutes' ? 1 : 0) + (ui.favoris ? 1 : 0),
    extra: () => [
      frow('Trier par', Object.entries(SORTS).map(([k, s]) => opt(s.label, ui.tri === k, () => set({ tri: k })))),
      frow('Avec mon garde-manger', DISPO.map(([k, l]) => opt(l, ui.dispo === k, () => set({ dispo: k })))),
      frow('Sélection', opt('⭐ Favoris uniquement', ui.favoris, () => set({ favoris: !ui.favoris })))
    ]
  });
  panel.addEventListener('reset', () => Object.assign(ui, { dispo: 'toutes', favoris: false, tri: 'az' }));

  const render = () => {
    typeBar.replaceChildren(
      ...[[null, 'Tout'], ...TYPES].map(([v, l]) => opt(l, ui.type === v, () => { ui.type = v; render(); }))
    );
    const q = norm(input.value);
    const pantry = pantryStore.set();
    const matches = filterRecipes(recipes, filterStore.get())
      .filter((r) => (!ui.type || r.type === ui.type) && (!ui.favoris || favStore.has(r.id)) && (!q || q.split(' ').every((w) => index.get(r.id).includes(w))))
      .map((r) => matchRecipe(r, pantry, subs))
      .filter((m) => ui.dispo === 'toutes' || m.missing.length <= Number(ui.dispo))
      .sort((a, b) => SORTS[ui.tri].cmp(a, b) || a.recipe.nom.localeCompare(b.recipe.nom, 'fr'));

    // Groupé par type pour le tri alphabétique, liste continue pour les autres tris
    const card = (m) => recipeCard(m, { actions: true });
    const blocks = ui.tri === 'az'
      ? TYPES.map(([t, label]) => ({ label, items: matches.filter((m) => m.recipe.type === t) }))
          .filter((g) => g.items.length)
          .map((g) => h('div.rgroup', h('div.divider', h('span.rgroup-title', `${g.label} (${g.items.length})`)), h('div.rlist', g.items.map(card))))
      : [h('div.rlist', matches.map(card))];

    list.replaceChildren(
      h('p.lead', `${matches.length} recette${matches.length > 1 ? 's' : ''} sur ${recipes.length}.`),
      ...(matches.length ? blocks : [h('article.parchment', h('p', 'Aucune recette ne correspond. Essayez d’assouplir les filtres.'))])
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
