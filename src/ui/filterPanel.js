import { h } from './dom.js';
import { filterStore } from '../state.js';
import { activeCount } from '../engine/filters.js';
import { cookeo } from '../data/index.js';

const TEMPS = [[null, 'Tous'], [20, '≤ 20 min'], [30, '≤ 30 min'], [45, '≤ 45 min'], [60, '≤ 1 h']];
const RÉGIMES = [['végétarien', '🌱'], ['végan', '🌿'], ['sans gluten', '🌾'], ['sans lactose', '🥛']];
const BUDGETS = ['€', '€€', '€€€'];

// Pastille de choix (unique ou multiple)
const opt = (label, on, onclick) => h('button.chip.chip-sm', { type: 'button', 'aria-pressed': String(on), onclick }, label);
const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/** Bouton « Filtres » + panneau repliable ; chaque changement est persistant */
export function filterPanel() {
  const body = h('div.filter-body');
  const count = h('span.badge');
  const wrap = h('details.filters', h('summary', '⚙️ Filtres ', count), body);

  const render = () => {
    const f = filterStore.get();
    const n = activeCount(f);
    count.textContent = String(n);
    count.hidden = !n;
    const portions = Array.from({ length: cookeo.personnes_max }, (_, i) => i + 1);
    body.replaceChildren(
      h('div.frow', h('span.flabel', 'Temps total'),
        h('div.fopts', TEMPS.map(([v, l]) => opt(l, f.tempsMax === v, () => filterStore.update({ tempsMax: v }))))),
      h('div.frow', h('span.flabel', 'Régime'),
        h('div.fopts', RÉGIMES.map(([v, i]) => opt(`${i} ${v}`, f.régimes.includes(v), () => filterStore.update({ régimes: toggle(f.régimes, v) }))))),
      h('div.frow', h('span.flabel', 'Budget'),
        h('div.fopts', BUDGETS.map((v) => opt(v, f.budgets.includes(v), () => filterStore.update({ budgets: toggle(f.budgets, v) }))))),
      h('div.frow', h('span.flabel', 'Personnes'),
        h('div.fopts',
          opt('Recette', f.portions == null, () => filterStore.update({ portions: null })),
          portions.map((p) => opt(String(p), f.portions === p, () => filterStore.update({ portions: p }))))),
      n > 0 && h('button.btn.btn-ghost.freset', { type: 'button', onclick: () => filterStore.reset() }, 'Réinitialiser')
    );
  };
  wrap.cleanup = filterStore.subscribe(render);
  render();
  return wrap;
}
