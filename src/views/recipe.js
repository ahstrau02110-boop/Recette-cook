import { h } from '../ui/dom.js';
import { recipeById, subs } from '../data/index.js';
import { matchRecipe } from '../engine/matching.js';
import { formatQuantity, scaleQuantity } from '../engine/quantities.js';
import { pantryStore } from '../state.js';
import { portionsFor, setPortionsFor, addMissingToShopping } from '../recipeActions.js';
import { burst } from '../ui/sparkles.js';
import { cookeo } from '../data/index.js';
import { modeInfo, fmtDuration, fmtClock } from '../ui/modes.js';
import { timer } from '../ui/timer.js';
import { régimeBadges, nameOf, stars, favButton } from '../ui/recipeCard.js';
import { cookeoGuide } from '../ui/guide.js';

/** Ingrédients utilisés à une étape, quantités adaptées aux portions (quantité affichée à la 1re mention seulement) */
export function stepIngredients(r, step, portions) {
  if (!step.ingrédients?.length) return null;
  const idx = r.étapes.indexOf(step);
  const before = new Set(r.étapes.slice(0, idx).flatMap((e) => e.ingrédients || []));
  return h('ul.step-ings', step.ingrédients.map((id) => {
    const ing = r.ingrédients.find((i) => i.nom === id);
    if (before.has(id)) return h('li.again', nameOf(id));
    if (ing.quantité == null) return h('li', nameOf(id), h('small', ` ${ing.unité}`));
    return h('li', h('b', formatQuantity(scaleQuantity(ing.quantité, ing.unité, r.portions, portions), ing.unité)), ' ', nameOf(id));
  }));
}

/** Encadré « Sur le Cookeo » d'une étape */
export function guideBox(r, i, open = false) {
  const lines = cookeoGuide(r, i);
  if (!lines.length) return null;
  return h('details.guide', { open }, h('summary', '📘 Sur le Cookeo'), h('ul', lines.map((l) => h('li', l))));
}

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


// Fiche recette
export function recipeView(id) {
  const r = recipeById.get(id);
  if (!r) return h('section.view', h('article.parchment', h('h3', 'Recette introuvable'), h('a.btn', { href: '#/recettes' }, 'Retour')));
  const match = matchRecipe(r, pantryStore.set(), subs);
  const timerBtns = [];
  let portions = portionsFor(r);

  const stepIngBoxes = r.étapes.map(() => h('div.step-ings-box'));
  const steps = r.étapes.map((s, i) => {
    const btn = s.minuteur_s && timerButton(r, i, s);
    if (btn) timerBtns.push(btn);
    return h('li.step',
      h('div.step-head', h('span.step-num', String(i + 1)), modeBadge(s), btn),
      h('p', s.texte),
      stepIngBoxes[i],
      guideBox(r, i)
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
    setPortionsFor(r, portions);
    pCount.textContent = String(portions);
    minus.disabled = portions <= 1;
    plus.disabled = portions >= cookeo.personnes_max;
    ingList.replaceChildren(...r.ingrédients.map((ing) => ingredientRow(ing, match, r.portions, portions)));
    stepIngBoxes.forEach((box, i) => box.replaceChildren(...[stepIngredients(r, r.étapes[i], portions)].filter(Boolean)));
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
    addMissingToShopping(r, match, portions);
    burst(e.clientX, e.clientY, 12);
    shopBtn.textContent = '✓ Ajouté à la liste de courses';
    shopBtn.disabled = true;
  };

  const fav = favButton(r);
  const view = h('section.view.recipe',
    h('a.back', { href: '#/recettes', onclick: (e) => { if (history.length > 1) { e.preventDefault(); history.back(); } } }, '← Retour'),
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
