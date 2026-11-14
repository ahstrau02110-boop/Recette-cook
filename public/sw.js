// Service worker minimal : uniquement pour rendre l'app installable (pas de cache hors-ligne)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {}); // passage réseau direct
