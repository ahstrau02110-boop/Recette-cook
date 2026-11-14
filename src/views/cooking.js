import { h } from '../ui/dom.js';
import { burst } from '../ui/sparkles.js';
import { recipeById, subs } from '../data/index.js';
import { matchRecipe } from '../engine/matching.js';
import { pantryStore } from '../state.js';
import { modeInfo, fmtClock } from '../ui/modes.js';
import { timer, ring_svg } from '../ui/timer.js';
import { go } from '../router.js';
import { ingredientRow } from './recipe.js';
import { portionsFor } from '../recipeActions.js';

// Garde l'écran allumé (Wake Lock), réacquis au retour sur l'onglet
function keepAwake(onState) {
  let lock = null;
  let active = true;
  const acquire = async () => {
    if (!active || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return onState(!!lock);
    try {
      lock = await navigator.wakeLock.request('screen');
      onState(true);
      lock.addEventListener('release', () => { lock = null; onState(false); });
    } catch { onState(false); }
  };
  const onVis = () => document.visibilityState === 'visible' && !lock && acquire();
  document.addEventListener('visibilitychange', onVis);
  acquire();
  return () => {
    active = false;
    document.removeEventListener('visibilitychange', onVis);
    lock?.release().catch(() => {});
  };
}

// Mode cuisine plein écran : une étape à la fois, mode Cookeo + minuteur
export function cookingView(id, startStep = '0') {
  const r = recipeById.get(id);
  if (!r) return (go('recettes'), document.createElement('div'));
  const n = r.étapes.length;
  let i = Math.min(Math.max(0, parseInt(startStep, 10) || 0), n - 1);

  const awake = h('span.awake');
  const progress = h('div.progress', r.étapes.map((_, k) => h('button.dot', { type: 'button', 'aria-label': `Étape ${k + 1}`, onclick: () => show(k) })));
  const stepNo = h('div.cook-stepno');
  const medal = h('div.cook-mode');
  const text = h('p.cook-text');
  const hint = h('p.cook-hint');
  const ring = ring_svg(200);
  const tBtns = h('div.cook-timer-btns');
  const timerBox = h('div.cook-timer', ring, tBtns);
  const other = h('button.other-timer', { type: 'button', hidden: true, onclick: () => show(timer.get().step) });
  const prev = h('button.btn.btn-ghost.nav-btn', { type: 'button', onclick: () => show(i - 1) }, '← Précédent');
  const next = h('button.btn.nav-btn', { type: 'button' });
  next.onclick = (e) => (i < n - 1 ? show(i + 1) : finish(e));

  const match = matchRecipe(r, pantryStore.set(), subs);
  const drawer = h('details.cook-ings', h('summary', `🧺 Ingrédients · 👥 ${portionsFor(r)}`), h('ul.ings', r.ingrédients.map((ing) => ingredientRow(ing, match, r.portions, portionsFor(r)))));

  const btn = (label, fn, cls = '.btn.btn-ghost') => h(`button${cls}`, { type: 'button', onclick: fn }, label);

  function renderTimer() {
    const s = r.étapes[i];
    const t = timer.get();
    const mine = timer.isFor(r.id, i);
    other.hidden = !t || mine || t.recipeId !== r.id;
    if (!other.hidden) other.textContent = `⏳ Étape ${t.step + 1} : ${t.done ? 'terminé !' : fmtClock(timer.remaining())}`;
    timerBox.hidden = !s.minuteur_s;
    if (!s.minuteur_s) return;
    timerBox.classList.toggle('done', !!(mine && t.done));
    if (mine) ring.update(timer.remaining(), t.total);
    else ring.update(s.minuteur_s, s.minuteur_s);
    const start = () => timer.start(`${r.nom} · étape ${i + 1}`, s.minuteur_s, { recipeId: r.id, step: i });
    const state = !mine ? 'idle' : t.done ? 'done' : t.running ? 'run' : 'pause';
    if (tBtns.dataset.state === state && tBtns.dataset.step === String(i)) return;
    tBtns.dataset.state = state;
    tBtns.dataset.step = String(i);
    tBtns.replaceChildren(...{
      idle: [btn('▶ Lancer le minuteur', start, '.btn')],
      run: [btn('⏸ Pause', () => timer.pause()), btn('+1 min', () => timer.add(60)), btn('✕', () => timer.stop())],
      pause: [btn('▶ Reprendre', () => timer.resume(), '.btn'), btn('↺', start), btn('✕', () => timer.stop())],
      done: [btn('✓ OK', () => timer.stop(), '.btn'), btn('+1 min', () => { timer.stop(); timer.start(`${r.nom} · étape ${i + 1}`, 60, { recipeId: r.id, step: i }); })]
    }[state]);
  }

  function show(k) {
    i = Math.min(Math.max(0, k), n - 1);
    const s = r.étapes[i];
    const m = modeInfo(s);
    stepNo.textContent = `Étape ${i + 1} / ${n}`;
    medal.className = `cook-mode mode-${m.id}`;
    medal.replaceChildren(
      h('span.cook-mode-ico', m.icon),
      h('span.cook-mode-label', s.mode ? 'Sélectionner sur le Cookeo' : 'Préparation'),
      h('strong', s.mode ? m.nom : 'Hors appareil')
    );
    text.textContent = s.texte;
    hint.textContent = s.mode === 'pression'
      ? 'Le Cookeo décompte dès la montée en pression : le minuteur sert de repère.'
      : s.mode === 'vapeur' ? 'Panier vapeur en place, eau dans la cuve.' : '';
    [...progress.children].forEach((d, k) => d.classList.toggle('on', k <= i));
    prev.disabled = i === 0;
    next.textContent = i < n - 1 ? 'Suivant →' : '✦ Terminer';
    view.querySelector('.cook-card')?.animate([{ opacity: 0, transform: 'translateX(16px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
    renderTimer();
  }

  function finish(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    for (let k = 0; k < 3; k++) setTimeout(() => burst(rect.left + rect.width / 2, rect.top, 18), k * 180);
    setTimeout(() => go(`recette/${r.id}`), 900);
  }

  const view = h('section.cooking',
    h('header.cook-top',
      h('button.btn.btn-ghost', { type: 'button', onclick: () => go(`recette/${r.id}`) }, '✕ Quitter'),
      h('div.cook-title', r.emoji + ' ' + r.nom),
      awake
    ),
    progress,
    other,
    h('div.cook-card.parchment', stepNo, medal, text, hint, timerBox),
    drawer,
    h('nav.cook-nav', prev, next)
  );

  // Clavier : flèches pour naviguer
  const onKey = (e) => {
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  };
  addEventListener('keydown', onKey);

  // Plein écran (si autorisé) + écran allumé
  document.documentElement.requestFullscreen?.().catch(() => {});
  const releaseWake = keepAwake((on) => {
    awake.textContent = on ? '🔆' : '';
    awake.title = on ? 'Écran maintenu allumé' : '';
  });
  const unsub = timer.subscribe(renderTimer);

  view.cleanup = () => {
    unsub();
    releaseWake();
    removeEventListener('keydown', onKey);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  show(i);
  return view;
}
