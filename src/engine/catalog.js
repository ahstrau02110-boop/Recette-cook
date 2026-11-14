import { norm } from './text.js';

// Index du catalogue d'ingrédients : accès par id, recherche par nom/synonyme
export function createCatalog(data) {
  const byId = new Map();
  const categories = data.catégories.map((c) => ({ ...c, ingrédients: c.ingrédients.map((i) => i.id) }));
  const entries = [];
  for (const c of data.catégories) {
    for (const i of c.ingrédients) {
      const item = { ...i, catégorie: c.id };
      byId.set(i.id, item);
      entries.push({ item, keys: [norm(i.nom), norm(i.id.replace(/_/g, ' ')), ...i.synonymes.map(norm)] });
    }
  }

  // Score : 3 = égalité, 2 = début de mot, 1 = contient
  function rank(keys, q) {
    let best = 0;
    for (const k of keys) {
      if (k === q) return 3;
      if (k.startsWith(q) || k.includes(' ' + q)) best = Math.max(best, 2);
      else if (k.includes(q)) best = Math.max(best, 1);
    }
    return best;
  }

  return {
    categories,
    get: (id) => byId.get(id),
    all: () => [...byId.values()],
    /** Recherche tolérante (accents, synonymes). Requête vide = tout le catalogue. */
    search(query) {
      const q = norm(query);
      if (!q) return [...byId.values()];
      return entries
        .map((e) => ({ item: e.item, s: rank(e.keys, q) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s || a.item.nom.localeCompare(b.item.nom, 'fr'))
        .map((r) => r.item);
    },
    /** Retrouve l'id d'un ingrédient depuis un libellé libre (nom ou synonyme exact). */
    resolve(label) {
      const q = norm(label);
      return entries.find((e) => e.keys.includes(q))?.item.id ?? null;
    }
  };
}
