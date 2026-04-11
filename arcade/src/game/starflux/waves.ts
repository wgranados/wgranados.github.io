import {
  type Enemy,
  type EnemyType,
  type DifficultyProfile,
  ENEMY_CONFIGS,
  H,
  PLAY_AREA_LEFT,
  WAVES_PER_STAGE,
  NORMAL_PROFILE,
} from "./types";

// ---------------------------------------------------------------------------
// Wave grid dimensions (matches Java: Wave.LENGTH=5, Wave.WIDTH=3)
// ---------------------------------------------------------------------------

const GRID_COLS = 5;
const GRID_ROWS = 3;
const CELL_SPACING_X = 120;
const CELL_SPACING_Y = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEnemy(x: number, y: number, type: EnemyType, cooldownMul: number): Enemy {
  const cfg = ENEMY_CONFIGS[type];
  return {
    x,
    y,
    w: cfg.w,
    h: cfg.h,
    health: cfg.health,
    maxHealth: cfg.health,
    speed: cfg.speed,
    shootCooldown: Math.round(cfg.shootCooldown * cooldownMul),
    shootTimer: 0,
    type,
    active: false,
    color: cfg.color,
  };
}

interface WaveResult {
  enemies: Enemy[];
  difficulty: number;
}

/**
 * Generate a single wave — a 5x3 grid of random enemies.
 *
 * Base distribution (Normal): rolls 0-2 medium, 3 heavy, 4 light, 5-9 empty.
 * `fillThreshold` shifts the empty boundary so Expert fills more cells.
 */
function generateWave(profile: DifficultyProfile): WaveResult {
  const enemies: Enemy[] = [];
  let difficulty = 0;
  const fill = profile.waveFillThreshold;

  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      const roll = Math.floor(Math.random() * 10);
      let type: EnemyType | null = null;

      if (roll < 3) type = "medium";
      else if (roll < 4) type = "heavy";
      else if (roll < fill) type = "light";

      if (type) {
        const x = PLAY_AREA_LEFT + col * CELL_SPACING_X + 51;
        const y = row * CELL_SPACING_Y;
        enemies.push(makeEnemy(x, y, type, profile.shootCooldownMultiplier));
        difficulty += ENEMY_CONFIGS[type].difficulty;
      }
    }
  }

  return { enemies, difficulty };
}

// ---------------------------------------------------------------------------
// Stage builder
// ---------------------------------------------------------------------------

/**
 * Build a full stage: N sorted waves + a boss at the end.
 *
 * Waves are sorted by ascending difficulty so easier ones scroll in first,
 * matching the Java WaveSorter's in-order BST traversal.
 *
 * Each wave is positioned at increasing screen-height offsets above the
 * viewport so they scroll into view sequentially.
 */
export function buildStage(stageNumber: number, profile: DifficultyProfile = NORMAL_PROFILE): Enemy[] {
  const waveCount = WAVES_PER_STAGE + stageNumber;

  const waves: WaveResult[] = [];
  for (let i = 0; i < waveCount; i++) {
    waves.push(generateWave(profile));
  }

  waves.sort((a, b) => a.difficulty - b.difficulty);

  const allEnemies: Enemy[] = [];

  for (let wi = 0; wi < waves.length; wi++) {
    const offsetY = -(wi + 1) * H + H / 2;
    for (const enemy of waves[wi].enemies) {
      enemy.y += offsetY;
      allEnemies.push(enemy);
    }
  }

  const bossOffsetY = -(waves.length + 1) * H + H / 2;
  const bossCfg = ENEMY_CONFIGS.boss;
  const bossHealth = profile.bossBaseHp + stageNumber * profile.bossHpPerStage;
  const boss = makeEnemy(
    (PLAY_AREA_LEFT + 665) / 2 - bossCfg.w / 2,
    bossOffsetY,
    "boss",
    profile.shootCooldownMultiplier,
  );
  boss.health = bossHealth;
  boss.maxHealth = bossHealth;
  allEnemies.push(boss);

  return allEnemies;
}
