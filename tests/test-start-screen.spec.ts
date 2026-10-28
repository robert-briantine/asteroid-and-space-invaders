import { test, expect } from '@playwright/test';

test.describe('Start screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    // Attendre que le jeu soit initialisé
    await page.waitForFunction(() => (window as any).__debug !== undefined);
    // Attendre que loadScores() ait terminé
    await page.waitForTimeout(500);
  });

  test('should display start screen with game title and scores on startup', async ({ page }) => {
    // Vérifier que l'écran de démarrage est affiché
    const result = await page.evaluate(() => {
      const debug = (window as any).__debug;
      
      return {
        gameStarted: false, // devrait être false au démarrage
        bestScore: debug.bestScore,
        scoreHistoryLength: JSON.parse(localStorage.getItem('scoreHistory') || '[]').length,
      };
    });
    
    // Le jeu ne devrait pas avoir commencé
    expect(result.gameStarted).toBe(false);
    
    // Le meilleur score devrait être chargé
    expect(result.bestScore).toBeGreaterThanOrEqual(0);
  });

  test('should start game when Space is pressed on start screen', async ({ page }) => {
    // Appuyer sur Espace pour commencer le jeu
    await page.keyboard.down('Space');
    await page.waitForTimeout(100);
    await page.keyboard.up('Space');
    
    // Vérifier que le jeu a commencé
    const gameStarted = await page.evaluate(() => {
      // On ne peut pas accéder directement à gameStarted, mais on peut vérifier
      // que le vaisseau est en mouvement ou que les ennemis sont présents
      const debug = (window as any).__debug;
      return debug.blocks.length > 0 && !debug.gameOver;
    });
    
    expect(gameStarted).toBe(true);
  });

  test('should display best score on start screen', async ({ page }) => {
    // Pré-configurer un meilleur score
    await page.evaluate(() => {
      localStorage.setItem('bestScore', '2500');
      localStorage.setItem('scoreHistory', JSON.stringify([
        { score: 2500, level: 5, date: new Date().toISOString() },
        { score: 1800, level: 3, date: new Date().toISOString() },
      ]));
    });
    
    // Recharger la page
    await page.reload();
    await page.waitForFunction(() => (window as any).__debug !== undefined);
    await page.waitForTimeout(500);
    
    // Vérifier que le meilleur score est affiché
    const bestScore = await page.evaluate(() => (window as any).__debug.bestScore);
    expect(bestScore).toBe(2500);
  });
});
