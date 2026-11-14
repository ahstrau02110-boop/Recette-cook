import { h } from './dom.js';
import { catalog } from '../data/index.js';
import { totalTime } from '../engine/matching.js';
import { fmtDuration } from './modes.js';

const RÉGIME_ICO = { végétarien: '🌱', végan: '🌿', 'sans gluten': '🌾', 'sans lactose': '🥛' };
export const régimeBadges = (r, all = false) =>
  (all ? r.régime : r.régime.filter((x) => x === 'végétarien' || x === 'végan').slice(-1))
    .map((x) => h('span.tag', `${RÉGIME_ICO[x] ?? ''} ${x}`));

export const nameOf = (id) => catalog.get(id)?.nom ?? id;

/** Étoiles de « rareté » : correspondance garde-manger (score) */
export const stars = (score) => {
  const n = Math.max(1, Math.min(5, Math.round(score / 20)));
  return h('span.stars', { 'aria-label': `${n} étoiles sur 5` }, '★'.repeat(n) + '☆'.repeat(5 - n));
};

/** Carte recette façon carte à collectionner */
export function recipeCard(match) {
  const r = match.recipe;
  const tier = match.complete ? 'gold' : match.missing.length === 1 ? 'sky' : 'silver';
  return h(`a.rcard.tier-${tier}`, { href: `#/recette/${r.id}` },
    h('div.medal', h('span', r.emoji)),
    h('div.rcard-body',
      h('h3.rcard-title', r.nom),
      h('div.rcard-meta',
        stars(match.score),
        h('span', `⏱ ${fmtDuration(totalTime(r))}`),
        h('span', `👥 ${r.portions}`),
        h('span.budget', r.budget)
      ),
      h('div.tags', régimeBadges(r)),
      match.missing.length > 0 && h('p.rcard-missing', h('b', 'Manque : '), match.missing.map(nameOf).join(', ')),
      match.substituted.length > 0 &&
        h('p.rcard-subs', h('b', 'Remplace : '), match.substituted.map((s) => `${nameOf(s.ingrédient)} → ${s.avec.map(nameOf).join(' + ')}`).join(' ; '))
    )
  );
}
