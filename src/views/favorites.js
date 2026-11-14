import { h } from '../ui/dom.js';
import { recipeById, subs } from '../data/index.js';
import { matchRecipe } from '../engine/matching.js';
import { favStore, pantryStore } from '../state.js';
import { recipeCard } from '../ui/recipeCard.js';

// Écran Favoris : recettes étoilées, les plus réalisables d'abord
export function favoritesView() {
  const list = h('div.rlist');
  const view = h('section.view.favorites', h('h2.title-deco', '⭐ Favoris'), list);

  const render = () => {
    const matches = [...favStore.set()]
      .map((id) => recipeById.get(id))
      .filter(Boolean)
      .map((r) => matchRecipe(r, pantryStore.set(), subs))
      .sort((a, b) => a.missing.length - b.missing.length || b.score - a.score);
    list.replaceChildren(...(matches.length
      ? matches.map(recipeCard)
      : [h('article.parchment.empty',
          h('h3', 'Aucun favori'),
          h('p', 'Touchez l’étoile ☆ d’une recette pour la garder ici.'),
          h('a.btn', { href: '#/recettes' }, '📜 Voir les recettes'))]));
  };
  // Retrait immédiat quand on désétoile depuis cet écran
  view.addEventListener('favchange', render);
  render();
  return view;
}
