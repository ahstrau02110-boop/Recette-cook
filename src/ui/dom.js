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

// Bouton à double clic de confirmation (confirm() est bloqué dans certains contextes)
export function confirmButton(label, armedLabel, action, cls = '.btn.btn-ghost') {
  let timer = null;
  const b = h(`button${cls}`, { type: 'button' }, label);
  b.onclick = () => {
    if (b.classList.contains('armed')) {
      clearTimeout(timer);
      b.classList.remove('armed');
      b.textContent = label;
      action();
      return;
    }
    b.classList.add('armed');
    b.textContent = armedLabel;
    timer = setTimeout(() => { b.classList.remove('armed'); b.textContent = label; }, 3000);
  };
  return b;
}
