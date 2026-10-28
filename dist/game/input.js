"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keys = void 0;
exports.keys = new Set();
window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        exports.keys.add(e.key);
    }
});
window.addEventListener('keyup', (e) => {
    exports.keys.delete(e.key);
});
