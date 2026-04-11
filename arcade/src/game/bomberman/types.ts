export const enum Phase {
  Menu = 0,
  Play = 1,
  Paused = 2,
  GameOver = 3,
  LevelTransition = 4,
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  bombCount: number;
  tempBombCount: number;
  bombRadius: number;
  score: number;
  alive: boolean;
}

export interface Tile {
  x: number;
  y: number;
  w: number;
  h: number;
  solid: boolean;
  snowball: boolean;
  bomb: boolean;
  firePower: boolean;
  bombPower: boolean;
  speedPower: boolean;
  cool: boolean;
}

export interface Bomb {
  id: 1 | 2;
  placedAt: number;
  gridRow: number;
  gridCol: number;
}

export interface PickupEvent {
  x: number;
  y: number;
  label: string;
  color: string;
  time: number;
}

export interface GameState {
  phase: Phase;
  p1: Player;
  p2: Player;
  grid: Tile[][];
  bombs: Bomb[];
  level: number;
  keys: Record<string, boolean>;
  gameStartedAt: number;
  timeLimitSec: number;
  bestScore: number;
  paused: boolean;
  levelTransitionAt: number;
  pickups: PickupEvent[];
}
