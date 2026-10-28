export const keys = new Set<string>();

window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
    keys.add(e.key);
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key);
});
