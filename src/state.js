// État applicatif persistant (localStorage) : garde-manger, favoris, courses, filtres
import { load, save } from './store.js';
import { addToList, toggleItem, removeChecked } from './engine/shopping.js';
import { DEFAULT_FILTERS } from './engine/filters.js';

function observable(key, initial) {
  let value = load(key, initial);
  const listeners = new Set();
  return {
    get: () => value,
    set(v) {
      value = v;
      save(key, v);
      listeners.forEach((fn) => fn(v));
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
}

// Ensemble d'ids (garde-manger, favoris)
function idSet(key) {
  const o = observable(key, []);
  let set = new Set(o.get());
  o.subscribe((v) => (set = new Set(v)));
  return {
    has: (id) => set.has(id),
    get size() { return set.size; },
    set: () => set,
    toggle(id) {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      o.set([...next]);
      return next.has(id);
    },
    clear: () => o.set([]),
    subscribe: o.subscribe
  };
}

export const pantryStore = idSet('pantry');
export const favStore = idSet('favoris');

const shopping = observable('courses', []);
export const shoppingStore = {
  get: shopping.get,
  add: (needs, recipeId) => shopping.set(addToList(shopping.get(), needs, recipeId)),
  toggle: (id) => shopping.set(toggleItem(shopping.get(), id)),
  removeChecked: () => shopping.set(removeChecked(shopping.get())),
  clear: () => shopping.set([]),
  subscribe: shopping.subscribe
};

const filters = observable('filtres', DEFAULT_FILTERS);
export const filterStore = {
  get: () => ({ ...DEFAULT_FILTERS, ...filters.get() }),
  update: (patch) => filters.set({ ...filterStore.get(), ...patch }),
  reset: () => filters.set(DEFAULT_FILTERS),
  subscribe: filters.subscribe
};
