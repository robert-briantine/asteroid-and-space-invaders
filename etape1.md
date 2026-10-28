# Étape 1 — Squelette du projet (Node.js + Express + TypeScript)

## Actions de code

| # | Action | But |
|---|--------|-----|
| 1.1 | `npm init -y` puis installer les dépendances : `express`, `typescript`, `ts-node`, `@types/express`, `@types/node` | Mettre en place le serveur Node.js et la chaîne de compilation TypeScript |
| 1.2 | Créer `tsconfig.json` avec `"outDir": "dist"`, `"rootDir": "src"`, `"module": "commonjs"`, `"target": "ES2020"` | Compiler le code source TypeScript vers du JS exécutable par Node |
| 1.3 | Créer `src/server.ts` : serveur Express qui sert un dossier `public/` en statique et une route `/healthz` renvoyant `{ ok: true }` | Fournir l'URL d'accès au jeu (`http://localhost:3000`) et un endpoint de test non ambigu |
| 1.4 | Ajouter dans `package.json` les scripts : `"build": "tsc"`, `"start": "node dist/server.js"`, `"dev": "ts-node src/server.ts"` | Permettre de lancer le serveur en dev ou en prod sans taper les commandes à la main |
| 1.5 | Créer `public/index.html` minimal avec un `<canvas id="game">` plein écran et un `<script type="module" src="/main.js">` | Point d'entrée navigateur du jeu ; le canvas sera le support de rendu |
| 1.6 | Installer Playwright : `npm i -D @playwright/test` puis `npx playwright install chromium` | Préparer l'outil de vérification headless utilisé à chaque étape |
| 1.7 | Créer `playwright.config.ts` (base URL `http://localhost:3000`, 1 worker, timeout 30 s) et le dossier `tests/` | Standardiser la configuration des tests pour toutes les étapes suivantes |

## Tests Playwright

Fichier : `tests/etape1.spec.ts` — commande : `npx playwright test tests/etape1.spec.ts`

| Test | Ce qu'il vérifie |
|------|------------------|
| `GET /healthz` via `request.get()` renvoie 200 et `{ ok: true }` | Le serveur Express tourne et répond |
| La page `/` charge sans erreur console ni exception page-level (`pageerror`) | L'HTML et le script se chargent proprement |
| Un élément `#game` (canvas) est visible sur la page | Le squelette DOM est en place |

**Notes :** avant chaque run, démarrer le serveur en arrière-plan (`npm run dev` ou `node dist/server.js`) et le tuer après ; ne jamais tuer un processus qui n'est pas celui du serveur du projet.
