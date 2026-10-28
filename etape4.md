# Étape 4 — Déplacement autonome des blocs et changement de direction

## Actions de code

| # | Action | But |
|---|--------|-----|
| 4.1 | Chaque bloc a un vecteur `dir` (angle) et une vitesse initiale `speed` ; à chaque frame : `x += cos(dir)*speed*dt`, `y += sin(dir)*speed*dt` | Les blocs se déplacent comme les astéroïdes d'Asteroids, mais en blocs |
| 4.2 | Rebond sur les bords du canvas : si le bloc sort d'un bord, inverser la composante correspondante de `dir` (`dir = -dir` ou réflexion du vecteur) | Les blocs restent visibles sur l'écran indéfiniment |
| 4.3 | Changement de direction aléatoire : toutes les 2–5 s (timer par bloc), `dir += random(-0.6, 0.6)` rad | Spécification « ils peuvent aussi changer de direction » — mouvement imprévisible sans être chaotique |
| 4.4 | Exposer `window.__debug.blockSpeeds()` renvoyant le tableau des vitesses courantes | Permettre aux tests de vérifier que la vitesse augmente quand les cellules sont perdues (étape suivante) |

## Tests Playwright

Fichier : `tests/etape4.spec.ts` — commande : `npx playwright test tests/etape4.spec.ts`

| Test | Ce qu'il vérifie |
|------|------------------|
| Capturer `__debug.blocks[0].x/y`, attendre 1 s → position a changé | Les blocs bougent réellement |
| Placer un bloc près d'un bord via `page.evaluate` (modifier `__debug.blocks[0]`), attendre le rebond → le bloc est revenu dans le canvas | Le rebond aux bords fonctionne |
| Attendre ~6 s → au moins un bloc a une `dir` différente de sa valeur initiale (comparaison avant/après) | Le changement de direction aléatoire se produit |
| Pendant tout le test, `pageErrors.length === 0` | Pas de crash pendant les rebonds |

**Notes :** pour forcer un bloc près d'un bord, utiliser `page.evaluate(() => { const b = window.__debug.blocks[0]; b.x = 5; })` plutôt que d'attendre que le jeu y amène naturellement le bloc — sinon le test prendrait trop longtemps.
