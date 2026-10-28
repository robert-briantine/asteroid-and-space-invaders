// Boucle de jeu, vaisseau du joueur et blocs-ennemis (étapes 2 + 3)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// --- Configuration chargée depuis config.json (valeurs par défaut si échec) ---
let CONFIG = {
  ship: { turnRate: 3.0, accel: 150, decel: 200, maxSpeed: 400, minSpeed: 0 },
  bullets: { speed: 1500, cooldown: 100, cellSize: 6 },
  weapons: {
    bullet: { maxAmmo: 30, startAmmo: 10, parallelStreams: 1, streamsPerUpgrade: 1, spacing: 14, ammoPerUpgrade: 5 },
    wave: { maxAmmo: 5, startAmmo: 3, baseRadius: 120, radiusPerUpgrade: 40, speed: 300, cooldown: 400, initialRadius: 8, radiusStep: 12, ammoPerUpgrade: 1 },
  },
  powerups: { maxOnScreen: 3, spawnInterval: 4000, scoreBonus: 50, lifeChance: 0.3, livesStart: 3, livesMax: 5 },
  blocks: { baseSpeed: 40, speedFactor: 2, countBase: 8, countPerLevel: 2 },
  enemyBullets: { speed: 350, shotInterval: 2500, intervalDecayPerKill: 300, minInterval: 800 },
  asteroids: { maxDivisions: 4, sizes: [64, 42, 28, 16], baseSpeed: 70, maxOnScreen: 12, spawnInterval: 6000 },
  level: { speedMultiplierPerLevel: 0.25 },
};

fetch('/config.json')
  .then((r) => r.ok ? r.json() : null)
  .then((data) => { if (data) CONFIG = data; })
  .catch(() => {}); // silencieux : on garde les valeurs par défaut

const TURN_RATE = () => CONFIG.ship.turnRate;
const ACCEL = () => CONFIG.ship.accel;
const DECEL = () => CONFIG.ship.decel;
const MAX_SPEED = () => CONFIG.ship.maxSpeed;
const MIN_SPEED = () => CONFIG.ship.minSpeed;
const CELL_SIZE = () => CONFIG.bullets.cellSize;
const BULLET_SPEED = () => CONFIG.bullets.speed;
const SHOT_COOLDOWN = () => CONFIG.bullets.cooldown;
const BASE_BLOCK_SPEED = () => CONFIG.blocks.baseSpeed;
const SPEED_FACTOR = () => CONFIG.blocks.speedFactor;

// --- Sprites Space Invaders classiques (2 frames chacun) ---
const SPRITES = [
  {
    name: 'crab',
    frames: [
      [
        [0,0,0,1,1,0,0,0,0,0,0],
        [0,0,0,0,1,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0],
        [0,1,1,0,1,1,1,0,1,1,0],
        [1,1,0,1,1,1,1,1,0,1,1],
        [1,1,1,1,1,0,1,1,1,1,1],
        [0,0,1,0,0,1,0,0,1,0,0],
        [0,1,0,1,0,0,0,1,0,1,0],
      ],
      [
        [0,0,0,1,1,0,0,0,0,0,0],
        [0,1,0,0,1,0,0,0,0,1,0],
        [0,1,1,1,1,1,1,1,1,1,0],
        [1,1,0,1,1,1,1,1,0,1,1],
        [1,0,1,1,1,1,1,1,1,0,1],
        [0,1,1,1,1,0,1,1,1,1,0],
        [0,1,0,0,0,1,0,0,1,0,0],
        [1,0,0,0,0,0,0,0,0,0,1],
      ],
    ],
  },
  {
    name: 'octopus',
    frames: [
      [
        [0,0,0,0,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,0,1,1,0,1,1,0,0],
        [0,1,1,0,1,1,1,1,0,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,1,0,0,0,0,1,0,0,1],
        [1,0,0,1,0,0,0,0,1,0,0,1],
        [0,0,1,0,0,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,0,0,1,0,0],
        [0,1,0,0,0,0,0,0,0,0,1,0],
      ],
      [
        [0,0,0,0,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,0,1,1,0,1,1,0,0],
        [0,1,1,0,1,1,1,1,0,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,0,1,0,0,0,0,1,0,1,0],
        [0,1,0,0,0,0,0,0,0,0,1,0],
        [0,0,0,1,0,0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0,0,1,0,0,0],
        [0,0,1,0,0,0,0,0,0,1,0,0],
      ],
    ],
  },
  {
    name: 'saucer',
    frames: [
      [
        [0,0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1],
        [1,1,0,1,1,1,1,0,1],
        [1,0,1,1,1,1,1,1,0],
        [0,0,1,0,0,0,0,1,0],
      ],
      [
        [0,0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1],
        [1,1,1,0,1,1,0,1,1],
        [1,1,0,1,1,1,1,0,1],
        [0,1,0,0,0,0,0,0,1],
      ],
    ],
  },
];

function createBlocks(count, width, height, baseSpeed = BASE_BLOCK_SPEED()) {
  const blocks = [];
  let attempts = 0;
  while (blocks.length < count && attempts < 500) {
    attempts++;
    const sprite = SPRITES[Math.floor(Math.random() * SPRITES.length)];
    const frame = sprite.frames[0];
    const rows = frame.length;
    const cols = frame[0].length;
    const w = cols * CELL_SIZE();
    const h = rows * CELL_SIZE();

    const x = Math.random() * (width - w);
    const y = Math.random() * (height - h);

    const overlaps = blocks.some((b) => {
      const bw = b.cols * CELL_SIZE();
      const bh = b.rows * CELL_SIZE();
      return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
    if (overlaps) continue;

    const cells = frame.map((row) => row.map((v) => v === 1));
    const cellsInitiales = cells.reduce((sum, r) => sum + r.filter(Boolean).length, 0);

    blocks.push({
      x,
      y,
      cells,
      cols,
      rows,
      dir: Math.random() * Math.PI * 2,
      speed: baseSpeed,
      baseSpeed,
      cellsInitiales,
      spriteName: sprite.name,
      frameIndex: 0,
      nextDirChange: 2000 + Math.random() * 3000, // ms avant le prochain changement de direction
      nextShot: performance.now() + 1500 + Math.random() * 2000, // prochain tir ennemi
    });
  }
  return blocks;
}

// --- État du jeu ---
const keys = new Set();
function handleKeyDown(e) {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
  }
  // Utiliser e.code pour Space (e.key peut être vide selon le navigateur)
  const key = e.code === 'Space' ? 'Space' : e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(key)) {
    keys.add(key);
  }
}
function handleKeyUp(e) {
  const key = e.code === 'Space' ? 'Space' : e.key;
  keys.delete(key);
}
// Écouteurs sur document pour capter les touches même si le focus est sur le canvas
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
// Forcer le focus sur le body pour que les touches soient capturées
document.body.tabIndex = 0;
document.body.focus();

const ship = { x: 0, y: 0, angle: -Math.PI / 2, speed: 0 };
ship.x = canvas.width / 2;
ship.y = canvas.height / 2;

let blocks = createBlocks(8, canvas.width, canvas.height);
let bullets = [];
let enemyBullets = []; // tirs des invaders
let powerups = []; // items de tir à collecter
// --- Système d'armes avec munitions ---
let currentWeapon = 'bullet'; // 'bullet' ou 'wave'
let bulletAmmo = CONFIG.weapons.bullet.startAmmo; // munitions restantes pour l'arme balle
let waveAmmo = CONFIG.weapons.wave.startAmmo; // munitions restantes pour l'arme onde
let bulletStreams = CONFIG.weapons.bullet.parallelStreams; // nombre de flux parallèles (upgrade)
let waveLevel = 1; // niveau d'upgrade de l'onde (affecte le rayon)
const MAX_BULLET_STREAMS = () => CONFIG.weapons.bullet.maxAmmo;
const MAX_WAVE_LEVEL = () => CONFIG.weapons.wave.maxAmmo;
let waves = []; // ondes de choc actives {x, y, r, maxR}
// Rayon max des ondes : augmente avec le niveau d'upgrade
function waveMaxRadius() {
  const w = CONFIG.weapons.wave;
  return w.baseRadius + (waveLevel - 1) * w.radiusPerUpgrade;
}
let score = 0;
let lastShot = -Infinity; // initialisé à -Infinity pour ne pas bloquer le premier tir
let gameOver = false;
let bestScore = Number(localStorage.getItem('bestScore') || 0);
let level = 1; // niveau courant
let destroyedThisLevel = 0; // nombre d'ennemis détruits au niveau courant
let lives = CONFIG.powerups.livesStart; // vies restantes
const MAX_LIVES = () => CONFIG.powerups.livesMax;
let shipExploding = false; // animation d'explosion du vaisseau en cours
let shipExplosionTimer = 0; // secondes restantes avant respawn
const SHIP_EXPLOSION_DURATION = 1.0; // durée de l'animation d'explosion
let lastTime = performance.now();
let frameTimer = 0;
const FRAME_INTERVAL = 500; // ms pour alterner les frames des sprites
const MAX_POWERUPS = () => CONFIG.powerups.maxOnScreen;
const POWERUP_SPAWN_INTERVAL = () => CONFIG.powerups.spawnInterval;
let lastPowerupSpawn = 0;
const ENEMY_BULLET_SPEED = () => CONFIG.enemyBullets.speed;
const ENEMY_SHOT_INTERVAL = () => CONFIG.enemyBullets.shotInterval;

// --- Astéroïdes (se divisent en deux plus petits quand on leur tire dessus) ---
const ASTEROID_MAX_DIVISIONS = () => CONFIG.asteroids.maxDivisions;
const ASTEROID_SIZES = () => CONFIG.asteroids.sizes;
const ASTEROID_BASE_SPEED = () => CONFIG.asteroids.baseSpeed;
const MAX_ASTEROIDS = () => CONFIG.asteroids.maxOnScreen;
let asteroids = [];
let lastAsteroidSpawn = 0;
const ASTEROID_SPAWN_INTERVAL = () => CONFIG.asteroids.spawnInterval;
let explosions = []; // particules d'explosion {x, y, vx, vy, life, color}

// Nombre d'astéroïdes à faire apparaître au niveau courant (augmente avec le niveau)
function asteroidCountForLevel(lvl) {
  return Math.min(2 + lvl, 10); // niveau 1 = 3, niveau 2 = 4, ... max 10
}

// Crée un astéroïde avec n divisions restantes avant explosion.
// La taille dépend de n : n = ASTEROID_MAX_DIVISIONS() → très grand, n = 1 → petit.
function createAsteroid(n, x, y) {
  const sizeIndex = ASTEROID_MAX_DIVISIONS() - n; // n=4 → 0, n=3 → 1, n=2 → 2, n=1 → 3
  const r = ASTEROID_SIZES()[sizeIndex];
  const speed = ASTEROID_BASE_SPEED() * (1 + sizeIndex * 0.3); // les petits sont un peu plus rapides
  const dir = Math.random() * Math.PI * 2;
  return {
    x: x !== undefined ? x : Math.random() * canvas.width,
    y: y !== undefined ? y : -r, // apparaît au-dessus de l'écran par défaut
    r,
    n, // divisions restantes avant explosion
    sizeIndex,
    vx: Math.cos(dir) * speed,
    vy: Math.sin(dir) * speed,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 2, // rad/s
    // Forme irrégulière pré-générée (décalages radiaux)
    spikes: Array.from({ length: 10 }, () => 0.75 + Math.random() * 0.5),
  };
}

function spawnAsteroid(now) {
  if (asteroids.length >= MAX_ASTEROIDS()) return;
  if (now - lastAsteroidSpawn < ASTEROID_SPAWN_INTERVAL()) return;
  lastAsteroidSpawn = now;
  asteroids.push(createAsteroid(ASTEROID_MAX_DIVISIONS())); // n = 4 → très grand
}

// Fait apparaître le nombre d'astéroïdes correspondant au niveau courant
function spawnAsteroidsForLevel() {
  const count = asteroidCountForLevel(level);
  for (let i = 0; i < count && asteroids.length < MAX_ASTEROIDS(); i++) {
    asteroids.push(createAsteroid(ASTEROID_MAX_DIVISIONS())); // n = 4 → très grand
  }
}

// Crée une explosion de particules à la position donnée
function createExplosion(x, y, color = '#ffaa33') {
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 80 + Math.random() * 120;
    explosions.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6 + Math.random() * 0.4, // secondes
      maxLife: 1.0,
      color,
    });
  }
}

function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      explosions.splice(i, 1);
    }
  }
}

function drawExplosions() {
  for (const p of explosions) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 + (1 - alpha) * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function updateAsteroids(dt) {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.rot += a.rotSpeed * dt;

    // Rebond sur les bords du canvas
    if (a.x - a.r <= 0) {
      a.x = a.r;
      a.vx = Math.abs(a.vx);
    } else if (a.x + a.r >= canvas.width) {
      a.x = canvas.width - a.r;
      a.vx = -Math.abs(a.vx);
    }
    if (a.y - a.r <= 0) {
      a.y = a.r;
      a.vy = Math.abs(a.vy);
    } else if (a.y + a.r >= canvas.height) {
      a.y = canvas.height - a.r;
      a.vy = -Math.abs(a.vy);
    }
  }
}

function drawAsteroids() {
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.shadowColor = '#ffaa33';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#cc8844';
    ctx.strokeStyle = '#ffcc66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const n = a.spikes.length;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const rr = a.r * a.spikes[i];
      const px = Math.cos(ang) * rr;
      const py = Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Cratères
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(-a.r * 0.3, -a.r * 0.2, a.r * 0.2, 0, Math.PI * 2);
    ctx.arc(a.r * 0.25, a.r * 0.3, a.r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Nombre de blocs par niveau
function blockCountForLevel(lvl) {
  return CONFIG.blocks.countBase + (lvl - 1) * CONFIG.blocks.countPerLevel;
}

// Vitesse de base des blocs augmente avec le niveau
function baseSpeedForLevel(lvl) {
  return BASE_BLOCK_SPEED() * (1 + (lvl - 1) * CONFIG.level.speedMultiplierPerLevel);
}

function spawnLevel() {
  const count = blockCountForLevel(level);
  const base = baseSpeedForLevel(level);
  destroyedThisLevel = 0;
  blocks = createBlocks(count, canvas.width, canvas.height, base);
}

// Accélère tous les blocs quand un ennemi est détruit
function accelerateAllBlocks() {
  for (const block of blocks) {
    block.baseSpeed *= 1.15; // +15 % par destruction
    block.speed = block.baseSpeed;
  }
}

function enemyShoot(now) {
  for (const block of blocks) {
    if (now >= block.nextShot) {
      // Tirer vers le bas (comme dans Space Invaders classique)
      const cx = block.x + (block.cols * CELL_SIZE()) / 2;
      const cy = block.y + (block.rows * CELL_SIZE()); // depuis le bas du bloc
      enemyBullets.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: ENEMY_BULLET_SPEED(),
      });
      // Prochain tir : cadence de base, plus rapide si des ennemis ont été détruits
      const eb = CONFIG.enemyBullets;
      const interval = Math.max(eb.minInterval, eb.shotInterval - destroyedThisLevel * eb.intervalDecayPerKill);
      block.nextShot = now + interval + Math.random() * 1000;
    }
  }
}

function updateEnemyBullets(dt) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Hors écran → supprimer
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      enemyBullets.splice(i, 1);
      continue;
    }

    // Collision avec le vaisseau
    const dx = b.x - ship.x;
    const dy = b.y - ship.y;
    if (Math.hypot(dx, dy) < 16) {
      enemyBullets.splice(i, 1);
      damageShip();
    }
  }
}

function updateBlocks(dt) {
  const dtMs = dt * 1000;
  for (const block of blocks) {
    // Changement de direction aléatoire toutes les 2–5 s
    block.nextDirChange -= dtMs;
    if (block.nextDirChange <= 0) {
      block.dir += (Math.random() - 0.5) * 1.2; // random(-0.6, 0.6) rad
      block.nextDirChange = 2000 + Math.random() * 3000;
    }

    // Vitesse croissante selon l'usure : ratio = cellules restantes / cellules initiales
    const remaining = block.cells.reduce((sum, r) => sum + r.filter(Boolean).length, 0);
    const ratio = block.cellsInitiales > 0 ? remaining / block.cellsInitiales : 0;
    block.speed = block.baseSpeed * (1 + (1 - ratio) * SPEED_FACTOR());

    // Déplacement
    block.x += Math.cos(block.dir) * block.speed * dt;
    block.y += Math.sin(block.dir) * block.speed * dt;

    // Rebond sur les bords du canvas
    const bw = block.cols * CELL_SIZE();
    const bh = block.rows * CELL_SIZE();
    if (block.x <= 0) {
      block.x = 0;
      block.dir = Math.PI - block.dir;
    } else if (block.x + bw >= canvas.width) {
      block.x = canvas.width - bw;
      block.dir = Math.PI - block.dir;
    }
    if (block.y <= 0) {
      block.y = 0;
      block.dir = -block.dir;
    } else if (block.y + bh >= canvas.height) {
      block.y = canvas.height - bh;
      block.dir = -block.dir;
    }
  }
}

function shoot(now) {
  if (!keys.has('Space')) return;

  if (currentWeapon === 'wave') {
    // Pas de munition → retombe sur l'arme de base (balle)
    if (waveAmmo <= 0) {
      currentWeapon = 'bullet';
      return;
    }
    const w = CONFIG.weapons.wave;
    if (now - lastShot < w.cooldown) return;
    lastShot = now;
    waveAmmo--;
    const maxR = waveMaxRadius();
    for (let i = 0; i < waveLevel; i++) {
      waves.push({
        x: ship.x,
        y: ship.y,
        r: w.initialRadius + i * w.radiusStep,
        maxR,
      });
    }
  } else {
    // Pas de munition → on ne peut plus tirer (arme de base épuisée)
    if (bulletAmmo <= 0) return;
    if (now - lastShot < SHOT_COOLDOWN()) return;
    lastShot = now;
    bulletAmmo--;
    const angle = ship.angle;
    const perpAngle = angle + Math.PI / 2;
    const spacing = CONFIG.weapons.bullet.spacing;
    for (let i = 0; i < bulletStreams; i++) {
      const offset = (i - (bulletStreams - 1) / 2) * spacing;
      bullets.push({
        x: ship.x + Math.cos(perpAngle) * offset,
        y: ship.y + Math.sin(perpAngle) * offset,
        vx: Math.cos(angle) * BULLET_SPEED(),
        vy: Math.sin(angle) * BULLET_SPEED(),
      });
    }
  }
}

function spawnPowerup() {
  if (powerups.length >= MAX_POWERUPS()) return;
  // Probabilité de vie configurable, le reste se partage entre bullet et wave
  const lifeChance = CONFIG.powerups.lifeChance;
  const roll = Math.random();
  let type;
  if (roll < lifeChance) {
    type = 'life';
  } else if (roll < lifeChance + (1 - lifeChance) * 0.5) {
    type = 'bullet';
  } else {
    type = 'wave';
  }
  powerups.push({
    x: 50 + Math.random() * (canvas.width - 100),
    y: 50 + Math.random() * (canvas.height - 100),
    r: 14,
    pulse: 0,
    type, // 'bullet' → diamant violet, 'wave' → anneau cyan, 'life' → cœur rouge
  });
}

function updatePowerups(dt, now) {
  // Apparition périodique
  if (now - lastPowerupSpawn > POWERUP_SPAWN_INTERVAL()) {
    lastPowerupSpawn = now;
    spawnPowerup();
  }

  // Animation de pulsation
  for (const p of powerups) {
    p.pulse += dt * 4;
  }

  // Collecte par le vaisseau
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    const dx = ship.x - p.x;
    const dy = ship.y - p.y;
    if (Math.hypot(dx, dy) < p.r + 16) {
      powerups.splice(i, 1);
      score += CONFIG.powerups.scoreBonus;
      if (p.type === 'wave') {
        // Powerup onde : bascule l'arme, +ammoPerUpgrade munitions, +1 niveau d'upgrade
        currentWeapon = 'wave';
        waveAmmo = Math.min(waveAmmo + CONFIG.weapons.wave.ammoPerUpgrade, MAX_WAVE_LEVEL());
        waveLevel = Math.min(waveLevel + 1, MAX_WAVE_LEVEL());
      } else if (p.type === 'bullet') {
        // Powerup balle : bascule l'arme, +ammoPerUpgrade munitions, +1 flux parallèle
        currentWeapon = 'bullet';
        bulletAmmo = Math.min(bulletAmmo + CONFIG.weapons.bullet.ammoPerUpgrade, MAX_BULLET_STREAMS());
        bulletStreams = Math.min(bulletStreams + 1, MAX_BULLET_STREAMS());
      } else if (p.type === 'life') {
        // Powerup vie : +1 vie (max livesMax)
        lives = Math.min(lives + 1, CONFIG.powerups.livesMax);
      }
    }
  }
}

// --- Ondes de choc : se propagent en cercle depuis le vaisseau, détruisent cellules et astéroïdes ---
function updateWaves(dt) {
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    w.r += CONFIG.weapons.wave.speed * dt;

    // Supprimer l'onde quand elle atteint son rayon max
    if (w.r >= w.maxR) {
      waves.splice(i, 1);
      continue;
    }

    // Collision onde ↔ blocs : détruit les cellules dont le centre est dans l'anneau
    for (const block of blocks) {
      for (let row = 0; row < block.rows; row++) {
        for (let col = 0; col < block.cols; col++) {
          if (!block.cells[row][col]) continue;
          const cx = block.x + (col + 0.5) * CELL_SIZE();
          const cy = block.y + (row + 0.5) * CELL_SIZE();
          const dist = Math.hypot(cx - w.x, cy - w.y);
          // L'onde est un anneau : collision si la distance est proche du rayon courant
          if (Math.abs(dist - w.r) < CELL_SIZE() * 1.5) {
            block.cells[row][col] = false;
            score += 10;
            // Vérifier destruction complète du bloc
            const remaining = block.cells.reduce((sum, r2) => sum + r2.filter(Boolean).length, 0);
            if (remaining === 0) {
              score += 100;
              blocks.splice(blocks.indexOf(block), 1);
              destroyedThisLevel++;
              accelerateAllBlocks();
            }
          }
        }
      }
    }

    // Collision onde ↔ astéroïdes
    for (let j = asteroids.length - 1; j >= 0; j--) {
      const a = asteroids[j];
      const dist = Math.hypot(a.x - w.x, a.y - w.y);
      if (Math.abs(dist - w.r) < a.r + CELL_SIZE()) {
        score += 25 * (a.n + 1);
        if (a.n > 1) {
          const childN = a.n - 1;
          const perp = Math.atan2(a.vy, a.vx) + Math.PI / 2;
          const spread = 0.6;
          const frag1 = createAsteroid(childN, a.x, a.y);
          const frag2 = createAsteroid(childN, a.x, a.y);
          frag1.vx = a.vx + Math.cos(perp + spread) * ASTEROID_BASE_SPEED() * 0.4;
          frag1.vy = a.vy + Math.sin(perp + spread) * ASTEROID_BASE_SPEED() * 0.4;
          frag2.vx = a.vx + Math.cos(perp - spread) * ASTEROID_BASE_SPEED() * 0.4;
          frag2.vy = a.vy + Math.sin(perp - spread) * ASTEROID_BASE_SPEED() * 0.4;
          asteroids[j] = frag1;
          asteroids.splice(j + 1, 0, frag2);
        } else {
          createExplosion(a.x, a.y, '#ff6600');
          createExplosion(a.x, a.y, '#ffff00');
          asteroids.splice(j, 1);
        }
      }
    }
  }
}

function drawWaves() {
  for (const w of waves) {
    const alpha = 1 - w.r / w.maxR; // fade-out progressif
    ctx.save();
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3 + alpha * 4;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
    ctx.stroke();
    // Double anneau pour l'effet visuel
    ctx.globalAlpha = alpha * 0.4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    // Pas de collision fin : la balle avance par petits pas pour ne pas traverser
    // les cellules de 6 px sans être détectée (tunneling à haute vitesse)
    const stepDist = Math.hypot(b.vx, b.vy) * dt;
    const steps = Math.max(1, Math.ceil(stepDist / (CELL_SIZE() * 0.5)));
    const stepDt = dt / steps;
    let hit = false;

    for (let s = 0; s < steps && !hit; s++) {
      b.x += b.vx * stepDt;
      b.y += b.vy * stepDt;

      // Supprimer les balles hors écran
      if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
        bullets.splice(i, 1);
        break;
      }

      // Collision balle ↔ bloc
      for (const block of blocks) {
        const col = Math.floor((b.x - block.x) / CELL_SIZE());
        const row = Math.floor((b.y - block.y) / CELL_SIZE());
        if (col >= 0 && col < block.cols && row >= 0 && row < block.rows) {
          if (block.cells[row][col]) {
            block.cells[row][col] = false;
            score += 10;
            hit = true;
            // Vérifier si le bloc est entièrement détruit
            const remaining = block.cells.reduce((sum, r) => sum + r.filter(Boolean).length, 0);
            if (remaining === 0) {
              score += 100;
              blocks.splice(blocks.indexOf(block), 1);
              destroyedThisLevel++;
              accelerateAllBlocks(); // les survivants accélèrent
            }
            break;
          }
        }
      }

      // Collision balle ↔ astéroïde : se divise en deux plus petits, ou explose si c'est un petit
      // On collecte d'abord les indices des collisions, puis on traite de la fin vers le début
      // pour préserver les indices lors du splice
      const asteroidHitIndices = [];
      for (let j = 0; j < asteroids.length; j++) {
        const a = asteroids[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (Math.hypot(dx, dy) < a.r) {
          asteroidHitIndices.push(j);
        }
      }

      // Traiter les collisions de la fin vers le début
      for (let k = asteroidHitIndices.length - 1; k >= 0; k--) {
        const idx = asteroidHitIndices[k];
        const a = asteroids[idx];
        score += 25 * (a.n + 1); // n élevé = gros astéroïde = plus de points
        if (a.n > 1) {
          // Se divise en deux fragments avec n-1 divisions restantes, héritant la vitesse + écart angulaire
          const childN = a.n - 1;
          const perp = Math.atan2(a.vy, a.vx) + Math.PI / 2;
          const spread = 0.6; // rad — angle d'écart entre les deux fragments
          const frag1 = createAsteroid(childN, a.x, a.y);
          const frag2 = createAsteroid(childN, a.x, a.y);
          frag1.vx = a.vx + Math.cos(perp + spread) * ASTEROID_BASE_SPEED() * 0.4;
          frag1.vy = a.vy + Math.sin(perp + spread) * ASTEROID_BASE_SPEED() * 0.4;
          frag2.vx = a.vx + Math.cos(perp - spread) * ASTEROID_BASE_SPEED() * 0.4;
          frag2.vy = a.vy + Math.sin(perp - spread) * ASTEROID_BASE_SPEED() * 0.4;
          // Remplacer l'astéroïde par ses deux fragments à la même position dans le tableau
          asteroids[idx] = frag1;
          asteroids.splice(idx + 1, 0, frag2);
        } else {
          // n == 1 : dernier niveau, explosion spectaculaire
          createExplosion(a.x, a.y, '#ff6600');
          createExplosion(a.x, a.y, '#ffff00'); // double explosion pour l'effet
          asteroids.splice(idx, 1);
        }
        hit = true;
      }
    }
    if (hit) bullets.splice(i, 1);
  }
}

function checkShipCollision() {
  // Rectangle du vaisseau (approximation)
  const shipW = 20;
  const shipH = 16;
  const sx = ship.x - shipW / 2;
  const sy = ship.y - shipH / 2;

  for (const block of blocks) {
    const bw = block.cols * CELL_SIZE();
    const bh = block.rows * CELL_SIZE();
    // Test de recouvrement des rectangles
    if (sx < block.x + bw && sx + shipW > block.x && sy < block.y + bh && sy + shipH > block.y) {
      // Vérifier si une cellule pleine est réellement touchée
      const colStart = Math.max(0, Math.floor((sx - block.x) / CELL_SIZE()));
      const colEnd = Math.min(block.cols - 1, Math.floor((sx + shipW - block.x) / CELL_SIZE()));
      const rowStart = Math.max(0, Math.floor((sy - block.y) / CELL_SIZE()));
      const rowEnd = Math.min(block.rows - 1, Math.floor((sy + shipH - block.y) / CELL_SIZE()));
      for (let r = rowStart; r <= rowEnd; r++) {
        for (let c = colStart; c <= colEnd; c++) {
          if (block.cells[r][c]) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// --- Dommage au vaisseau : perd une vie, explosion, respawn ou game over ---
function damageShip() {
  lives--;
  // Explosion du vaisseau
  createExplosion(ship.x, ship.y, '#00ffff');
  createExplosion(ship.x, ship.y, '#ffffff');
  shipExploding = true;
  shipExplosionTimer = SHIP_EXPLOSION_DURATION;

  if (lives <= 0) {
    gameOver = true;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('bestScore', String(bestScore));
    }
  } else {
    // Le vaisseau respawnera après l'animation d'explosion
    ship.speed = 0;
  }
}

function update(dt, now) {
  if (gameOver) {
    // Attendre Space ou clic pour redémarrer
    if (keys.has('Space')) {
      resetGame();
    }
    return;
  }

  if (keys.has('ArrowLeft')) ship.angle -= TURN_RATE() * dt;
  if (keys.has('ArrowRight')) ship.angle += TURN_RATE() * dt;
  if (keys.has('ArrowUp')) ship.speed = Math.min(ship.speed + ACCEL() * dt, MAX_SPEED());
  if (keys.has('ArrowDown')) ship.speed = Math.max(ship.speed - DECEL() * dt, MIN_SPEED());

  // Si le vaisseau est en train d'exploser, on ne bouge pas et on attend le respawn
  if (shipExploding) {
    shipExplosionTimer -= dt;
    if (shipExplosionTimer <= 0) {
      shipExploding = false;
      // Respawn au centre
      ship.x = canvas.width / 2;
      ship.y = canvas.height / 2;
      ship.angle = -Math.PI / 2;
      ship.speed = 0;
    }
    updateExplosions(dt);
    return;
  }

  ship.x += Math.cos(ship.angle) * ship.speed * dt;
  ship.y += Math.sin(ship.angle) * ship.speed * dt;

  if (ship.x < 0) ship.x += canvas.width;
  if (ship.x > canvas.width) ship.x -= canvas.width;
  if (ship.y < 0) ship.y += canvas.height;
  if (ship.y > canvas.height) ship.y -= canvas.height;

  shoot(now);
  updateBullets(dt);
  updateWaves(dt);
  updateBlocks(dt);
  updatePowerups(dt, now);
  spawnAsteroid(now);
  updateAsteroids(dt);
  updateExplosions(dt);
  enemyShoot(now);
  updateEnemyBullets(dt);

  // Niveau suivant quand plus aucun ennemi ne reste
  if (blocks.length === 0) {
    level++;
    spawnLevel();
    spawnAsteroidsForLevel(); // fait apparaître plus d'astéroïdes au niveau supérieur
  }

  // Collision vaisseau ↔ blocs : explosion du vaisseau
  if (checkShipCollision()) {
    damageShip();
  }

  // Collision vaisseau ↔ astéroïdes : explosion du vaisseau
  for (const a of asteroids) {
    const dx = ship.x - a.x;
    const dy = ship.y - a.y;
    if (Math.hypot(dx, dy) < a.r + 10) {
      damageShip();
      break; // un seul dommage par frame
    }
  }
}

function resetGame() {
  ship.x = canvas.width / 2;
  ship.y = canvas.height / 2;
  ship.angle = -Math.PI / 2;
  ship.speed = 0;
  keys.clear();
  bullets = [];
  enemyBullets = [];
  powerups = [];
  waves = [];
  asteroids = [];
  explosions = [];
  lastAsteroidSpawn = 0;
  currentWeapon = 'bullet';
  bulletAmmo = CONFIG.weapons.bullet.startAmmo;
  waveAmmo = CONFIG.weapons.wave.startAmmo;
  bulletStreams = CONFIG.weapons.bullet.parallelStreams;
  waveLevel = 1;
  lives = CONFIG.powerups.livesStart;
  shipExploding = false;
  shipExplosionTimer = 0;
  score = 0;
  lastShot = -Infinity;
  gameOver = false;
  level = 1;
  spawnLevel();
  spawnAsteroidsForLevel(); // fait apparaître les astéroïdes du niveau 1
}

function drawShip() {
  // Le vaisseau n'est pas dessiné pendant l'explosion
  if (shipExploding) return;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);

  // Le design du vaisseau évolue avec le nombre de flux de tir
  const tier = bulletStreams; // 1 à MAX_BULLET_STREAMS

  // Coque principale (couleur selon le niveau de puissance)
  const colors = ['#00ffff', '#33ff99', '#66ffcc', '#ffcc00', '#ff66ff'];
  const color = colors[tier - 1] || colors[0];
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 + tier * 4;
  ctx.fillStyle = color;

  // Niveau 1 : simple flèche
  if (tier === 1) {
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
  } else if (tier === 2) {
    // Flèche avec ailettes arrière
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-12, -8);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-12, 8);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();
  } else if (tier === 3) {
    // Fusée avec cockpit
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(4, -9);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-14, -10);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-14, 10);
    ctx.lineTo(-10, 7);
    ctx.lineTo(4, 9);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (tier === 4) {
    // Interceptor large avec doubles ailes
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(6, -11);
    ctx.lineTo(-6, -9);
    ctx.lineTo(-12, -14);
    ctx.lineTo(-10, -4);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-10, 4);
    ctx.lineTo(-12, 14);
    ctx.lineTo(-6, 9);
    ctx.lineTo(6, 11);
    ctx.closePath();
    ctx.fill();
    // Réacteurs
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(-14, -6, 4, 4);
    ctx.fillRect(-14, 2, 4, 4);
  } else {
    // Niveau 5 : vaisseau d'assaut massif
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(8, -13);
    ctx.lineTo(-4, -11);
    ctx.lineTo(-10, -16);
    ctx.lineTo(-14, -6);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-14, 6);
    ctx.lineTo(-10, 16);
    ctx.lineTo(-4, 11);
    ctx.lineTo(8, 13);
    ctx.closePath();
    ctx.fill();
    // Dômes latéraux
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, -6, 3, 0, Math.PI * 2);
    ctx.arc(4, 6, 3, 0, Math.PI * 2);
    ctx.fill();
    // Réacteur central
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(-16, -3, 5, 6);
  }

  ctx.restore();
}

function drawBullets() {
  ctx.save();
  // Effet de lumière : traînée lumineuse derrière chaque balle
  for (const b of bullets) {
    const trailLen = 18;
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const nx = -b.vx / speed; // vecteur normalisé vers l'arrière
    const ny = -b.vy / speed;

    // Traînée (dégradé transparent → jaune)
    const grad = ctx.createLinearGradient(b.x, b.y, b.x + nx * trailLen, b.y + ny * trailLen);
    grad.addColorStop(0, 'rgba(255, 255, 100, 0.9)');
    grad.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ffff66';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + nx * trailLen, b.y + ny * trailLen);
    ctx.stroke();

    // Noyau brillant
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemyBullets() {
  ctx.save();
  for (const b of enemyBullets) {
    // Traînée rouge
    const trailLen = 14;
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const nx = -b.vx / speed;
    const ny = -b.vy / speed;
    const grad = ctx.createLinearGradient(b.x, b.y, b.x + nx * trailLen, b.y + ny * trailLen);
    grad.addColorStop(0, 'rgba(255, 80, 80, 0.9)');
    grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + nx * trailLen, b.y + ny * trailLen);
    ctx.stroke();

    // Noyau
    ctx.fillStyle = '#ff6666';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBlocks() {
  for (const block of blocks) {
    const sprite = SPRITES.find((s) => s.name === block.spriteName);
    if (!sprite) continue;
    const frame = sprite.frames[block.frameIndex % sprite.frames.length];

    ctx.save();
    ctx.shadowColor = '#33ff66';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#33ff66';
    for (let j = 0; j < block.rows; j++) {
      for (let i = 0; i < block.cols; i++) {
        if (block.cells[j][i] && frame[j][i]) {
          ctx.fillRect(block.x + i * CELL_SIZE(), block.y + j * CELL_SIZE(), CELL_SIZE(), CELL_SIZE());
        }
      }
    }
    ctx.restore();
  }
}

function drawPowerups() {
  for (const p of powerups) {
    const pulse = 1 + Math.sin(p.pulse) * 0.2;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(pulse, pulse);
    if (p.type === 'wave') {
      // Anneau cyan pulsant (onde de choc)
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      // Double anneau intérieur
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      // Point central
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'life') {
      // Cœur rouge (vie)
      ctx.shadowColor = '#ff3333';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      // Forme de cœur simplifiée
      ctx.moveTo(0, p.r * 0.4);
      ctx.bezierCurveTo(-p.r, -p.r * 0.3, -p.r * 0.5, -p.r, 0, -p.r * 0.4);
      ctx.bezierCurveTo(p.r * 0.5, -p.r, p.r, -p.r * 0.3, 0, p.r * 0.4);
      ctx.closePath();
      ctx.fill();
      // Brillance
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(-p.r * 0.2, -p.r * 0.3, p.r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Diamant violet (tir classique)
      ctx.shadowColor = '#ff66ff';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ff66ff';
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.lineTo(p.r * 0.7, 0);
      ctx.lineTo(0, p.r);
      ctx.lineTo(-p.r * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      // Symbole "+" à l'intérieur
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -2, 12, 4);
      ctx.fillRect(-2, -6, 4, 12);
    }
    ctx.restore();
  }
}

function drawHUD() {
  ctx.save();
  // Score et best en gros, sans flou
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Score: ${score}`, 12, 28);
  ctx.fillText(`Best: ${bestScore}`, 12, 56);

  // Munitions en gros, sans flou
  ctx.fillStyle = currentWeapon === 'bullet' ? '#ff66ff' : '#663399';
  ctx.fillText(`Tir: ${bulletAmmo}/${MAX_BULLET_STREAMS()}`, 12, 84);
  ctx.fillStyle = currentWeapon === 'wave' ? '#00ffff' : '#336699';
  ctx.fillText(`Onde: ${waveAmmo}/${MAX_WAVE_LEVEL()}`, 12, 112);

  // Vies en gros, sans flou
  ctx.fillStyle = '#ff3333';
  let livesText = 'Vies: ';
  for (let i = 0; i < lives; i++) livesText += '♥';
  for (let i = lives; i < MAX_LIVES(); i++) livesText += '♡';
  ctx.fillText(livesText, 12, 140);

  // Niveau en gros, sans flou
  ctx.fillStyle = '#33ff66';
  ctx.fillText(`Niveau: ${level}`, 12, 168);

  if (gameOver) {
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 16;
    const text = 'GAME OVER';
    const tw = ctx.measureText(text).width;
    ctx.fillText(text, (canvas.width - tw) / 2, canvas.height / 2);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#ffffff';
    const hint = 'Appuyez sur Espace pour rejouer';
    const hw = ctx.measureText(hint).width;
    ctx.fillText(hint, (canvas.width - hw) / 2, canvas.height / 2 + 40);
  }
  ctx.restore();
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  frameTimer += dt * 1000;
  if (frameTimer >= FRAME_INTERVAL) {
    frameTimer -= FRAME_INTERVAL;
    for (const block of blocks) {
      const sprite = SPRITES.find((s) => s.name === block.spriteName);
      if (sprite) block.frameIndex = (block.frameIndex + 1) % sprite.frames.length;
    }
  }

  update(dt, now);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawAsteroids();
  drawExplosions();
  drawBlocks();
  drawWaves();
  drawPowerups();
  drawEnemyBullets();
  drawBullets();
  drawShip();
  drawHUD();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

window.__debug = {
  get ship() {
    return { x: ship.x, y: ship.y, angle: ship.angle, speed: ship.speed };
  },
  get blocks() {
    return blocks.map((b) => ({
      x: b.x,
      y: b.y,
      cols: b.cols,
      rows: b.rows,
      cells: b.cells.map((row) => [...row]),
      dir: b.dir,
      speed: b.speed,
      spriteName: b.spriteName,
    }));
  },
  get bullets() {
    return bullets.map((b) => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy }));
  },
  get score() {
    return score;
  },
  get blockSpeeds() {
    return blocks.map((b) => b.speed);
  },
  get gameOver() {
    return gameOver;
  },
  get bestScore() {
    return bestScore;
  },
  get powerups() {
    return powerups.map((p) => ({ x: p.x, y: p.y, r: p.r, type: p.type }));
  },
  get bulletAmmo() {
    return bulletAmmo;
  },
  get waveAmmo() {
    return waveAmmo;
  },
  get bulletStreams() {
    return bulletStreams;
  },
  get waveLevel() {
    return waveLevel;
  },
  get lives() {
    return lives;
  },
  get shipExploding() {
    return shipExploding;
  },
  // Permet aux tests de forcer les vies
  setLives(n) {
    lives = Math.max(0, Math.min(n, MAX_LIVES()));
  },
  // Permet aux tests de simuler un dommage au vaisseau
  damageShipForTest() {
    damageShip();
  },
  get weapon() {
    return currentWeapon;
  },
  get waves() {
    return waves.map((w) => ({ x: w.x, y: w.y, r: w.r, maxR: w.maxR }));
  },
  // Permet aux tests de forcer l'arme courante
  setWeapon(weapon) {
    if (weapon === 'bullet' || weapon === 'wave') {
      currentWeapon = weapon;
    }
  },
  // Permet aux tests de forcer les munitions
  setBulletAmmo(n) {
    bulletAmmo = Math.max(0, Math.min(n, MAX_BULLET_STREAMS()));
  },
  setWaveAmmo(n) {
    waveAmmo = Math.max(0, Math.min(n, MAX_WAVE_LEVEL()));
  },
  // Permet aux tests de tirer une onde instantanément
  fireWave() {
    if (waveAmmo <= 0) return;
    waveAmmo--;
    const w = CONFIG.weapons.wave;
    const maxR = waveMaxRadius();
    for (let i = 0; i < waveLevel; i++) {
      waves.push({
        x: ship.x,
        y: ship.y,
        r: w.initialRadius + i * w.radiusStep,
        maxR,
      });
    }
  },
  get level() {
    return level;
  },
  get enemyBullets() {
    return enemyBullets.map((b) => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy }));
  },
  // Permet aux tests de forcer la position d'un bloc (rebond, collision, etc.)
  setBlockPos(index, x, y) {
    if (blocks[index]) {
      blocks[index].x = x;
      blocks[index].y = y;
    }
  },
  // Permet aux tests de vider toutes les cellules d'un bloc
  clearBlockCells(index) {
    if (blocks[index]) {
      for (const row of blocks[index].cells) {
        for (let i = 0; i < row.length; i++) row[i] = false;
      }
    }
  },
  // Permet aux tests de tirer une balle instantanément (sans attendre la frame suivante)
  fireBullet() {
    bullets.push({
      x: ship.x,
      y: ship.y,
      vx: Math.cos(ship.angle) * BULLET_SPEED(),
      vy: Math.sin(ship.angle) * BULLET_SPEED(),
    });
  },
  // Permet aux tests de retirer des cellules d'un bloc (pour tester la vitesse)
  removeBlockCells(index, count) {
    if (!blocks[index]) return;
    const block = blocks[index];
    let removed = 0;
    for (let j = 0; j < block.rows && removed < count; j++) {
      for (let i = 0; i < block.cols && removed < count; i++) {
        if (block.cells[j][i]) {
          block.cells[j][i] = false;
          removed++;
        }
      }
    }
  },
  keys,
  reset() {
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.angle = -Math.PI / 2;
    ship.speed = 0;
    keys.clear();
    bullets = [];
    enemyBullets = [];
    powerups = [];
    waves = [];
    asteroids = [];
    explosions = [];
    lastAsteroidSpawn = 0;
    currentWeapon = 'bullet';
    bulletAmmo = CONFIG.weapons.bullet.startAmmo;
    waveAmmo = CONFIG.weapons.wave.startAmmo;
    bulletStreams = CONFIG.weapons.bullet.parallelStreams;
    waveLevel = 1;
    lives = CONFIG.powerups.livesStart;
    shipExploding = false;
    shipExplosionTimer = 0;
    score = 0;
    lastShot = -Infinity;
    gameOver = false;
    level = 1;
    spawnLevel();
    spawnAsteroidsForLevel(); // fait apparaître les astéroïdes du niveau 1
  },
  get asteroids() {
    return asteroids.map((a) => ({
      x: a.x,
      y: a.y,
      r: a.r,
      n: a.n,
      sizeIndex: a.sizeIndex,
      vx: a.vx,
      vy: a.vy,
    }));
  },
  // Permet aux tests de forcer l'apparition d'un astéroïde avec n divisions restantes
  // (n = ASTEROID_MAX_DIVISIONS() → très grand, n = 1 → petit qui explose)
  spawnAsteroidForTest(n = ASTEROID_MAX_DIVISIONS(), x, y) {
    asteroids.push(createAsteroid(n, x, y));
  },
  // Permet aux tests de forcer la position du vaisseau (pour simuler une collecte)
  setShipPos(x, y) {
    ship.x = x;
    ship.y = y;
  },
  // Permet aux tests de forcer l'apparition d'un powerup d'un type donné
  spawnPowerupForTest(type = 'bullet') {
    if (powerups.length >= MAX_POWERUPS()) return;
    powerups.push({
      x: 50 + Math.random() * (canvas.width - 100),
      y: 50 + Math.random() * (canvas.height - 100),
      r: 14,
      pulse: 0,
      type,
    });
  },
  // Permet aux tests de tirer une balle directement sur un astéroïde
  shootAtAsteroid(asteroidIndex) {
    if (!asteroids[asteroidIndex]) return;
    const a = asteroids[asteroidIndex];
    // Créer une balle qui part du vaisseau et touche l'astéroïde
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const angle = Math.atan2(dy, dx);
    bullets.push({
      x: ship.x,
      y: ship.y,
      vx: Math.cos(angle) * BULLET_SPEED(),
      vy: Math.sin(angle) * BULLET_SPEED(),
    });
  },
};
