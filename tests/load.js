import { readFileSync } from 'node:fs';
export const load = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
