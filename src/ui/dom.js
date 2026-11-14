// Mini helper de création DOM : h('div.classe#id', {attrs}, ...enfants)
export function h(tag, attrs = {}, ...children) {
  const [, name = 'div', rest = ''] = tag.match(/^([a-z0-9-]*)(.*)$/i);
  const el = document.createElement(name || 'div');
  rest.replace(/([.#])([\w-]+)/g, (_, t, v) => (t === '.' ? el.classList.add(v) : (el.id = v)));
  if (attrs instanceof Node || typeof attrs !== 'object' || Array.isArray(attrs)) {
    children.unshift(attrs);
    attrs = {};
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}
