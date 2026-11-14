import '@fontsource/cinzel-decorative/700.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import './styles/theme.css';
import './styles/views.css';

import { route, fallback, start, go } from './router.js';
import { startSparkles } from './ui/sparkles.js';
import { mountTimerWidget } from './ui/timer.js';
import { setupPwa } from './pwa.js';
import { placeholder } from './views/placeholder.js';
import { pantryView } from './views/pantry.js';
import { resultsView } from './views/results.js';
import { recipeView } from './views/recipe.js';
import { cookingView } from './views/cooking.js';

route('garde-manger', pantryView);
route('recettes', resultsView);
route('recette', recipeView);
route('cuisine', cookingView);
route('favoris', placeholder('Favoris', '⭐', 'Vos recettes préférées seront rassemblées ici.'));
route('courses', placeholder('Courses', '🛒', 'La liste de courses se remplira avec les ingrédients manquants.'));
fallback(() => (go('garde-manger'), document.createDocumentFragment()));

// Onglet actif (la fiche recette reste rattachée à « Recettes »)
const tabs = document.querySelectorAll('.tabbar a');
start(document.getElementById('app'), (name) => {
  const tab = name === 'recette' ? 'recettes' : name;
  tabs.forEach((a) => a.classList.toggle('active', a.dataset.route === tab));
});

mountTimerWidget(document.body);
startSparkles(document.getElementById('sparkles'));
setupPwa(document.getElementById('install-btn'));
