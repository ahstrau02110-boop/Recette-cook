import { h } from '../ui/dom.js';
import { recipeById, subs } from '../data/index.js';
import { matchRecipe } from '../engine/matching.js';
import { formatQuantity, scaleQuantity } from '../engine/quantities.js';
import { pantryStore, shoppingStore, filterStore } from '../state.js';
import { burst } from '../ui/sparkles.js';
import { cookeo } from '../data/index.js';
import { modeInfo, fmtDuration, fmtClock } from '../ui/modes.js';
import { timer } from '../ui/timer.js';
import { régimeBadges, nameOf, stars, favButton } from '../ui/recipeCard.js';

/** Ligne d'ingrédient avec son état face au garde-manger */
export function ingredientRow(ing, match, from = 1, to = 1) {
  const sub = match.substituted.find((s) => s.ingrédient === ing.nom);
  const state = pantryStore.has(ing.nom) ? 'ok' : sub ? 'sub' : ing.optionnel ? 'opt' : 'miss';
  const ico = { ok: '✓', sub: '↺', opt: '○', miss: '✗' }[state];
  return h(`li.ing.ing-${state}`,
    h('span.ing-state', { 'aria-hidden': 'true' }, ico),
    h('span.ing-qty', formatQuantity(scaleQuantity(ing.quantité, ing.unité, from, to), ing.unité)),
    h('span.ing-name', nameOf(ing.nom), ing.optionnel && h('small', ' (facultatif)'),
      sub && h('small.ing-alt', `→ ${sub.avec.map(nameOf).join(' + ')}${sub.note ? ' · ' + sub.note : ''}`)
    )
  );
}

/** Badge du mode Cookeo d'une étape */
export const modeBadge = (step) => {
  const m = modeInfo(step);
  return h(`span.mode.mode-${m.id}`, h('span.mode-ico', m.icon), m.nom);
};

/** Bouton minuteur d'étape */
export function timerButton(r, i, step) {
  const label = `${r.nom} · étape ${i + 1}`;
  const b = h('button.btn.btn-ghost.timer-btn', { type: 'button' });
  const render = () => {
    const mine = timer.isFor(r.id, i);
    const t = timer.get();
    b.textContent = mine && !t.done ? `⏳ ${fmtClock(timer.remaining())}` : `⏱ ${fmtDuration(Math.round(step.minuteur_s / 60))}`;
    b.classList.toggle('active', !!mine && !t.done);
  };
  b.onclick = () => (timer.isFor(r.id, i) && !timer.get().done ? timer.stop() : timer.start(label, step.minuteur_s, { recipeId: r.id, step: i }));
  b.unsub = timer.subscribe(render);
  render();
  return b;
}

// Portions choisies par recette (session), partagées avec le mode cuisine
const chosenPortions = new Map();
export const portionsFor = (r) => chosenPortions.get(r.id) ?? filterStore.get().portions ?? r.portions;

// Fiche recette
export function recipeView(id) {
  const r = recipeById.get(id);
  if (!r) return h('section.view', h('article.parchment', h('h3', 'Recette introuvable'), h('a.btn', { href: '#/recettes' }, 'Retour')));
  const match = matchRecipe(r, pantryStore.set(), subs);
  const timerBtns = [];
  let portions = portionsFor(r);

  const steps = r.étapes.map((s, i) => {
    const btn = s.minuteur_s && timerButton(r, i, s);
    if (btn) timerBtns.push(btn);
    return h('li.step',
      h('div.step-head', h('span.step-num', String(i + 1)), modeBadge(s), btn),
      h('p', s.texte)
    );
  });

  // Ingrédients recalculés selon les portions
  const ingList = h('ul.ings');
  const pCount = h('b.pcount');
  const scaleNote = h('p.scale-note');
  const minus = h('button.step-btn', { type: 'button', 'aria-label': 'Une portion de moins', onclick: () => setPortions(portions - 1) }, '−');
  const plus = h('button.step-btn', { type: 'button', 'aria-label': 'Une portion de plus', onclick: () => setPortions(portions + 1) }, '+');
  const shopBtn = h('button.btn.btn-ghost.shop-btn', { type: 'button' });

  function setPortions(n) {
    portions = Math.min(cookeo.personnes_max, Math.max(1, n));
    chosenPortions.set(r.id, portions);
    pCount.textContent = String(portions);
    minus.disabled = portions <= 1;
    plus.disabled = portions >= cookeo.personnes_max;
    ingList.replaceChildren(...r.ingrédients.map((ing) => ingredientRow(ing, match, r.portions, portions)));
    scaleNote.textContent = portions !== r.portions
      ? `Quantités recalculées (recette de base : ${r.portions}). Temps de cuisson inchangés.`
      : '';
    renderShop();
  }

  function renderShop() {
    const n = match.missing.length;
    shopBtn.hidden = n === 0;
    shopBtn.disabled = false;
    shopBtn.textContent = `🛒 Ajouter ${n > 1 ? `les ${n} manquants` : 'le manquant'} aux courses`;
  }
  shopBtn.onclick = (e) => {
    const needs = r.ingrédients
      .filter((i) => match.missing.includes(i.nom))
      .map((i) => ({ nom: i.nom, unité: i.unité, quantité: scaleQuantity(i.quantité, i.unité, r.portions, portions) }));
    shoppingStore.add(needs, r.id);
    burst(e.clientX, e.clientY, 12);
    shopBtn.textContent = '✓ Ajouté à la liste de courses';
    shopBtn.disabled = true;
  };

  const fav = favButton(r);
  const view = h('section.view.recipe',
    h('a.back', { href: '#/recettes' }, '← Recettes'),
    h('article.parchment.hero',
      fav,
      h('div.medal.big', h('span', r.emoji)),
      h('h2', r.nom),
      stars(match.score),
      h('div.meta-grid',
        h('div', h('small', 'Préparation'), h('b', fmtDuration(r.temps_prépa))),
        h('div', h('small', 'Cuisson'), h('b', fmtDuration(r.temps_cuisson))),
        h('div', h('small', 'Portions'), h('b', String(r.portions))),
        h('div', h('small', 'Budget'), h('b', r.budget))
      ),
      h('div.tags', régimeBadges(r, true)),
      match.complete
        ? h('p.status.ok', '✦ Tous les ingrédients sont réunis !')
        : h('p.status.miss', `Il manque ${match.missing.length} ingrédient${match.missing.length > 1 ? 's' : ''}.`)
    ),
    h('article.parchment',
      h('div.ings-head', h('h3', 'Ingrédients'),
        h('div.stepper', minus, h('span', '👥 ', pCount), plus)),
      scaleNote,
      ingList,
      shopBtn
    ),
    h('article.parchment',
      h('h3', 'Étapes'),
      h('ol.steps', steps)
    ),
    h('div.cta-bar', h('a.btn.cta.shine', { href: `#/cuisine/${r.id}` }, '⚔️ Lancer le mode cuisine'))
  );
  setPortions(portions);
  view.cleanup = () => {
    timerBtns.forEach((b) => b.unsub());
  };
  return view;
}
