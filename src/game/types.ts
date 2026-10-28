export interface Vec2 {
  x: number;
  y: number;
}

export interface Ship {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

export const W = () => window.innerWidth;
export const H = () => window.innerHeight;

export const TURN_RATE = 3.0; // rad/s
export const ACCEL = 150; // px/s^2
export const DECEL = 200; // px/s^2
export const MAX_SPEED = 400; // px/s
export const MIN_SPEED = 0;
