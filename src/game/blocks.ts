export interface Block {
  x: number;
  y: number;
  cells: boolean[][];
  cols: number;
  rows: number;
  dir: number;
  speed: number;
}

// Sprites Space Invaders classiques (2 frames chacun)
const SPRITES: { name: string; frames: number[][][] }[] = [
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

export const CELL_SIZE = 6;

export function createBlocks(count: number, width: number, height: number): Block[] {
  const blocks: Block[] = [];
  let attempts = 0;
  while (blocks.length < count && attempts < 500) {
    attempts++;
    const sprite = SPRITES[Math.floor(Math.random() * SPRITES.length)];
    const frame = sprite.frames[0];
    const rows = frame.length;
    const cols = frame[0].length;
    const w = cols * CELL_SIZE;
    const h = rows * CELL_SIZE;

    const x = Math.random() * (width - w);
    const y = Math.random() * (height - h);

    // Vérifier le chevauchement avec les blocs existants
    const overlaps = blocks.some((b) => {
      const bw = b.cols * CELL_SIZE;
      const bh = b.rows * CELL_SIZE;
      return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
    });
    if (overlaps) continue;

    blocks.push({
      x,
      y,
      cells: frame.map((row) => row.map((v) => v === 1)),
      cols,
      rows,
      dir: Math.random() * Math.PI * 2,
      speed: 30 + Math.random() * 40,
    });
  }
  return blocks;
}

export function getSpriteFrames(name: string): number[][][] {
  const s = SPRITES.find((sp) => sp.name === name);
  return s ? s.frames : [];
}

export function blockRect(b: Block) {
  return { x: b.x, y: b.y, w: b.cols * CELL_SIZE, h: b.rows * CELL_SIZE };
}
