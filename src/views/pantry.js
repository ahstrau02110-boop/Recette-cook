import { h } from '../ui/dom.js';
import { burst } from '../ui/sparkles.js';
import { catalog, recipes, subs } from '../data/index.js';
import { rankRecipes } from '../engine/matching.js';
import { pantryStore } from '../state.js';

// Écran Garde-manger : ingrédients cochables par catégorie + recherche
export function pantryView() {
  const chips = new Map(); // id -> [boutons] (un ingrédient peut apparaître en recherche et en catégorie)
  const counters = new Map(); // catégorie -> compteur

  const chip = (item) => {
    const b = h('button.chip', {
      type: 'button',
      'aria-pressed': String(pantryStore.has(item.id)),
      title: item.synonymes.length ? 'Aussi : ' + item.synonymes.join(', ') : null,
      onclick: (e) => {
        const on = pantryStore.toggle(item.id);
        if (on) burst(e.clientX, e.clientY, 8);
      }
    }, h('span.chip-ico', item.emoji), h('span', item.nom));
    if (!chips.has(item.id)) chips.set(item.id, []);
    chips.get(item.id).push(b);
    return b;
  };

  // Catégories repliables
  const sections = catalog.categories.map((cat) => {
    const count = h('span.badge');
    counters.set(cat.id, { el: count, ids: cat.ingrédients });
    return h('details.cat', { open: true },
      h('summary', h('span.cat-ico', cat.emoji), h('span.cat-name', cat.nom), count),
      h('div.chips', cat.ingrédients.map((id) => chip(catalog.get(id))))
    );
  });
  const catBox = h('div.cats', sections);

  // Recherche
  const results = h('div.chips.search-results', { hidden: true });
  const input = h('input.search', {
    type: 'search', placeholder: 'Rechercher un ingrédient…', 'aria-label': 'Rechercher un ingrédient',
    oninput: () => {
      const q = input.value.trim();
      results.hidden = !q;
      catBox.hidden = !!q;
      if (!q) return;
      for (const [id, list] of chips) chips.set(id, list.filter((b) => !results.contains(b)));
      const found = catalog.search(q);
      results.replaceChildren(...(found.length ? found.map(chip) : [h('p.empty-line', 'Aucun ingrédient trouvé.')]));
    }
  });

  const total = h('span.badge.big');
  const clear = h('button.btn.btn-ghost', {
    type: 'button',
    onclick: () => pantryStore.size && confirm('Décocher tous les ingrédients ?') && pantryStore.clear()
  }, 'Tout décocher');
  const cta = h('a.btn.cta', { href: '#/recettes' });

  const refresh = () => {
    for (const [id, list] of chips) list.forEach((b) => b.setAttribute('aria-pressed', String(pantryStore.has(id))));
    for (const { el, ids } of counters.values()) {
      const n = ids.filter(pantryStore.has).length;
      el.textContent = `${n}/${ids.length}`;
      el.classList.toggle('on', n > 0);
    }
    total.textContent = `${pantryStore.size} ingrédient${pantryStore.size > 1 ? 's' : ''}`;
    const ranked = rankRecipes(recipes, pantryStore.set(), subs);
    const ready = ranked.filter((m) => m.complete).length;
    cta.textContent = pantryStore.size
      ? `📜 Voir les recettes · ${ready} prête${ready > 1 ? 's' : ''}`
      : '📜 Cochez vos ingrédients';
    cta.classList.toggle('shine', ready > 0);
  };

  const view = h('section.view.pantry',
    h('div.view-head', h('h2.title-deco', '🧺 Garde-manger'), total),
    h('p.lead', 'Cochez tout ce que vous avez, même le sel, l’huile ou l’eau : rien n’est considéré comme acquis.'),
    h('div.searchbar', input, clear),
    results,
    catBox,
    h('div.cta-bar', cta)
  );
  view.cleanup = pantryStore.subscribe(refresh);
  refresh();
  return view;
}
