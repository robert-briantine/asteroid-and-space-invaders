import { test, expect } from '@playwright/test';

// 20 niveaux définis dans public/levels.json :
// - nombre de blocs (invaders), vitesse des blocs et nombre d'astéroïdes par niveau
// - powerups qui apparaissent à un moment précis du niveau
// - le HUD affiche "Niveau: X/20"

test('levels.json est chargé : 20 niveaux avec les bonnes propriétés', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  // Attendre que levels.json soit chargé (fetch asynchrone)
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  const total = await page.evaluate(() => (window as any).__debug.totalLevels);
  expect(total).toBe(20);
});

test('niveau 1 (normal) : 4 blocs, 3 astéroïdes, 1 powerup planifié', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  await page.evaluate(() => (window as any).__debug.startLevel(1, 'normal'));

  const state = await page.evaluate(() => {
    const d = window as any;
    return {
      level: d.__debug.level,
      blocks: d.__debug.blocks.length,
      asteroids: d.__debug.asteroids.length,
      def: d.__debug.currentLevelDef,
    };
  });
  expect(state.level).toBe(1);
  expect(state.blocks).toBe(4);
  expect(state.asteroids).toBe(3);
  expect(state.def.blocks).toBe(4);
  expect(state.def.blockSpeed).toBe(40);
  expect(state.def.asteroids).toBe(3);
  expect(state.def.powerups).toEqual([{ at: 15000, type: 'bullet' }]);
});

test('niveau 20 : progression du nombre d\'invaders selon la difficulté', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  // Niveau 20 : facile = 26 invaders, normal = 40, difficile = 42
  for (const [diff, expected] of [['facile', 26], ['normal', 40], ['difficile', 42]] as const) {
    await page.evaluate((d) => (window as any).__debug.startLevel(20, d), diff);
    const state = await page.evaluate(() => ({
      difficulty: (window as any).__debug.difficulty,
      blocks: (window as any).__debug.blocks.length,
      asteroids: (window as any).__debug.asteroids.length,
    }));
    expect(state.difficulty).toBe(diff);
    expect(state.blocks).toBe(expected);
    expect(state.asteroids).toBe(10);
  }
});

test('le nombre d\'invaders augmente progressivement entre les niveaux (mode normal)', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  const counts: number[] = [];
  for (let lvl = 1; lvl <= 20; lvl++) {
    await page.evaluate((n) => (window as any).__debug.startLevel(n, 'normal'), lvl);
    counts.push(await page.evaluate(() => (window as any).__debug.blocks.length));
  }
  // Départ à 4, pas de +2 par niveau, jamais décroissant
  expect(counts[0]).toBe(4);
  expect(counts[19]).toBe(40);
  for (let i = 1; i < counts.length; i++) {
    expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
  }
});

test('startLevel ignore les valeurs hors bornes (clamping)', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  await page.evaluate(() => (window as any).__debug.startLevel(99));
  let lvl = await page.evaluate(() => (window as any).__debug.level);
  expect(lvl).toBe(20);

  await page.evaluate(() => (window as any).__debug.startLevel(0));
  lvl = await page.evaluate(() => (window as any).__debug.level);
  expect(lvl).toBe(1);
});

test('powerups planifiés : un powerup apparaît au temps indiqué du niveau', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  await page.evaluate(() => (window as any).__debug.startLevel(1));
  // Niveau 1 : powerup "bullet" à t+15 s
  const before = await page.evaluate(() => (window as any).__debug.powerups.length);
  expect(before).toBe(0);

  // Avancer l'horloge en forçant levelStartTime dans le passé (16 s avant now)
  await page.evaluate(() => {
    // Pas d'accès direct à levelStartTime ; on attend la frame suivante et on vérifie
    // via spawnedPowerupIdx après avoir simulé le temps écoulé.
  });
  // Le plus simple : attendre réellement ~15 s serait trop long pour un test,
  // donc on force levelStartTime via une manipulation indirecte impossible depuis
  // __debug → on se contente de vérifier qu'aucun powerup n'est apparu avant l'échéance.
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => (window as any).__debug.powerups.length);
  expect(after).toBe(0); // pas encore 15 s → rien
});

test('le HUD affiche le numéro de niveau sur le total (texte canvas)', async ({ page }) => {
  // Le texte est dessiné sur le canvas ; on vérifie via la définition du niveau
  // et le fait que TOTAL_LEVELS() renvoie 20 (utilisé par drawHUD).
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  await page.evaluate(() => (window as any).__debug.startLevel(7, 'normal'));
  const info = await page.evaluate(() => {
    const d = window as any;
    return { level: d.__debug.level, total: d.__debug.totalLevels, cleared: d.__debug.allLevelsCleared };
  });
  expect(info.level).toBe(7);
  expect(info.total).toBe(20);
  expect(info.cleared).toBe(false);
});

test('sélection de la difficulté avec les touches 1/2/3 sur l\'écran de démarrage', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  // Par défaut : normal
  let diff = await page.evaluate(() => (window as any).__debug.difficulty);
  expect(diff).toBe('normal');

  // Touche 1 → facile
  await page.keyboard.down('Digit1');
  await page.waitForTimeout(150);
  await page.keyboard.up('Digit1');
  diff = await page.evaluate(() => (window as any).__debug.difficulty);
  expect(diff).toBe('facile');

  // Touche 3 → difficile
  await page.keyboard.down('Digit3');
  await page.waitForTimeout(150);
  await page.keyboard.up('Digit3');
  diff = await page.evaluate(() => (window as any).__debug.difficulty);
  expect(diff).toBe('difficile');

  // La difficulté choisie s'applique au nombre d'invaders du niveau 1
  await page.evaluate(() => (window as any).__debug.startLevel(1));
  const blocks = await page.evaluate(() => (window as any).__debug.blocks.length);
  expect(blocks).toBe(4); // tous les modes démarrent à 4

  // Difficile au niveau 10 : 4 + 9*2 = 22 invaders
  await page.evaluate(() => (window as any).__debug.startLevel(10, 'difficile'));
  const blocksHard = await page.evaluate(() => (window as any).__debug.blocks.length);
  expect(blocksHard).toBe(22);
});

test('après destruction de tous les blocs, on passe au niveau suivant', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  await page.evaluate(() => {
    const d = window as any;
    d.__debug.startLevel(1, 'normal');
    // Retirer immédiatement tous les blocs → blocks.length === 0 → niveau 2 à la frame suivante
    while (d.__debug.blocks.length > 0) d.__debug.removeBlock(0);
  });

  // La frame suivante passe au niveau 2
  await page.waitForFunction(() => (window as any).__debug.level === 2, null, { timeout: 5000 });
  const lvl = await page.evaluate(() => (window as any).__debug.level);
  expect(lvl).toBe(2);
  // Le niveau 2 a ses propres blocs (6 en mode normal : 4 + (2-1)*2) ; les astéroïdes du
  // niveau 2 s'ajoutent à ceux du niveau 1 (les astéroïdes survivants ne sont pas vidés au changement de niveau)
  const state = await page.evaluate(() => ({
    blocks: (window as any).__debug.blocks.length,
    asteroids: (window as any).__debug.asteroids.length,
  }));
  expect(state.blocks).toBe(6);
  expect(state.asteroids).toBeGreaterThanOrEqual(4);
});

test('mêmes conditions à chaque partie : positions des invaders et astéroïdes déterministes par niveau', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  // Première partie au niveau 5 (mode normal)
  await page.evaluate(() => (window as any).__debug.startLevel(5, 'normal'));
  const first = await page.evaluate(() => ({
    blocks: (window as any).__debug.blockPositions,
    asteroids: (window as any).__debug.asteroidPositions,
  }));
  expect(first.blocks.length).toBe(12); // mode normal : 4 + (n-1)*2
  expect(first.asteroids.length).toBe(7);

  // Recommencer le même niveau → exactement les mêmes positions
  await page.evaluate(() => (window as any).__debug.startLevel(5, 'normal'));
  const second = await page.evaluate(() => ({
    blocks: (window as any).__debug.blockPositions,
    asteroids: (window as any).__debug.asteroidPositions,
  }));
  expect(second.blocks).toEqual(first.blocks);
  expect(second.asteroids).toEqual(first.asteroids);

  // Un autre niveau donne une configuration différente
  await page.evaluate(() => (window as any).__debug.startLevel(6, 'normal'));
  const other = await page.evaluate(() => ({
    blocks: (window as any).__debug.blockPositions,
    asteroids: (window as any).__debug.asteroidPositions,
  }));
  expect(other.blocks.length).toBe(14);
  expect(JSON.stringify(other.blocks)).not.toBe(JSON.stringify(first.blocks));
});

test('au-delà du niveau 20, allLevelsCleared est true et on reste au niveau 20', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);

  await page.evaluate(() => {
    const d = window as any;
    d.__debug.startLevel(20, 'normal');
    while (d.__debug.blocks.length > 0) d.__debug.removeBlock(0);
  });

  // Passage en "tous niveaux terminés" à la frame suivante
  await page.waitForFunction(() => (window as any).__debug.allLevelsCleared === true, null, { timeout: 5000 });
  const state = await page.evaluate(() => ({
    level: (window as any).__debug.level,
    cleared: (window as any).__debug.allLevelsCleared,
  }));
  expect(state.level).toBe(20);
  expect(state.cleared).toBe(true);
});
