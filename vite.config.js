import { defineConfig } from 'vite';

// Chemins relatifs : fonctionne à la racine comme sous /Recette-cook/ (GitHub Pages)
export default defineConfig({
  base: './',
  build: { target: 'es2020' }
});
