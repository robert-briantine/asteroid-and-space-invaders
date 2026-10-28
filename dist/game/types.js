"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_SPEED = exports.MAX_SPEED = exports.DECEL = exports.ACCEL = exports.TURN_RATE = exports.H = exports.W = void 0;
const W = () => window.innerWidth;
exports.W = W;
const H = () => window.innerHeight;
exports.H = H;
exports.TURN_RATE = 3.0; // rad/s
exports.ACCEL = 150; // px/s^2
exports.DECEL = 200; // px/s^2
exports.MAX_SPEED = 400; // px/s
exports.MIN_SPEED = 0;
