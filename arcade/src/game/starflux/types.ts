// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

export const W = 1024;
export const H = 768;
export const PLAY_AREA_RIGHT = 665;
export const PLAY_AREA_LEFT = 0;
export const HUD_LEFT = 689;

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

export const UPS = 60;
export const TICK_MS = 1000 / UPS;
export const MAX_ACCUMULATOR = TICK_MS * 5;

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export const PLAYER_W = 50;
export const PLAYER_H = 50;
export const PLAYER_BASE_SPEED = 5;
export const PLAYER_FOCUS_SPEED = 2;
export const PLAYER_SHOOT_COOLDOWN = 6; // ticks (~100ms)
export const PLAYER_BOMB_COOLDOWN = 300; // ticks (~5s)
export const INVINCIBLE_DURATION = 300; // ticks (~5s)
export const DEATH_SCORE_PENALTY = 2000;
export const INITIAL_LIVES = 3;
export const HIT_FLASH_TICKS = 15;

export const STAT_CAP = 3;

export const enum StatIndex {
  Health = 0,
  Power = 1,
  SpeedBoost = 2,
  Bombs = 3,
  Invincibility = 4,
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  stats: number[];
  invincibleTimer: number;
  shootTimer: number;
  bombTimer: number;
  hitFlashTimer: number;
}

// ---------------------------------------------------------------------------
// Bullet
// ---------------------------------------------------------------------------

export const PLAYER_BULLET_SPEED = 10;
export const ENEMY_BULLET_SPEED = 5;
export const BULLET_SIZE = 10;

export interface Bullet {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  owner: "player" | "enemy";
}

// ---------------------------------------------------------------------------
// Enemy
// ---------------------------------------------------------------------------

export type EnemyType = "light" | "medium" | "heavy" | "boss";

export interface EnemyConfig {
  w: number;
  h: number;
  health: number;
  speed: number;
  shootCooldown: number;
  difficulty: number;
  color: string;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  light: { w: 25, h: 25, health: 1, speed: 4, shootCooldown: 90, difficulty: 1, color: "#00e5ff" },
  medium: { w: 50, h: 50, health: 2, speed: 2, shootCooldown: 108, difficulty: 2, color: "#ff5252" },
  heavy: { w: 75, h: 75, health: 3, speed: 1, shootCooldown: 126, difficulty: 3, color: "#ff9100" },
  boss: { w: 200, h: 200, health: 50, speed: 0, shootCooldown: 24, difficulty: 10, color: "#b388ff" },
};

export interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  speed: number;
  shootCooldown: number;
  shootTimer: number;
  type: EnemyType;
  active: boolean;
  color: string;
}

// ---------------------------------------------------------------------------
// Power-up
// ---------------------------------------------------------------------------

export const POWERUP_SIZE = 28;
export const POWERUP_SPEED = 2;

export type PowerUpKind = "health" | "power" | "speed" | "bomb" | "invincibility";

export const POWERUP_KINDS: PowerUpKind[] = [
  "health",
  "power",
  "speed",
  "bomb",
  "invincibility",
];

export const POWERUP_COLORS: Record<PowerUpKind, string> = {
  health: "#4caf50",
  power: "#ff5722",
  speed: "#2196f3",
  bomb: "#ff9800",
  invincibility: "#e040fb",
};

export interface PowerUp {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PowerUpKind;
}

// ---------------------------------------------------------------------------
// Starfield
// ---------------------------------------------------------------------------

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

// ---------------------------------------------------------------------------
// Difficulty
// ---------------------------------------------------------------------------

export const enum Difficulty {
  Normal = 0,
  Expert = 1,
}

export interface DifficultyProfile {
  lives: number;
  startingHealth: number;
  powerUpDropThreshold: number; // roll < N out of 10
  invincibleDuration: number;
  deathScorePenalty: number;
  enemyBulletSpeed: number;
  shootCooldownMultiplier: number; // applied to base cooldown (< 1 = faster)
  waveFillThreshold: number; // roll < N out of 10 spawns an enemy
  bossBaseHp: number;
  bossHpPerStage: number;
  scorePerKill: number;
}

export const NORMAL_PROFILE: DifficultyProfile = {
  lives: 3,
  startingHealth: 3,
  powerUpDropThreshold: 5,
  invincibleDuration: 300,
  deathScorePenalty: 2000,
  enemyBulletSpeed: 5,
  shootCooldownMultiplier: 1,
  waveFillThreshold: 5,
  bossBaseHp: 50,
  bossHpPerStage: 10,
  scorePerKill: 1000,
};

export const EXPERT_PROFILE: DifficultyProfile = {
  lives: 2,
  startingHealth: 2,
  powerUpDropThreshold: 2,
  invincibleDuration: 120,
  deathScorePenalty: 5000,
  enemyBulletSpeed: 7,
  shootCooldownMultiplier: 0.75,
  waveFillThreshold: 7,
  bossBaseHp: 80,
  bossHpPerStage: 20,
  scorePerKill: 1500,
};

export const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: "Normal", value: Difficulty.Normal },
  { label: "Expert", value: Difficulty.Expert },
];

export function getProfile(d: Difficulty): DifficultyProfile {
  return d === Difficulty.Expert ? EXPERT_PROFILE : NORMAL_PROFILE;
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

export const enum Phase {
  Menu = 0,
  Play = 1,
  GameOver = 2,
}

export const SCORE_PER_KILL = 1000;
export const WAVES_PER_STAGE = 5;

export const SPEED_OPTIONS: { label: string; value: number }[] = [
  { label: "Slow", value: 0.6 },
  { label: "Normal", value: 1 },
  { label: "Fast", value: 1.6 },
];

export interface GameState {
  phase: Phase;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  stars: Star[];
  score: number;
  bestScore: number;
  stage: number;
  lives: number;
  paused: boolean;
  keys: Record<string, boolean>;
  speedMultiplier: number;
  tickCount: number;
  difficulty: Difficulty;
}
