# Étape 5 — Tir du joueur et destruction des cellules

## Actions de code

| # | Action | But |
|---|--------|-----|
| 5.1 | Créer `src/game/bullets.ts` : interface `Bullet { x, y, vx, vy }` ; tir avec la barre espace (cooldown ~300 ms, timer initialisé à `-Infinity`) | Le joueur peut tirer ; le cooldown évite le spam mais ne bloque pas le premier tir |
| 5.2 | La balle part de la position du vaisseau dans sa direction (`vx = cos(angle)*BULLET_SPEED`, `vy = sin(angle)*BULLET_SPEED`) | Le tir suit l'orientation du vaisseau, cohérent avec les contrôles Asteroids |
| 5.3 | Collision balle ↔ bloc : si la balle tombe sur une cellule pleine du bloc → cette cellule passe à `false`, la balle est supprimée, score +10 | Les blocs se dégradent cellule par cellule au lieu d'exploser d'un coup |
| 5.4 | Quand toutes les cellules d'un bloc sont perdues → le bloc est retiré de la liste, score +100 bonus | Récompenser la destruction complète d'un ennemi |
| 5.5 | Exposer `window.__debug.score` et `window.__debug.bullets` | Permettre aux tests d'asserter le score et le nombre de balles en vol |

## Tests Playwright

Fichier : `tests/etape5.spec.ts` — commande : `npx playwright test tests/etape5.spec.ts`

| Test | Ce qu'il vérifie |
|------|------------------|
| Appuyer sur `Space` (via `keyboard.down('Space')` + `waitForTimeout(100)` + `up`) → `__debug.bullets.length === 1` | Le tir fonctionne |
| Attendre 400 ms sans retirer → `__debug.bullets.length` revient à 0 ou 1 selon la sortie d'écran | Le cooldown et la disparition hors écran fonctionnent |
| Forcer un bloc juste devant le vaisseau via `page.evaluate`, tirer → la grille du bloc perd une cellule et `__debug.score` augmente de 10 | La collision détruit bien une cellule |
| Vider manuellement toutes les cellules d'un bloc via `page.evaluate` → le bloc disparaît et le score gagne 100 | La destruction complète retire le bloc |

**Notes :** le timer de cooldown doit être initialisé à `-Infinity` (pas `0` ni `performance.now()`), sinon le premier tir est bloqué par la condition de cooldown. Pour forcer la collision, modifier directement `__debug.blocks[0].x/y` plutôt que d'essayer d'aligner le vaisseau par jeu réel.
