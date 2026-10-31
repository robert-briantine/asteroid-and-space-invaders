import { Page } from '@playwright/test';

// Hook debug exposé par public/main.js sur window.__debug
export type Debug = {
  ship: { x: number; y: number; angle: number; speed: number };
  blocks: any[];
  bullets: any[];
  score: number;
  blockSpeeds: number[];
  gameOver: boolean;
  bestScore: number;
  scoreHistory: any[];
  started: boolean;
  damageShip(): void;
  resetScores(): void;
  recordScore(): void;
  powerups: any[];
  bulletAmmo: number;
  waveAmmo: number;
  bulletStreams: number;
  waveLevel: number;
  lives: number;
  shipExploding: boolean;
  setLives(n: number): void;
  damageShipForTest(): void;
  weapon: string;
  waves: any[];
  setWeapon(w: 'bullet' | 'wave'): void;
  setBulletAmmo(n: number): void;
  setWaveAmmo(n: number): void;
  fireWave(): void;
  level: number;
  enemyBullets: any[];
  setBlockPos(index: number, x: number, y: number): void;
  clearBlockCells(index: number): void;
  removeBlock(index: number): void;
  fireBullet(): void;
  removeBlockCells(index: number, count: number): void;
  keys: Set<string>;
  reset(): void;
  startLevel(n: number, diff?: string): void;
  totalLevels: number;
  allLevelsCleared: boolean;
  currentLevelDef: any;
  difficulty: string;
  setDifficulty(d: string): void;
  levelStartTime: number;
  spawnedPowerupIdx: number;
  blockPositions: { x: number; y: number; spriteName: string }[];
  asteroidPositions: { x: number; y: number; r: number; n: number }[];
  asteroids: any[];
  spawnAsteroidForTest(n?: number, x?: number, y?: number): void;
  setShipPos(x: number, y: number): void;
  spawnPowerupForTest(type?: string): void;
  shootAtAsteroid(asteroidIndex: number): void;
};

// Charge la page et attend que levels.json (20 niveaux) soit chargé
export async function loadGame(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);
  await page.waitForFunction(() => (window as any).__debug.totalLevels === 20);
}

export function debug(page: Page) {
  return page.evaluate(() => (window as any).__debug) as Promise<Debug>;
}

// Appuie sur une touche avec un délai suffisant pour être vu par la boucle rAF
export async function pressKey(page: Page, key: string, ms = 150) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

// Provoque un game over depuis l'état courant (perd toutes les vies restantes)
export async function forceGameOver(page: Page) {
  await page.evaluate(() => {
    const d = (window as any).__debug;
    while (!d.gameOver) d.damageShip();
  });
}
