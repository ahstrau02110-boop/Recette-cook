import { h } from '../ui/dom.js';
import { recipes, subs } from '../data/index.js';
import { rankRecipes, groupByMissing } from '../engine/matching.js';
import { pantryStore } from '../state.js';
import { recipeCard } from '../ui/recipeCard.js';

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

  const ranked = rankRecipes(recipes, pantryStore.set(), subs);
  const { complètes, parManquants } = groupByMissing(ranked);

  view.append(h('p.lead',
    `${complètes.length} recette${complètes.length > 1 ? 's' : ''} prête${complètes.length > 1 ? 's' : ''} · ${ranked.length} au total avec vos ${pantryStore.size} ingrédients.`));

  const section = (title, list, cls = '') =>
    h(`div.rgroup${cls}`, h('div.divider', h('span.rgroup-title', title)), h('div.rlist', list.map(recipeCard)));

  if (complètes.length) view.append(section(`✦ Prêtes à cuisiner (${complètes.length})`, complètes, '.ready'));
  else view.append(h('article.parchment', h('p', 'Aucune recette complète pour l’instant. Voici les plus proches :')));

  const rest = [];
  for (const [n, list] of [...parManquants].sort((a, b) => a[0] - b[0])) {
    if (n <= SHOWN_MISSING) view.append(section(`Il manque ${n} ingrédient${n > 1 ? 's' : ''} (${list.length})`, list));
    else rest.push(...list);
  }
  if (rest.length) {
    view.append(h('details.more',
      h('summary', `Plus de ${SHOWN_MISSING} ingrédients manquants (${rest.length})`),
      h('div.rlist', rest.map(recipeCard))
    ));
  }
  return view;
}
