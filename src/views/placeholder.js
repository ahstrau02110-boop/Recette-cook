import { h } from '../ui/dom.js';
import { burst } from '../ui/sparkles.js';

// Vue provisoire (phase 1) : remplacée par les vrais écrans en phase 3/4
export function placeholder(title, icon, text) {
  return () =>
    h('section.view',
      h('h2.title-deco', `${icon} ${title}`),
      h('div.divider', '✦'),
      h('article.parchment',
        h('h3', 'Quête en préparation'),
        h('p', text),
        h('button.btn', { type: 'button', onclick: (e) => burst(e.clientX, e.clientY) }, '✨ Tester la magie')
      )
    );
}
