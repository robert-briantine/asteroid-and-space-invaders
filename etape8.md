# Étape 8 — Score, HUD et polish final

## Actions de code

| # | Action | But |
|---|--------|-----|
| 8.1 | Afficher le score en haut à gauche du canvas (`ctx.fillText`, police monospace, couleur blanche) | Le joueur voit son score en permanence (spécification implicite d'un jeu jouable) |
| 8.2 | Ajouter un compteur de vies ou un simple « best score » persisté en `localStorage` | Donner une raison de rejouer après un game over |
| 8.3 | Effet visuel : petite particule verte quand une cellule est détruite (3–5 pixels qui s'éparpillent sur ~200 ms) | Feedback visuel immédiat au tir réussi, cohérent avec les effets de lumière de l'étape 3 |
| 8.4 | Fond étoilé statique (quelques points blancs aléatoires dessinés une fois) pour l'esthétique spatiale | Renforcer le thème Space Invaders / Asteroids sans coût de performance |
| 8.5 | Vérifier que `npm run build` compile sans erreur et que `npm start` sert bien la version compilée | Garantir que la version prod fonctionne, pas seulement le dev server |

## Tests Playwright

Fichier : `tests/etape8.spec.ts` — commande : `npx playwright test tests/etape8.spec.ts`

| Test | Ce qu'il vérifie |
|------|------------------|
| Après avoir forcé une destruction de cellule via `page.evaluate` + tir → le texte du score est visible dans le canvas (vérifiable via `__debug.score` croisé avec un screenshot optionnel) | Le HUD reflète bien le score interne |
| Après un game over puis reset → le score repart de 0 mais le best score est conservé (vérifier `localStorage`) | La persistance du best score fonctionne |
| Pendant une session de jeu normale (~10 s de contrôles), `pageErrors.length === 0` | Pas de régression globale |
| `npm run build && npm start` → recharger la page → le jeu tourne toujours sans erreur | La version compilée est fonctionnelle |

**Notes :** ne pas tester le rendu des particules par comparaison de pixels (flaky) — se contenter de vérifier l'absence d'erreur et l'absence de fuite mémoire (le tableau de particules doit être borné). Le test de la version compilée doit tuer proprement le serveur de dev avant de lancer `npm start`, sans toucher à d'autres processus.
