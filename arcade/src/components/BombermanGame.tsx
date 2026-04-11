import { useRef, useEffect, useCallback, useState } from "react";
import { LEVELS } from "../game/bomberman/levels";
import type { Player, Tile, Bomb, GameState, PickupEvent } from "../game/bomberman/types";
import { Phase } from "../game/bomberman/types";
import { getBestScore } from "../lib/highscores";
import { useAutoPause } from "../lib/useAutoPause";
import HighScoreOverlay from "./HighScoreOverlay";

// ---------------------------------------------------------------------------
// Constants — match the original Java game
// ---------------------------------------------------------------------------

const COLS = 15;
const ROWS = 13;
const TILE = 40;
const GRID_X0 = 160;
const GRID_Y0 = 60;
const W = GRID_X0 + COLS * TILE + 40;
const H = GRID_Y0 + ROWS * TILE + 40;
const PLAYER_W = 24;
const PLAYER_H = 31;
const DEFAULT_SPEED = 2;
const DEFAULT_BOMBS = 3;
const DEFAULT_RADIUS = 1;
const BOMB_FUSE_MS = 3000;
const BOMB_EXPLODE_MS = 400;
const TIME_LIMIT = 180;
const TICK_MS = 1000 / 60;
const MAX_ACCUMULATOR = TICK_MS * 5;
const SNOWBALL_POINTS = 100;
const PLAYER_HIT_POINTS = 1000;
const COOL_POINTS = 5000;
const LEVEL_TRANSITION_MS = 2000;
const PICKUP_FLASH_MS = 600;

const P1_START_COL = 1;
const P1_START_ROW = 1;
const P2_START_COL = 13;
const P2_START_ROW = 11;

// Colors
const CLR_BG = "#2c3e50";
const CLR_GRID_BG = "#1a1a2e";
const CLR_WALL = "#5d6d7e";
const CLR_WALL_BORDER = "#4a5568";
const CLR_SNOWBALL = "#b0c4de";
const CLR_SNOWBALL_BORDER = "#8fa4be";
const CLR_P1 = "#2d2d2d";
const CLR_P1_ACCENT = "#e74c3c";
const CLR_P2 = "#ecf0f1";
const CLR_P2_ACCENT = "#3498db";
const CLR_EXPLOSION = "#e74c3c";
const CLR_EXPLOSION_GLOW = "rgba(231,76,60,0.4)";
const CLR_FIRE_PU = "#e74c3c";
const CLR_BOMB_PU = "#9b59b6";
const CLR_SPEED_PU = "#2ecc71";
const CLR_COOL_PU = "#f1c40f";
const CLR_HUD_TEXT = "#bbb";
const CLR_HUD_BG = "rgba(0,0,0,0.6)";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildGrid(levelIndex: number): Tile[][] {
  const layout = LEVELS[levelIndex % LEVELS.length];
  const grid: Tile[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const line = layout[r] ?? "";
    const row: Tile[] = [];
    for (let c = 0; c < COLS; c++) {
      const ch = line[c] ?? "O";
      const x = GRID_X0 + c * TILE;
      const y = GRID_Y0 + r * TILE;
      const base: Tile = {
        x, y, w: TILE, h: TILE,
        solid: false, snowball: false, bomb: false,
        firePower: false, bombPower: false, speedPower: false, cool: false,
      };
      switch (ch) {
        case "B": base.solid = true; break;
        case "S": base.solid = true; base.snowball = true; break;
        case "f": base.solid = true; base.snowball = true; base.firePower = true; break;
        case "b": base.solid = true; base.snowball = true; base.bombPower = true; break;
        case "s": base.solid = true; base.snowball = true; base.speedPower = true; break;
        case "c": base.solid = true; base.snowball = true; base.cool = true; break;
      }
      row.push(base);
    }
    grid.push(row);
  }
  return grid;
}

function makePlayer(row: number, col: number): Player {
  return {
    x: GRID_X0 + col * TILE + (TILE - PLAYER_W) / 2,
    y: GRID_Y0 + row * TILE + (TILE - PLAYER_H) / 2,
    w: PLAYER_W, h: PLAYER_H,
    speed: DEFAULT_SPEED,
    bombCount: DEFAULT_BOMBS,
    tempBombCount: DEFAULT_BOMBS,
    bombRadius: DEFAULT_RADIUS,
    score: 0,
    alive: true,
  };
}

function playerGridPos(p: Player): [number, number] {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const col = Math.floor((cx - GRID_X0) / TILE);
  const row = Math.floor((cy - GRID_Y0) / TILE);
  return [
    Math.max(0, Math.min(ROWS - 1, row)),
    Math.max(0, Math.min(COLS - 1, col)),
  ];
}

function rectsIntersect(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function playerCollisionRect(p: Player): [number, number, number, number] {
  return [p.x + 4, p.y + p.h / 2, p.w - 8, p.h / 2];
}

function canMove(
  grid: Tile[][],
  px: number, py: number, pw: number, ph: number,
  curPx: number, curPy: number, curPw: number, curPh: number,
): boolean {
  const cr = [px + 4, py + ph / 2, pw - 8, ph / 2] as const;
  const curCr = [curPx + 4, curPy + curPh / 2, curPw - 8, curPh / 2] as const;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = grid[r][c];
      if (!t.solid && !t.bomb) continue;
      if (!rectsIntersect(cr[0], cr[1], cr[2], cr[3], t.x, t.y, t.w, t.h)) continue;
      if (t.bomb && !t.solid &&
          rectsIntersect(curCr[0], curCr[1], curCr[2], curCr[3], t.x, t.y, t.w, t.h)) {
        continue;
      }
      return false;
    }
  }
  if (cr[0] < GRID_X0 || cr[1] < GRID_Y0 ||
      cr[0] + cr[2] > GRID_X0 + COLS * TILE ||
      cr[1] + cr[3] > GRID_Y0 + ROWS * TILE) {
    return false;
  }
  return true;
}

function initState(bestScore = 0): GameState {
  return {
    phase: Phase.Menu,
    p1: makePlayer(P1_START_ROW, P1_START_COL),
    p2: makePlayer(P2_START_ROW, P2_START_COL),
    grid: buildGrid(0),
    bombs: [],
    level: 0,
    keys: {},
    gameStartedAt: 0,
    timeLimitSec: TIME_LIMIT,
    bestScore,
    paused: false,
    levelTransitionAt: 0,
    pickups: [],
  };
}

function bombCounter(b: Bomb, now: number): number {
  const elapsed = now - b.placedAt;
  if (elapsed < BOMB_FUSE_MS * 0.33) return 0;
  if (elapsed < BOMB_FUSE_MS * 0.66) return 1;
  if (elapsed < BOMB_FUSE_MS) return 2;
  if (elapsed < BOMB_FUSE_MS + BOMB_EXPLODE_MS) return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);
  return touch;
}

export default function BombermanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState>(initState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const [_, forceRender] = useState(0);
  const [showHighScores, setShowHighScores] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const isTouch = useIsTouch();
  const mobileRef = useRef(false);
  mobileRef.current = isTouch;

  useEffect(() => {
    gsRef.current.bestScore = getBestScore("bomberman");
  }, []);

  useAutoPause({ gsRef, playPhase: Phase.Play, forceRender });

  useEffect(() => {
    if (isTouch) {
      gsRef.current.p2.alive = false;
    }
  }, [isTouch]);

  // ---- keyboard ----
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const gs = gsRef.current;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space",
           "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) {
        e.preventDefault();
      }
      gs.keys[e.code] = true;

      if (gs.phase === Phase.Menu && e.code === "Space") {
        gs.phase = Phase.Play;
        gs.gameStartedAt = performance.now();
        forceRender((n) => n + 1);
        return;
      }

      if (e.code === "Escape" || e.code === "KeyP") {
        if (gs.phase === Phase.Play) {
          gs.paused = !gs.paused;
          if (!gs.paused) {
            lastTimeRef.current = 0;
            accumulatorRef.current = 0;
          }
          forceRender((n) => n + 1);
          return;
        }
      }

      // restart handled by overlay
    };
    const onUp = (e: KeyboardEvent) => { gsRef.current.keys[e.code] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- touch: tap canvas to start / restart ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const gs = gsRef.current;
      if (gs.phase === Phase.Menu) {
        gs.phase = Phase.Play;
        gs.gameStartedAt = performance.now();
        if (mobileRef.current) gs.p2.alive = false;
        forceRender((n) => n + 1);
      }
    };

    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => { canvas.removeEventListener("touchend", onTouchEnd); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- game loop ----
  useEffect(() => {
    let running = true;
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;

    const tick = (timestamp: number) => {
      if (!running) return;
      const gs = gsRef.current;
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(tick); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      accumulatorRef.current = Math.min(accumulatorRef.current + delta, MAX_ACCUMULATOR);

      while (accumulatorRef.current >= TICK_MS) {
        if (gs.phase === Phase.Play && !gs.paused) {
          update(gs);
        }
        if (gs.phase === Phase.LevelTransition) {
          updateLevelTransition(gs);
        }
        accumulatorRef.current -= TICK_MS;
      }

      draw(ctx, gs);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- update ----
  const update = (gs: GameState) => {
    const { keys, grid } = gs;
    const now = performance.now();

    // timer check
    const elapsed = (now - gs.gameStartedAt) / 1000;
    if (elapsed >= gs.timeLimitSec) {
      gs.phase = Phase.GameOver;
      const top = mobileRef.current ? gs.p1.score : Math.max(gs.p1.score, gs.p2.score);
      setFinalScore(top);
      setShowHighScores(true);
      forceRender((n) => n + 1);
      return;
    }

    const mobile = mobileRef.current;

    // P1 movement (WASD)
    movePlayer(gs.p1, grid, keys, "KeyW", "KeyS", "KeyA", "KeyD");
    if (!mobile) {
      movePlayer(gs.p2, grid, keys, "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight");
    }

    // P1 bomb placement (Space)
    if (keys["Space"]) {
      keys["Space"] = false;
      placeBomb(gs, gs.p1, 1, now);
    }
    if (!mobile && keys["Backslash"]) {
      keys["Backslash"] = false;
      placeBomb(gs, gs.p2, 2, now);
    }

    // process bombs
    updateBombs(gs, now);

    // power-up collection
    checkPowerUps(gs, gs.p1);
    if (!mobile) checkPowerUps(gs, gs.p2);

    // expire old pickup flash events
    gs.pickups = gs.pickups.filter((p) => now - p.time < PICKUP_FLASH_MS);

    // [Improvement #6] level clear → transition phase
    if (isLevelClear(grid)) {
      gs.phase = Phase.LevelTransition;
      gs.levelTransitionAt = now;
    }
  };

  function updateLevelTransition(gs: GameState) {
    const now = performance.now();
    if (now - gs.levelTransitionAt >= LEVEL_TRANSITION_MS) {
      gs.level++;
      gs.grid = buildGrid(gs.level);
      gs.bombs = [];
      gs.p1.x = GRID_X0 + P1_START_COL * TILE + (TILE - PLAYER_W) / 2;
      gs.p1.y = GRID_Y0 + P1_START_ROW * TILE + (TILE - PLAYER_H) / 2;
      gs.p1.tempBombCount = gs.p1.bombCount;
      if (!mobileRef.current) {
        gs.p2.x = GRID_X0 + P2_START_COL * TILE + (TILE - PLAYER_W) / 2;
        gs.p2.y = GRID_Y0 + P2_START_ROW * TILE + (TILE - PLAYER_H) / 2;
        gs.p2.tempBombCount = gs.p2.bombCount;
      }
      gs.phase = Phase.Play;
    }
  }

  function movePlayer(
    p: Player, grid: Tile[][],
    keys: Record<string, boolean>,
    up: string, down: string, left: string, right: string,
  ) {
    if (!p.alive) return;
    const spd = p.speed;
    const { x, y, w, h } = p;
    if (keys[up] && canMove(grid, x, y - spd, w, h, x, y, w, h)) p.y -= spd;
    else if (keys[down] && canMove(grid, x, y + spd, w, h, x, y, w, h)) p.y += spd;
    else if (keys[left] && canMove(grid, x - spd, y, w, h, x, y, w, h)) p.x -= spd;
    else if (keys[right] && canMove(grid, x + spd, y, w, h, x, y, w, h)) p.x += spd;
  }

  function placeBomb(gs: GameState, p: Player, id: 1 | 2, now: number) {
    if (!p.alive || p.tempBombCount <= 0) return;
    const [row, col] = playerGridPos(p);
    if (gs.grid[row][col].bomb) return;
    gs.grid[row][col].bomb = true;
    gs.bombs.push({ id, placedAt: now, gridRow: row, gridCol: col });
    p.tempBombCount--;
  }

  function updateBombs(gs: GameState, now: number) {
    const toRemove: number[] = [];
    for (let i = 0; i < gs.bombs.length; i++) {
      const b = gs.bombs[i];
      const counter = bombCounter(b, now);
      if (counter >= 4) {
        toRemove.push(i);
        explodeBomb(gs, b);
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) {
      gs.bombs.splice(toRemove[i], 1);
    }
  }

  // [Improvement #1] Chain explosions: when blast hits another bomb, detonate it
  function explodeBomb(gs: GameState, b: Bomb) {
    const { grid, p1, p2 } = gs;
    const r = b.gridRow;
    const c = b.gridCol;
    grid[r][c].bomb = false;

    const owner = b.id === 1 ? p1 : p2;
    owner.tempBombCount = Math.min(owner.tempBombCount + 1, owner.bombCount);
    const radius = owner.bombRadius;

    checkExplosionHit(gs, r, c);

    const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      for (let dist = 1; dist <= radius; dist++) {
        const nr = r + dr * dist;
        const nc = c + dc * dist;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
        const tile = grid[nr][nc];

        // chain reaction: if blast hits another bomb, detonate it immediately
        if (tile.bomb) {
          const idx = gs.bombs.findIndex(
            (ob) => ob.gridRow === nr && ob.gridCol === nc,
          );
          if (idx !== -1) {
            const chainedBomb = gs.bombs[idx];
            gs.bombs.splice(idx, 1);
            explodeBomb(gs, chainedBomb);
          }
          break;
        }

        if (tile.snowball) {
          tile.snowball = false;
          tile.solid = false;
          owner.score += SNOWBALL_POINTS * (gs.level + 1);
          break;
        }
        if (tile.solid) break;

        checkExplosionHit(gs, nr, nc);

        tile.firePower = false;
        tile.bombPower = false;
        tile.speedPower = false;
        tile.cool = false;
      }
    }
  }

  // [Improvement #2] Use rectsIntersect instead of rectContains for hit detection
  function checkExplosionHit(gs: GameState, row: number, col: number) {
    const tile = gs.grid[row][col];

    if (gs.p1.alive) {
      const cr = playerCollisionRect(gs.p1);
      if (rectsIntersect(tile.x, tile.y, tile.w, tile.h, cr[0], cr[1], cr[2], cr[3])) {
        gs.p2.score += PLAYER_HIT_POINTS * (gs.level + 1);
      }
    }
    if (gs.p2.alive) {
      const cr = playerCollisionRect(gs.p2);
      if (rectsIntersect(tile.x, tile.y, tile.w, tile.h, cr[0], cr[1], cr[2], cr[3])) {
        gs.p1.score += PLAYER_HIT_POINTS * (gs.level + 1);
      }
    }
  }

  // [Improvement #7] Power-up pickup with flash events
  function checkPowerUps(gs: GameState, p: Player) {
    if (!p.alive) return;
    const [row, col] = playerGridPos(p);
    const tile = gs.grid[row][col];
    const cr = playerCollisionRect(p);
    if (!rectsIntersect(cr[0], cr[1], cr[2], cr[3], tile.x, tile.y, tile.w, tile.h)) return;

    const now = performance.now();
    const cx = tile.x + tile.w / 2;
    const cy = tile.y;

    if (tile.firePower) {
      tile.firePower = false; p.bombRadius++;
      gs.pickups.push({ x: cx, y: cy, label: "+Flame", color: CLR_FIRE_PU, time: now });
    }
    if (tile.bombPower) {
      tile.bombPower = false; p.bombCount++; p.tempBombCount++;
      gs.pickups.push({ x: cx, y: cy, label: "+Bomb", color: CLR_BOMB_PU, time: now });
    }
    if (tile.speedPower) {
      tile.speedPower = false; if (p.speed < 5) p.speed++;
      gs.pickups.push({ x: cx, y: cy, label: "+Speed", color: CLR_SPEED_PU, time: now });
    }
    if (tile.cool) {
      tile.cool = false; p.score += COOL_POINTS;
      gs.pickups.push({ x: cx, y: cy, label: "+5000", color: CLR_COOL_PU, time: now });
    }
  }

  function isLevelClear(grid: Tile[][]): boolean {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].snowball) return false;
      }
    }
    return true;
  }

  // ---- draw ----
  const draw = (ctx: CanvasRenderingContext2D, gs: GameState) => {
    const now = performance.now();
    const mobile = mobileRef.current;

    ctx.fillStyle = CLR_BG;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = CLR_GRID_BG;
    ctx.fillRect(GRID_X0, GRID_Y0, COLS * TILE, ROWS * TILE);

    drawGrid(ctx, gs.grid);
    drawBombs(ctx, gs, now);

    if (gs.phase === Phase.Play || gs.phase === Phase.Paused || gs.phase === Phase.LevelTransition) {
      drawPlayer(ctx, gs.p1, CLR_P1, CLR_P1_ACCENT);
      if (!mobile) drawPlayer(ctx, gs.p2, CLR_P2, CLR_P2_ACCENT);
    }

    drawPickups(ctx, gs.pickups, now);

    drawHUD(ctx, gs, now, mobile);

    if (gs.phase === Phase.Menu) drawMenuOverlay(ctx, mobile);
    if (gs.paused && gs.phase === Phase.Play) drawPauseOverlay(ctx, mobile);
    if (gs.phase === Phase.GameOver) drawGameOverOverlay(ctx, gs, mobile);
    if (gs.phase === Phase.LevelTransition) drawLevelTransitionOverlay(ctx, gs, now);
  };

  function drawGrid(ctx: CanvasRenderingContext2D, grid: Tile[][]) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = grid[r][c];
        if (t.solid && !t.snowball) {
          ctx.fillStyle = CLR_WALL;
          ctx.fillRect(t.x, t.y, t.w, t.h);
          ctx.strokeStyle = CLR_WALL_BORDER;
          ctx.lineWidth = 1;
          ctx.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1);
          ctx.strokeStyle = "rgba(0,0,0,0.15)";
          ctx.beginPath();
          ctx.moveTo(t.x, t.y + t.h / 2); ctx.lineTo(t.x + t.w, t.y + t.h / 2);
          ctx.moveTo(t.x + t.w / 2, t.y); ctx.lineTo(t.x + t.w / 2, t.y + t.h / 2);
          ctx.stroke();
        } else if (t.snowball) {
          ctx.fillStyle = CLR_SNOWBALL;
          ctx.fillRect(t.x, t.y, t.w, t.h);
          ctx.strokeStyle = CLR_SNOWBALL_BORDER;
          ctx.lineWidth = 1;
          ctx.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1);
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.beginPath();
          ctx.moveTo(t.x + 8, t.y + 8); ctx.lineTo(t.x + t.w - 8, t.y + t.h - 8);
          ctx.moveTo(t.x + t.w - 8, t.y + 8); ctx.lineTo(t.x + 8, t.y + t.h - 8);
          ctx.stroke();
        } else if (!t.solid) {
          if (t.firePower) drawPowerUp(ctx, t, CLR_FIRE_PU, "F");
          else if (t.bombPower) drawPowerUp(ctx, t, CLR_BOMB_PU, "B");
          else if (t.speedPower) drawPowerUp(ctx, t, CLR_SPEED_PU, "S");
          else if (t.cool) drawPowerUp(ctx, t, CLR_COOL_PU, "\u2605");
        }
      }
    }
  }

  function drawPowerUp(ctx: CanvasRenderingContext2D, t: Tile, color: string, label: string) {
    const cx = t.x + t.w / 2;
    const cy = t.y + t.h / 2;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px 'Syne', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy + 1);
  }

  // [Improvements #4 + #5] Player-colored bombs with smooth sine-wave pulse
  function drawBombs(ctx: CanvasRenderingContext2D, gs: GameState, now: number) {
    for (const b of gs.bombs) {
      const counter = bombCounter(b, now);
      const tile = gs.grid[b.gridRow][b.gridCol];
      const cx = tile.x + tile.w / 2;
      const cy = tile.y + tile.h / 2;
      const accent = b.id === 1 ? CLR_P1_ACCENT : CLR_P2_ACCENT;

      if (counter < 3) {
        const elapsed = now - b.placedAt;
        const radius = 7 + 4 * Math.abs(Math.sin(elapsed * 0.003));

        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // fuse spark
        ctx.fillStyle = "#f5a623";
        ctx.beginPath();
        ctx.arc(cx, cy - radius + 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const owner = b.id === 1 ? gs.p1 : gs.p2;
        const radius = owner.bombRadius;
        drawExplosionCell(ctx, tile);
        const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
          for (let dist = 1; dist <= radius; dist++) {
            const nr = b.gridRow + dr * dist;
            const nc = b.gridCol + dc * dist;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
            const t = gs.grid[nr][nc];
            if (t.solid && !t.snowball) break;
            drawExplosionCell(ctx, t);
            if (t.snowball) break;
          }
        }
      }
    }
  }

  function drawExplosionCell(ctx: CanvasRenderingContext2D, t: Tile) {
    ctx.fillStyle = CLR_EXPLOSION_GLOW;
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = CLR_EXPLOSION;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(t.x + 4, t.y + 4, t.w - 8, t.h - 8);
    ctx.globalAlpha = 1;
  }

  function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, body: string, accent: string) {
    if (!p.alive) return;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 9, 2, 0, Math.PI * 2);
    ctx.arc(cx + 3, cy - 9, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // [Improvement #7] Floating pickup text
  function drawPickups(ctx: CanvasRenderingContext2D, pickups: PickupEvent[], now: number) {
    for (const p of pickups) {
      const age = now - p.time;
      const progress = age / PICKUP_FLASH_MS;
      const alpha = 1 - progress;
      const yOff = progress * 30;

      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;
      ctx.font = "bold 14px 'Syne', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(p.label, p.x, p.y - yOff);
      ctx.globalAlpha = 1;
    }
  }

  function drawHUD(ctx: CanvasRenderingContext2D, gs: GameState, now: number, mobile: boolean) {
    ctx.fillStyle = CLR_HUD_BG;
    ctx.fillRect(0, 0, W, GRID_Y0 - 4);

    const midY = (GRID_Y0 - 4) / 2 - 6;

    ctx.font = "bold 20px 'Syne', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = CLR_P1_ACCENT;
    ctx.textAlign = "left";
    ctx.fillText(mobile ? `Score: ${gs.p1.score}` : `P1: ${gs.p1.score}`, 16, midY);

    ctx.font = "12px 'Helvetica Neue', sans-serif";
    ctx.fillStyle = "rgba(231,76,60,0.7)";
    ctx.fillText(
      `\uD83D\uDCA3${gs.p1.tempBombCount}/${gs.p1.bombCount}  \uD83D\uDD25${gs.p1.bombRadius}  \uD83D\uDC5F${gs.p1.speed}`,
      16, midY + 16,
    );

    ctx.fillStyle = CLR_HUD_TEXT;
    ctx.font = "bold 22px 'Syne', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Level ${gs.level + 1}`, W / 2, (GRID_Y0 - 4) / 2);

    if (!mobile) {
      ctx.font = "bold 20px 'Syne', sans-serif";
      ctx.fillStyle = CLR_P2_ACCENT;
      ctx.textAlign = "right";
      ctx.fillText(`P2: ${gs.p2.score}`, W - 16, midY);

      ctx.font = "12px 'Helvetica Neue', sans-serif";
      ctx.fillStyle = "rgba(52,152,219,0.7)";
      ctx.fillText(
        `\uD83D\uDCA3${gs.p2.tempBombCount}/${gs.p2.bombCount}  \uD83D\uDD25${gs.p2.bombRadius}  \uD83D\uDC5F${gs.p2.speed}`,
        W - 16, midY + 16,
      );
    }

    if (gs.phase === Phase.Play || gs.phase === Phase.LevelTransition) {
      const remaining = Math.max(0, Math.ceil(gs.timeLimitSec - (now - gs.gameStartedAt) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const timerStr = `${mins}:${secs.toString().padStart(2, "0")}`;
      ctx.fillStyle = remaining <= 30 ? "#e74c3c" : CLR_HUD_TEXT;
      ctx.font = "bold 20px 'Syne', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(timerStr, W / 2, GRID_Y0 + ROWS * TILE + 8);
    }

    if (!mobile) {
      ctx.font = "12px 'Helvetica Neue', sans-serif";
      ctx.fillStyle = "#666";
      ctx.textBaseline = "top";
      const legendY = GRID_Y0 + ROWS * TILE + 8;
      ctx.textAlign = "left";
      ctx.fillText("P1: WASD + Space", 16, legendY);
      ctx.textAlign = "right";
      ctx.fillText("P2: Arrows + \\", W - 16, legendY);
    }
  }

  function drawMenuOverlay(ctx: CanvasRenderingContext2D, mobile: boolean) {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#f5a623";
    ctx.font = "bold 56px 'Syne', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BOMBERMAN", W / 2, H / 2 - 60);

    ctx.fillStyle = "#ecf0f1";
    ctx.font = "24px 'Syne', sans-serif";
    ctx.fillText(mobile ? "Single Player" : "2-Player Local Multiplayer", W / 2, H / 2 - 10);

    if (mobile) {
      ctx.fillStyle = CLR_P1_ACCENT;
      ctx.font = "18px 'Syne', sans-serif";
      ctx.fillText("Use D-pad to move, tap BOMB to place", W / 2, H / 2 + 40);
    } else {
      ctx.fillStyle = CLR_P1_ACCENT;
      ctx.font = "18px 'Syne', sans-serif";
      ctx.fillText("P1: WASD to move, Space to bomb", W / 2, H / 2 + 40);

      ctx.fillStyle = CLR_P2_ACCENT;
      ctx.fillText("P2: Arrow keys to move, \\ to bomb", W / 2, H / 2 + 70);
    }

    ctx.fillStyle = "#bbb";
    ctx.font = "bold 22px 'Syne', sans-serif";
    ctx.fillText(mobile ? "Tap to start" : "Press SPACE to start", W / 2, H / 2 + 130);
  }

  function drawPauseOverlay(ctx: CanvasRenderingContext2D, mobile: boolean) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 56px 'Syne', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSED", W / 2, H / 2 - 10);
    ctx.font = "22px 'Syne', sans-serif";
    ctx.fillStyle = "#bbb";
    ctx.fillText(mobile ? "Tap Resume to continue" : "Press ESC or P to resume", W / 2, H / 2 + 35);
  }

  function drawGameOverOverlay(ctx: CanvasRenderingContext2D, _gs: GameState, _mobile: boolean) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, W, H);
  }

  // [Improvement #6] Level transition overlay
  function drawLevelTransitionOverlay(ctx: CanvasRenderingContext2D, gs: GameState, now: number) {
    const progress = Math.min(1, (now - gs.levelTransitionAt) / LEVEL_TRANSITION_MS);

    ctx.fillStyle = `rgba(0,0,0,${0.6 * (1 - Math.abs(progress * 2 - 1))})`;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = progress < 0.5 ? progress * 2 : 2 - progress * 2;
    ctx.fillStyle = "#f5a623";
    ctx.font = "bold 48px 'Syne', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Level ${gs.level + 1} Complete!`, W / 2, H / 2 - 20);

    ctx.fillStyle = "#ecf0f1";
    ctx.font = "24px 'Syne', sans-serif";
    ctx.fillText(`Get ready for Level ${gs.level + 2}...`, W / 2, H / 2 + 30);
    ctx.globalAlpha = 1;
  }

  // ---- helpers ----
  const restartGame = useCallback(() => {
    const best = getBestScore("bomberman");
    gsRef.current = initState(best);
    setShowHighScores(false);
    if (mobileRef.current) gsRef.current.p2.alive = false;
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;
    forceRender((n) => n + 1);
  }, []);

  const togglePause = useCallback(() => {
    const gs = gsRef.current;
    if (gs.phase === Phase.Play) {
      gs.paused = !gs.paused;
      if (!gs.paused) {
        lastTimeRef.current = 0;
        accumulatorRef.current = 0;
      }
      forceRender((n) => n + 1);
    }
  }, []);

  const dpadDown = useCallback((key: string) => {
    gsRef.current.keys[key] = true;
  }, []);

  const dpadUp = useCallback((key: string) => {
    gsRef.current.keys[key] = false;
  }, []);

  return (
    <div style={styles.wrapper}>
      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={styles.canvas}
          tabIndex={0}
        />
        {showHighScores && (
          <HighScoreOverlay
            gameId="bomberman"
            score={finalScore}
            onDismiss={restartGame}
          />
        )}
      </div>
      {isTouch ? (
        <>
          <div style={styles.touchControls}>
            <div style={styles.dpad}>
              <div style={styles.dpadRow}>
                <DpadButton label="\u25B2" keyCode="KeyW" onDown={dpadDown} onUp={dpadUp} />
              </div>
              <div style={styles.dpadRow}>
                <DpadButton label="\u25C0" keyCode="KeyA" onDown={dpadDown} onUp={dpadUp} />
                <div style={styles.dpadSpacer} />
                <DpadButton label="\u25B6" keyCode="KeyD" onDown={dpadDown} onUp={dpadUp} />
              </div>
              <div style={styles.dpadRow}>
                <DpadButton label="\u25BC" keyCode="KeyS" onDown={dpadDown} onUp={dpadUp} />
              </div>
            </div>
            <div style={styles.actionButtons}>
              <DpadButton label="BOMB" keyCode="Space" onDown={dpadDown} onUp={dpadUp} large />
              <button type="button" onClick={togglePause} style={styles.pauseBtn}>
                {gsRef.current.paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <p style={styles.hint}>
          <kbd>WASD</kbd> + <kbd>Space</kbd> for P1&ensp;|&ensp;
          <kbd>←↑→↓</kbd> + <kbd>\</kbd> for P2&ensp;|&ensp;
          <kbd>Esc</kbd> to pause
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// D-pad button component
// ---------------------------------------------------------------------------

function DpadButton({ label, keyCode, onDown, onUp, large }: {
  label: string;
  keyCode: string;
  onDown: (key: string) => void;
  onUp: (key: string) => void;
  large?: boolean;
}) {
  const btnStyle: React.CSSProperties = large ? {
    ...dpadStyles.btn,
    width: 80,
    height: 80,
    borderRadius: 40,
    fontSize: "0.85rem",
    fontWeight: "bold",
    backgroundColor: CLR_P1_ACCENT,
    color: "#fff",
    border: "2px solid rgba(255,255,255,0.3)",
  } : dpadStyles.btn;

  return (
    <button
      type="button"
      style={btnStyle}
      onPointerDown={(e) => { e.preventDefault(); onDown(keyCode); }}
      onPointerUp={(e) => { e.preventDefault(); onUp(keyCode); }}
      onPointerLeave={(e) => { e.preventDefault(); onUp(keyCode); }}
      onPointerCancel={(e) => { e.preventDefault(); onUp(keyCode); }}
    >
      {label}
    </button>
  );
}

const dpadStyles: Record<string, React.CSSProperties> = {
  btn: {
    width: 56,
    height: 56,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#ddd",
    fontSize: "1.3rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    cursor: "pointer",
  },
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  canvasContainer: {
    position: "relative",
    width: "100%",
    maxWidth: W,
  },
  canvas: {
    width: "100%",
    maxWidth: W,
    height: "auto",
    aspectRatio: `${W} / ${H}`,
    borderRadius: 8,
    display: "block",
    touchAction: "none",
  },
  hint: {
    marginTop: "0.75rem",
    color: "#888",
    fontSize: "0.9rem",
  },
  touchControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2rem",
    marginTop: "0.75rem",
    width: "100%",
    maxWidth: W,
    touchAction: "none",
  },
  dpad: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  dpadRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  dpadSpacer: {
    width: 56,
    height: 56,
  },
  actionButtons: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  pauseBtn: {
    padding: "0.4rem 1.2rem",
    fontSize: "0.85rem",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#ddd",
    cursor: "pointer",
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
  } as React.CSSProperties,
};
