# Étape 2 — Boucle de jeu et vaisseau du joueur (contrôles directionnels)

## Actions de code

| # | Action | But |
|---|--------|-----|
| 2.1 | Créer `src/game/types.ts` : interfaces `Ship { x, y, angle, speed }`, `Vec2 { x, y }`, constantes du canvas (`W`, `H`) | Typage partagé entre le moteur et les tests ; dimensions uniques pour tout le rendu |
| 2.2 | Créer `src/game/input.ts` : objet `keys: Set<string>` alimenté par `keydown`/`keyup` sur `window` (flèches + `ArrowLeft/Right/Up/Down`) | Capturer l'état des touches sans dépendre d'un framework |
| 2.3 | Dans la boucle `requestAnimationFrame` de `main.js` : si `ArrowLeft` est maintenue → `angle -= TURN_RATE * dt` ; si `ArrowRight` → `angle += TURN_RATE * dt` | Le curseur gauche/droit fait tourner le vaisseau (spécification Asteroids) |
| 2.4 | Si `ArrowUp` → `speed = min(speed + ACCEL * dt, MAX_SPEED)` ; si `ArrowDown` → `speed = max(speed - DECEL * dt, MIN_SPEED)` | Le curseur haut augmente la vitesse, le bas la diminue (plancher à 0 pour ne pas inverser la trajectoire) |
| 2.5 | Déplacement : `x += cos(angle) * speed * dt`, `y += sin(angle) * speed * dt`, avec rebond ou wrap-around aux bords du canvas | Le vaisseau avance dans sa direction selon sa vitesse courante |
| 2.6 | Dessiner le vaisseau : triangle orienté par `ctx.save()` / `ctx.translate(x, y)` / `ctx.rotate(angle)` / `ctx.restore()`, couleur cyan, léger glow via `shadowBlur` | Rendu lisible du vaisseau et de son orientation |
| 2.7 | Exposer `window.__debug = { ship, keys, reset() }` (ship = `{x, y, angle, speed}`) | Permettre aux tests Playwright d'asserter l'état du jeu directement au lieu de compter des pixels |

## Tests Playwright

Fichier : `tests/etape2.spec.ts` — commande : `npx playwright test tests/etape2.spec.ts`

| Test | Ce qu'il vérifie |
|------|------------------|
| Après chargement, `__debug.ship.speed === 0` et `pageErrors.length === 0` | État initial propre, pas de crash au démarrage |
| `keyboard.down('ArrowLeft')` + `waitForTimeout(150)` + `up` → `__debug.ship.angle` a diminué | La rotation gauche fonctionne |
| `keyboard.down('ArrowRight')` + `waitForTimeout(150)` + `up` → `__debug.ship.angle` a augmenté | La rotation droite fonctionne |
| `keyboard.down('ArrowUp')` + `waitForTimeout(200)` + `up` → `__debug.ship.speed > 0` | L'accélération fonctionne |
| Puis `keyboard.down('ArrowDown')` + `waitForTimeout(300)` + `up` → `__debug.ship.speed` revient à 0 | Le freinage fonctionne et ne descend pas sous 0 |
| Avec `speed > 0`, attendre ~500 ms → `__debug.ship.x` ou `.y` a changé | Le déplacement suit l'orientation |

**Notes :** utiliser systématiquement `keyboard.down` + `waitForTimeout` (≥ 80 ms) + `keyboard.up` — un `keyboard.press` est trop rapide pour une boucle `requestAnimationFrame` à 60 fps et le keydown peut être manqué entre deux frames. Initialiser les timers de cooldown éventuels à `-Infinity`, jamais à `0`.
