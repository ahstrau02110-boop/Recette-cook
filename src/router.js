// Routeur par hash : #/route/param
const routes = new Map();
let notFound = null;

export function route(name, render) { routes.set(name, render); }
export function fallback(render) { notFound = render; }

export function parse() {
  const [name = '', ...params] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  return { name, params };
}

export function go(path) { location.hash = '#/' + path; }

export function start(outlet, onChange) {
  const render = () => {
    const { name, params } = parse();
    const view = routes.get(name) || notFound;
    outlet.replaceChildren(view(...params));
    outlet.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    onChange?.(name);
  };
  addEventListener('hashchange', render);
  render();
}
