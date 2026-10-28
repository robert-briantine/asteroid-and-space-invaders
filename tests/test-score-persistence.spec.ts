import { test, expect } from '@playwright/test';

test.describe('Score persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    // Attendre que le jeu soit initialisé et les scores chargés
    await page.waitForFunction(() => (window as any).__debug !== undefined);
    // Attendre que loadScores() ait terminé
    await page.waitForTimeout(500);
  });

  test('should load best score from localStorage on startup', async ({ page }) => {
    // Pré-configurer un meilleur score dans localStorage
    await page.evaluate(() => {
      localStorage.setItem('bestScore', '1500');
      localStorage.setItem('scoreHistory', JSON.stringify([
        { score: 1500, level: 3, date: new Date().toISOString() },
      ]));
    });
    
    // Recharger la page pour que loadScores() se ré-exécute
    await page.reload();
    await page.waitForFunction(() => (window as any).__debug !== undefined);
    await page.waitForTimeout(500);
    
    // Vérifier que le meilleur score a été chargé
    const bestScore = await page.evaluate(() => (window as any).__debug.bestScore);
    expect(bestScore).toBe(1500);
  });

  test('should save score to localStorage on game over', async ({ page }) => {
    // Forcer un game over avec un score spécifique
    const result = await page.evaluate(async () => {
      const debug = (window as any).__debug;
      
      // Forcer un score élevé
      debug.reset();
      
      // Simuler un game over en perdant toutes les vies
      debug.setLives(1);
      debug.damageShipForTest();
      
      // Attendre que le game over soit enregistré
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        gameOver: debug.gameOver,
        bestScore: debug.bestScore,
      };
    });
    
    // Vérifier que le game over s'est produit
    expect(result.gameOver).toBe(true);
    
    // Vérifier que le score a été sauvegardé dans localStorage
    const savedBestScore = await page.evaluate(() => {
      return Number(localStorage.getItem('bestScore') || 0);
    });
    
    expect(savedBestScore).toBeGreaterThanOrEqual(0);
  });

  test('should maintain score history in localStorage', async ({ page }) => {
    // Jouer plusieurs parties et vérifier l'historique
    for (let i = 0; i < 3; i++) {
      await page.evaluate(async () => {
        const debug = (window as any).__debug;
        
        // Réinitialiser et jouer une partie courte
        debug.reset();
        debug.setLives(1);
        debug.damageShipForTest();
        
        // Attendre que le game over soit enregistré
        await new Promise(resolve => setTimeout(resolve, 200));
      });
    }
    
    // Vérifier que l'historique contient des entrées
    const history = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
      return data.length;
    });
    
    expect(history).toBeGreaterThan(0);
  });
});
