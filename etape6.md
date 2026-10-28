# Étape 6 — Vitesse croissante des blocs quand ils perdent des cellules

## Actions de code

| # | Action | But |
|---|--------|-----|
| 6.1 | Calculer le ratio de cellules restantes : `ratio = cellsRestantes / cellsInitiales` (stocker `cellsInitiales` à la création du bloc) | Mesurer l'usure du bloc pour piloter sa vitesse |
| 6.2 | À chaque frame, `block.speed = BASE_SPEED * (1 + (1 - ratio) * SPEED_FACTOR)` avec `SPEED_FACTOR ≈ 2` (un bloc à moitié détruit va ~1,5× plus vite, un bloc presque mort ~3×) | Spécification « se déplace de plus en plus vite au fur et à mesure qu'il perd des cellules » |
| 6.3 | Appliquer cette vitesse dans le déplacement de l'étape 4 (`x += cos(dir)*speed*dt`) | La formule est effective immédiatement, pas seulement affichée |
| 6.4 | Exposer `window.__debug.blockSpeeds()` mis à jour à chaque frame | Permettre aux tests de mesurer la corrélation usure ↔ vitesse |

## Tests Playwright

Fichier : `tests/etape6.spec.ts` — commande : `npx playwright test tests/etape6.spec.ts`

| Test | Ce qu'il vérifie |
|------|------------------|
| Bloc neuf (toutes ses cellules) → `__debug.blockSpeeds()[0]` ≈ `BASE_SPEED` | Vitesse de base correcte au départ |
| Via `page.evaluate`, retirer la moitié des cellules d'un bloc → attendre 1 frame → sa vitesse a augmenté (~1,5×) | La vitesse suit bien la perte de cellules |
| Retirera toutes les cellules sauf une → vitesse proche de `BASE_SPEED * 3` | Le facteur s'applique jusqu'à l'usure maximale |
| Pendant tout le test, `pageErrors.length === 0` | Pas de division par zéro ni de crash quand le bloc est presque vide |

**Notes :** éviter de diviser par le nombre de cellules restantes (qui peut être 0 juste avant la destruction) — toujours diviser par `cellsInitiales`. Vérifier que le test ne dépend pas du timing exact de la frame : comparer les vitesses avec une tolérance (±10 %), jamais à l'égalité stricte.
