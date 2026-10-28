# Étape 3 — Blocs-ennemis au look Space Invaders (sprites pixel-art verts)

## Actions de code

| # | Action | But |
|---|--------|-----|
| 3.1 | Créer `src/game/blocks.ts` : interface `Block { x, y, cells: boolean[][], cols, rows, dir, speed }` où chaque cellule est un pixel du sprite | Modéliser un bloc comme une grille de cellules (pas un astéroïde circulaire) — c'est ce qui remplace les astéroïdes d'Asteroids |
| 3.2 | Définir 3 sprites Space Invaders classiques en tableaux 0/1 (crab ~11×8, octopus ~12×10, saucer ~8×6), chacun avec ses 2 frames d'animation | Reproduire le look pixel-art vert classique des Space Invaders |
| 3.3 | Générer N blocs aléatoires à l'écran (positions non chevauchantes, type choisi au hasard parmi les 3 sprites) | Remplacer la génération d'astéroïdes par plusieurs blocs répartis sur l'écran |
| 3.4 | Dessin : pour chaque cellule pleine, `ctx.fillRect(x + i*CELL, y + j*CELL, CELL, CELL)` en vert (`#33ff66`) ; alterner les 2 frames toutes les ~500 ms | Rendu pixel-art authentique plutôt qu'un polygone |
| 3.5 | Effets de lumière : `ctx.shadowColor = '#33ff66'`, `ctx.shadowBlur = 12` pendant le dessin des cellules, puis reset | Halo lumineux autour des ennemis pour un rendu esthétique (spécification « effets de lumière ») |
| 3.6 | Exposer `window.__debug.blocks` (tableau des blocs avec positions et grilles de cellules) | Permettre aux tests de compter les blocs et vérifier leur placement sans screenshot |

## Tests Playwright

Fichier : `tests/etape3.spec.ts` — commande : `npx playwright test tests/etape3.spec.ts`

| Test | Ce qu'il vérifie |
|------|------------------|
| Après chargement, `__debug.blocks.length >= 5` | Plusieurs blocs sont présents sur l'écran |
| Chaque bloc a `cols > 0`, `rows > 0` et sa grille contient au moins une cellule pleine | Les sprites sont bien des grilles de cellules, pas des cercles |
| Les positions des blocs ne se chevauchent pas (test de recouvrement des rectangles) | Répartition correcte sur l'écran |
| Attendre 1 s → `pageErrors.length === 0` et le canvas n'est pas vide (compter les pixels verts via `getImageData` sur une zone restreinte) | L'animation des frames tourne sans crash |

**Notes :** le comptage de pixels verts doit se faire sur une petite région (ex. 100×100 px autour d'un bloc connu via `__debug.blocks[0]`), jamais sur tout le canvas, sinon le test est lent et flaky.
