# Étape 7 — Collision vaisseau ↔ blocs, game over et réinitialisation

## Actions de code

| # | Action | But |
|---|--------|-----|
| 7.1 | À chaque frame, tester la collision du rectangle du vaisseau avec les cellules pleines de chaque bloc (pas un cercle, pour rester cohérent avec le look pixel-art) | Le joueur peut mourir en touchant un ennemi, comme dans Space Invaders |
| 7.2 | En cas de collision → `gameOver = true`, figer la boucle de jeu (ne plus mettre à jour positions ni tir), afficher « GAME OVER » au centre du canvas | Fin de partie claire et lisible |
| 7.3 | Exposer `window.__debug.gameOver` et `window.__debug.reset()` qui remet le vaisseau, les blocs, le score et `gameOver` à leur état initial | Permettre aux tests de déclencher et de sortir d'un game over sans recharger la page |
| 7.4 | Après game over, appuyer sur `Space` ou cliquer → appeler `reset()` et reprendre la partie | Redémarrage rapide sans F5 |

## Tests Playwright

Fichier : `tests/etape7.spec.ts` — commande : `npx playwright test tests/etape7.spec.ts`

| Test | Ce qu'il vérifie |
|------|------------------|
| Forcer un bloc sur la position du vaisseau via `page.evaluate` → attendre 1 frame → `__debug.gameOver === true` | La collision déclenche bien le game over |
| Après game over, attendre 1 s → `__debug.ship.x/y` n'a pas changé | La boucle est bien figée |
| Appuyer sur `Space` → `__debug.gameOver === false`, `__debug.score === 0`, les blocs sont régénérés | Le reset fonctionne complètement |
| Pendant tout le test, `pageErrors.length === 0` | Pas de crash pendant la transition game over / reset |

**Notes :** ne pas tester la collision par screenshot — forcer la position du bloc via `page.evaluate` est déterministe et rapide. Vérifier que `reset()` remet aussi les timers de cooldown à `-Infinity`, sinon le premier tir après un reset serait bloqué.
