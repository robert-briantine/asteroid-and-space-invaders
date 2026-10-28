"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CELL_SIZE = void 0;
exports.createBlocks = createBlocks;
exports.getSpriteFrames = getSpriteFrames;
exports.blockRect = blockRect;
// Sprites Space Invaders classiques (2 frames chacun)
const SPRITES = [
    {
        name: 'crab',
        frames: [
            [
                [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
                [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
                [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
                [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
                [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
            ],
            [
                [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
                [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
                [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
                [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            ],
        ],
    },
    {
        name: 'octopus',
        frames: [
            [
                [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0],
                [0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
                [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
                [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            ],
            [
                [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0],
                [0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
            ],
        ],
    },
    {
        name: 'saucer',
        frames: [
            [
                [0, 0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 0, 1, 1, 1, 1, 0, 1],
                [1, 0, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 0, 0, 0, 0, 1, 0],
            ],
            [
                [0, 0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 0, 1, 1, 0, 1, 1],
                [1, 1, 0, 1, 1, 1, 1, 0, 1],
                [0, 1, 0, 0, 0, 0, 0, 0, 1],
            ],
        ],
    },
];
exports.CELL_SIZE = 6;
function createBlocks(count, width, height) {
    const blocks = [];
    let attempts = 0;
    while (blocks.length < count && attempts < 500) {
        attempts++;
        const sprite = SPRITES[Math.floor(Math.random() * SPRITES.length)];
        const frame = sprite.frames[0];
        const rows = frame.length;
        const cols = frame[0].length;
        const w = cols * exports.CELL_SIZE;
        const h = rows * exports.CELL_SIZE;
        const x = Math.random() * (width - w);
        const y = Math.random() * (height - h);
        // Vérifier le chevauchement avec les blocs existants
        const overlaps = blocks.some((b) => {
            const bw = b.cols * exports.CELL_SIZE;
            const bh = b.rows * exports.CELL_SIZE;
            return x < b.x + bw && x + w > b.x && y < b.y + bh && y + h > b.y;
        });
        if (overlaps)
            continue;
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
function getSpriteFrames(name) {
    const s = SPRITES.find((sp) => sp.name === name);
    return s ? s.frames : [];
}
function blockRect(b) {
    return { x: b.x, y: b.y, w: b.cols * exports.CELL_SIZE, h: b.rows * exports.CELL_SIZE };
}
