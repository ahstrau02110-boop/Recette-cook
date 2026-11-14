import '@fontsource/cinzel-decorative/700.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import './styles/theme.css';

import { route, fallback, start, go } from './router.js';
import { startSparkles } from './ui/sparkles.js';
import { setupPwa } from './pwa.js';
import { placeholder } from './views/placeholder.js';

route('garde-manger', placeholder('Garde-manger', '🧺', 'Cochez ici les ingrédients disponibles pour découvrir les recettes réalisables.'));
route('recettes', placeholder('Recettes', '📜', 'Les recettes réalisables avec votre Cookeo+ apparaîtront ici, classées par score.'));
route('favoris', placeholder('Favoris', '⭐', 'Vos recettes préférées seront rassemblées ici.'));
route('courses', placeholder('Courses', '🛒', 'La liste de courses se remplira avec les ingrédients manquants.'));
fallback(() => (go('garde-manger'), document.createDocumentFragment()));

const tabs = document.querySelectorAll('.tabbar a');
start(document.getElementById('app'), (name) => {
  tabs.forEach((a) => a.classList.toggle('active', a.dataset.route === name));
});

startSparkles(document.getElementById('sparkles'));
setupPwa(document.getElementById('install-btn'));
