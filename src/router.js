// Routeur par hash : #/route/param ; une vue peut exposer el.cleanup() appelé en quittant
const routes = new Map();
let notFound = null;
let cleanup = null;

export function route(name, render) { routes.set(name, render); }
export function fallback(render) { notFound = render; }

export function parse() {
  const [name = '', ...params] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  return { name, params };
}

export function go(path) { location.hash = '#/' + path; }

export function start(outlet, onChange) {
  const render = () => {
    cleanup?.();
    cleanup = null;
    const { name, params } = parse();
    const view = routes.get(name) || notFound;
    document.body.dataset.route = name;
    const el = view(...params);
    cleanup = el.cleanup ?? null;
    outlet.replaceChildren(el);
    outlet.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    onChange?.(name);
  };
  addEventListener('hashchange', render);
  render();
}
