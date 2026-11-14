// État applicatif persistant : garde-manger
import { load, save } from './store.js';

const pantry = new Set(load('pantry', []));
const listeners = new Set();

export const pantryStore = {
  has: (id) => pantry.has(id),
  get size() { return pantry.size; },
  set: () => pantry,
  toggle(id) {
    pantry.has(id) ? pantry.delete(id) : pantry.add(id);
    commit();
    return pantry.has(id);
  },
  clear() { pantry.clear(); commit(); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
};

function commit() {
  save('pantry', [...pantry]);
  listeners.forEach((fn) => fn());
}
