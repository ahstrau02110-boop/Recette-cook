// Minuteur unique de l'app : survit aux changements d'écran et au rechargement
import { load, save } from '../store.js';
import { h } from './dom.js';
import { fmtClock } from './modes.js';

let t = load('timer', null); // { label, total, endAt, left, running, done, recipeId, step }
const listeners = new Set();
let interval = null;
let audio = null;

const remaining = () => (t ? (t.running ? (t.endAt - Date.now()) / 1000 : t.left) : 0);

function emit() {
  save('timer', t);
  listeners.forEach((fn) => fn(t));
}

function loop() {
  clearInterval(interval);
  if (!t?.running) return;
  interval = setInterval(() => {
    if (remaining() <= 0) {
      t = { ...t, running: false, left: 0, done: true };
      clearInterval(interval);
      ring();
    }
    emit();
  }, 250);
}

// Alarme : 3 bips + vibration
function ring() {
  navigator.vibrate?.([300, 150, 300, 150, 600]);
  try {
    audio ??= new AudioContext();
    [0, 0.45, 0.9].forEach((d) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'triangle';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, audio.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.4, audio.currentTime + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d + 0.35);
      o.connect(g).connect(audio.destination);
      o.start(audio.currentTime + d);
      o.stop(audio.currentTime + d + 0.4);
    });
  } catch { /* audio indisponible */ }
}

export const timer = {
  get: () => t,
  remaining,
  isFor: (recipeId, step) => t && t.recipeId === recipeId && t.step === step,
  start(label, total, meta = {}) {
    audio ??= new AudioContext(); // débloqué par le geste utilisateur
    t = { label, total, endAt: Date.now() + total * 1000, left: total, running: true, done: false, ...meta };
    emit(); loop();
  },
  pause() {
    if (!t?.running) return;
    t = { ...t, running: false, left: remaining() };
    emit(); loop();
  },
  resume() {
    if (!t || t.running || t.done) return;
    t = { ...t, running: true, endAt: Date.now() + t.left * 1000 };
    emit(); loop();
  },
  add(sec) {
    if (!t) return;
    t = t.running ? { ...t, endAt: t.endAt + sec * 1000, total: t.total + sec } : { ...t, left: t.left + sec, total: t.total + sec, done: false };
    emit();
  },
  stop() { t = null; emit(); loop(); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
};

// Reprise après rechargement
if (t?.running && remaining() <= 0) t = { ...t, running: false, left: 0, done: true };
loop();

/** Anneau SVG de progression */
export function ring_svg(size = 220) {
  const r = size / 2 - 12, c = 2 * Math.PI * r;
  const el = h('div.timer-ring', { style: `width:${size}px;height:${size}px` });
  el.innerHTML = `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset="1" stop-color="#d39a2c"/></linearGradient></defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="track"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="bar" stroke-dasharray="${c}" stroke-dashoffset="0"
      transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><div class="timer-time" role="timer" aria-live="off"></div>`;
  el.update = (left, total) => {
    el.querySelector('.bar').setAttribute('stroke-dashoffset', String(c * (1 - (total ? left / total : 0))));
    el.querySelector('.timer-time').textContent = fmtClock(left);
  };
  return el;
}

/** Pastille flottante visible partout (sauf mode cuisine) */
export function mountTimerWidget(root) {
  const label = h('a.tw-label');
  const time = h('span.tw-time');
  const toggle = h('button.tw-btn', { type: 'button', 'aria-label': 'Pause / reprise', onclick: () => (t?.running ? timer.pause() : timer.resume()) });
  const close = h('button.tw-btn', { type: 'button', 'aria-label': 'Arrêter le minuteur', onclick: () => timer.stop() }, '✕');
  const el = h('div.timer-widget', { hidden: true }, h('span.tw-ico', '⏳'), label, time, toggle, close);
  root.append(el);
  const render = () => {
    el.hidden = !t;
    if (!t) return;
    el.classList.toggle('done', !!t.done);
    label.textContent = t.label;
    label.href = t.recipeId ? `#/recette/${t.recipeId}` : '#/';
    time.textContent = t.done ? 'Terminé !' : fmtClock(remaining());
    toggle.textContent = t.running ? '⏸' : '▶';
    toggle.hidden = !!t.done;
  };
  timer.subscribe(render);
  render();
}
