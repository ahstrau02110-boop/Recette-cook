import { h } from '../ui/dom.js';
import { recipes, subs } from '../data/index.js';
import { rankRecipes, groupByMissing } from '../engine/matching.js';
import { filterRecipes } from '../engine/filters.js';
import { pantryStore, filterStore } from '../state.js';
import { recipeCard } from '../ui/recipeCard.js';
import { filterPanel } from '../ui/filterPanel.js';

const SHOWN_MISSING = 3; // au-delà : section repliée

// Écran Recettes : prêtes à cuisiner, puis « il manque X ingrédient(s) »
export function resultsView() {
  const view = h('section.view.results', h('h2.title-deco', '📜 Recettes'));

  if (!pantryStore.size) {
    view.append(h('article.parchment.empty',
      h('h3', 'Le garde-manger est vide'),
      h('p', 'Cochez les ingrédients disponibles pour révéler les recettes réalisables avec le Cookeo+.'),
      h('a.btn', { href: '#/garde-manger' }, '🧺 Ouvrir le garde-manger')
    ));
    return view;
  }

  const panel = filterPanel();
  const list = h('div.results-list');
  view.append(panel, list);

  const section = (title, items, cls = '') =>
    h(`div.rgroup${cls}`, h('div.divider', h('span.rgroup-title', title)), h('div.rlist', items.map(recipeCard)));

  const render = () => {
    const pool = filterRecipes(recipes, filterStore.get());
    const ranked = rankRecipes(pool, pantryStore.set(), subs);
    const { complètes, parManquants } = groupByMissing(ranked);
    const out = [h('p.lead',
      `${complètes.length} recette${complètes.length > 1 ? 's' : ''} prête${complètes.length > 1 ? 's' : ''} · ${ranked.length} au total avec vos ${pantryStore.size} ingrédients` +
      (pool.length < recipes.length ? ` (${pool.length} recettes après filtres).` : '.'))];

    if (!ranked.length) out.push(h('article.parchment', h('p', 'Aucune recette ne correspond. Essayez d’assouplir les filtres.')));
    else if (complètes.length) out.push(section(`✦ Prêtes à cuisiner (${complètes.length})`, complètes, '.ready'));
    else out.push(h('article.parchment', h('p', 'Aucune recette complète pour l’instant. Voici les plus proches :')));

    const rest = [];
    for (const [n, items] of [...parManquants].sort((a, b) => a[0] - b[0])) {
      if (n <= SHOWN_MISSING) out.push(section(`Il manque ${n} ingrédient${n > 1 ? 's' : ''} (${items.length})`, items));
      else rest.push(...items);
    }
    if (rest.length) {
      out.push(h('details.more',
        h('summary', `Plus de ${SHOWN_MISSING} ingrédients manquants (${rest.length})`),
        h('div.rlist', rest.map(recipeCard))
      ));
    }
    list.replaceChildren(...out);
  };
  const unsub = filterStore.subscribe(render);
  view.cleanup = () => { unsub(); panel.cleanup(); };
  render();
  return view;
}
