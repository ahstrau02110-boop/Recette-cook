import { h, confirmButton } from '../ui/dom.js';
import { catalog, recipeById } from '../data/index.js';
import { formatQuantity } from '../engine/quantities.js';
import { shoppingStore } from '../state.js';

const qtyText = (qtés) =>
  Object.entries(qtés)
    .map(([u, q]) => formatQuantity(q, u))
    .join(' + ');

// Écran Courses : ingrédients manquants regroupés par rayon, cochables et persistants
export function shoppingView() {
  const body = h('div.shop-body');
  const count = h('span.badge.big');
  const view = h('section.view.shopping',
    h('div.view-head', h('h2.title-deco', '🛒 Courses'), count),
    body
  );

  const render = () => {
    const list = shoppingStore.get();
    const left = list.filter((i) => !i.coché).length;
    count.textContent = `${left} à acheter`;
    count.hidden = !list.length;

    if (!list.length) {
      body.replaceChildren(h('article.parchment.empty',
        h('h3', 'Liste vide'),
        h('p', 'Depuis une fiche recette, ajoutez les ingrédients manquants en un geste.'),
        h('a.btn', { href: '#/recettes' }, '📜 Voir les recettes')));
      return;
    }

    // Regroupement par catégorie du catalogue (ordre des rayons)
    const groups = catalog.categories
      .map((c) => ({ cat: c, items: list.filter((i) => catalog.get(i.id)?.catégorie === c.id) }))
      .filter((g) => g.items.length);

    body.replaceChildren(
      h('article.parchment.shop-list',
        groups.map(({ cat, items }) => h('div.shop-group',
          h('h3', `${cat.emoji} ${cat.nom}`),
          h('ul', items.map((i) => {
            const ing = catalog.get(i.id);
            const recettes = i.recettes.map((id) => recipeById.get(id)?.nom).filter(Boolean);
            return h(`li.shop-item${i.coché ? '.done' : ''}`,
              h('label',
                h('input', { type: 'checkbox', checked: i.coché, onchange: () => shoppingStore.toggle(i.id) }),
                h('span.shop-ico', ing?.emoji ?? '•'),
                h('span.shop-txt',
                  h('b', ing?.nom ?? i.id), ' ', h('span.shop-qty', qtyText(i.qtés)),
                  recettes.length > 0 && h('small', recettes.join(' · '))
                )
              )
            );
          }))
        ))
      ),
      h('div.shop-actions',
        h('button.btn', { type: 'button', disabled: left === list.length, onclick: () => shoppingStore.removeChecked() }, '✓ Retirer les achats cochés'),
        confirmButton('Tout vider', 'Confirmer ?', () => shoppingStore.clear())
      )
    );
  };
  view.cleanup = shoppingStore.subscribe(render);
  render();
  return view;
}
