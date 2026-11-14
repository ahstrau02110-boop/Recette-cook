// Liste de courses : fusion des besoins par ingrédient et par unité
// item : { id, qtés: { [unité]: nombre | null }, recettes: [ids], coché }

/** Ajoute des besoins [{ nom, quantité, unité }] issus d'une recette */
export function addToList(list, needs, recipeId) {
  const out = list.map((i) => ({ ...i, qtés: { ...i.qtés }, recettes: [...i.recettes] }));
  for (const n of needs) {
    let item = out.find((i) => i.id === n.nom);
    if (!item) {
      item = { id: n.nom, qtés: {}, recettes: [], coché: false };
      out.push(item);
    } else item.coché = false; // nouveau besoin : à racheter
    const u = n.unité || '';
    if (n.quantité == null) item.qtés[u] ??= null;
    else item.qtés[u] = (item.qtés[u] ?? 0) + n.quantité;
    if (recipeId && !item.recettes.includes(recipeId)) item.recettes.push(recipeId);
  }
  return out;
}

export const toggleItem = (list, id) => list.map((i) => (i.id === id ? { ...i, coché: !i.coché } : i));
export const removeChecked = (list) => list.filter((i) => !i.coché);
