import { useRef, useEffect, useCallback, useState } from "react";
import { getBestScore } from "../lib/highscores";
import HighScoreOverlay from "./HighScoreOverlay";
import {
  W,
  H,
  PLAY_AREA_RIGHT,
  PLAY_AREA_LEFT,
  HUD_LEFT,
  TICK_MS,
  MAX_ACCUMULATOR,
  PLAYER_W,
  PLAYER_H,
  PLAYER_BASE_SPEED,
  PLAYER_FOCUS_SPEED,
  PLAYER_SHOOT_COOLDOWN,
  PLAYER_BOMB_COOLDOWN,
  INVINCIBLE_DURATION,
  DEATH_SCORE_PENALTY,
  INITIAL_LIVES,
  HIT_FLASH_TICKS,
  STAT_CAP,
  StatIndex,
  PLAYER_BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  BULLET_SIZE,
  POWERUP_SIZE,
  POWERUP_SPEED,
  POWERUP_KINDS,
  POWERUP_COLORS,
  SCORE_PER_KILL,
  Phase,
  SPEED_OPTIONS,
  type Player,
  type Bullet,
  type Enemy,
  type PowerUp,
  type Star,
  type GameState,
  type PowerUpKind,
} from "../game/starflux/types";
import { buildStage } from "../game/starflux/waves";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlayer(): Player {
  return {
    x: (PLAY_AREA_LEFT + PLAY_AREA_RIGHT) / 2 - PLAYER_W / 2,
    y: H - PLAYER_H - 20,
    w: PLAYER_W,
    h: PLAYER_H,
    stats: [3, 1, 0, 1, 0],
    invincibleTimer: 0,
    shootTimer: 0,
    bombTimer: 0,
    hitFlashTimer: 0,
  };
}

function makeStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * PLAY_AREA_RIGHT,
      y: Math.random() * H,
      speed: 0.5 + Math.random() * 2.5,
      size: 0.5 + Math.random() * 2,
      brightness: 0.3 + Math.random() * 0.7,
    });
  }
  return stars;
}

function initState(bestScore = 0, speedMultiplier = 1): GameState {
  return {
    phase: Phase.Menu,
    player: makePlayer(),
    bullets: [],
    enemies: buildStage(0),
    powerUps: [],
    stars: makeStars(120),
    score: 0,
    bestScore,
    stage: 0,
    lives: INITIAL_LIVES,
    paused: false,
    keys: {},
    speedMultiplier,
    tickCount: 0,
  };
}

function rectsIntersect(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function vectorize(
  x: number, y: number, tx: number, ty: number, speed: number,
): { vx: number; vy: number } {
  const dx = tx - x;
  const dy = ty - y;
  const angle = Math.atan2(dy, dx);
  return { vx: speed * Math.cos(angle), vy: speed * Math.sin(angle) };
}

// ---------------------------------------------------------------------------
// Touch detection
// ---------------------------------------------------------------------------

function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);
  return touch;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StarfluxGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState>(initState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const [_, forceRender] = useState(0);
  const [activeSpeed, setActiveSpeed] = useState(1);
  const [showHighScores, setShowHighScores] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const isTouch = useIsTouch();
  const isTouchRef = useRef(false);
  isTouchRef.current = isTouch;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    gsRef.current.bestScore = getBestScore("starflux");
  }, []);

  // ---- keyboard ----
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const gs = gsRef.current;
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyZ", "KeyX"].includes(e.code)
      ) {
        e.preventDefault();
      }
      gs.keys[e.code] = true;

      if ((e.code === "Escape" || e.code === "KeyP") && gs.phase === Phase.Play) {
        gs.paused = !gs.paused;
        if (!gs.paused) {
          lastTimeRef.current = 0;
          accumulatorRef.current = 0;
        }
        forceRender((n) => n + 1);
        return;
      }

      if (e.code === "KeyZ" || e.code === "Space") {
        if (gs.phase === Phase.Menu) {
          gs.phase = Phase.Play;
          forceRender((n) => n + 1);
        }
      }
    };
    const onUp = (e: KeyboardEvent) => {
      gsRef.current.keys[e.code] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- touch controls ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function gameCoords(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      return {
        gx: ((clientX - rect.left) / rect.width) * W,
        gy: ((clientY - rect.top) / rect.height) * H,
      };
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
      const gs = gsRef.current;
      if (gs.phase === Phase.Play && !gs.paused) {
        const { gx } = gameCoords(t.clientX, t.clientY);
        gs.player.x = Math.max(
          PLAY_AREA_LEFT,
          Math.min(PLAY_AREA_RIGHT - gs.player.w, gx - gs.player.w / 2),
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const gs = gsRef.current;
      if (gs.phase === Phase.Play && !gs.paused) {
        const { gx, gy } = gameCoords(t.clientX, t.clientY);
        gs.player.x = Math.max(
          PLAY_AREA_LEFT,
          Math.min(PLAY_AREA_RIGHT - gs.player.w, gx - gs.player.w / 2),
        );
        gs.player.y = Math.max(0, Math.min(H - gs.player.h, gy - gs.player.h / 2));

        // auto-shoot while dragging
        gs.keys["KeyZ"] = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const gs = gsRef.current;
      gs.keys["KeyZ"] = false;

      const start = touchStartRef.current;
      const end = e.changedTouches[0];
      const moved = start ? Math.hypot(end.clientX - start.x, end.clientY - start.y) : 0;
      touchStartRef.current = null;

      if (moved < 15) {
        if (gs.phase === Phase.Menu) {
          gs.phase = Phase.Play;
          forceRender((n) => n + 1);
        }
      }
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
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
        updateStars(gs);
        accumulatorRef.current -= TICK_MS;
      }

      draw(ctx, gs);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- starfield ----
  const updateStars = (gs: GameState) => {
    for (const star of gs.stars) {
      star.y += star.speed * gs.speedMultiplier;
      if (star.y > H) {
        star.y = 0;
        star.x = Math.random() * PLAY_AREA_RIGHT;
      }
    }
  };

  // ---- update logic ----
  const update = (gs: GameState) => {
    gs.tickCount++;
    const { player, keys } = gs;
    const sm = gs.speedMultiplier;

    // -- player movement --
    const speed = (keys["ShiftLeft"] || keys["ShiftRight"])
      ? PLAYER_FOCUS_SPEED
      : PLAYER_BASE_SPEED + player.stats[StatIndex.SpeedBoost];

    if (keys["ArrowUp"]) player.y -= speed;
    if (keys["ArrowDown"]) player.y += speed;
    if (keys["ArrowLeft"]) player.x -= speed;
    if (keys["ArrowRight"]) player.x += speed;

    player.x = Math.max(PLAY_AREA_LEFT, Math.min(PLAY_AREA_RIGHT - player.w, player.x));
    player.y = Math.max(0, Math.min(H - player.h, player.y));

    // -- invincibility countdown --
    if (player.invincibleTimer > 0) player.invincibleTimer--;
    if (player.invincibleTimer <= 0) player.stats[StatIndex.Invincibility] = 0;

    // -- player shoot --
    player.shootTimer++;
    if (keys["KeyZ"] && player.shootTimer >= PLAYER_SHOOT_COOLDOWN) {
      const cx = player.x + player.w / 2;
      const py = player.y;
      const bspd = PLAYER_BULLET_SPEED * sm;

      if (player.stats[StatIndex.Power] >= 1) {
        gs.bullets.push({
          x: cx - BULLET_SIZE / 2, y: py, w: BULLET_SIZE, h: BULLET_SIZE,
          vx: 0, vy: -bspd, owner: "player",
        });
      }
      if (player.stats[StatIndex.Power] >= 2) {
        gs.bullets.push({
          x: cx + 10, y: py, w: BULLET_SIZE, h: BULLET_SIZE,
          vx: 0, vy: -bspd, owner: "player",
        });
        gs.bullets.push({
          x: cx - 25, y: py, w: BULLET_SIZE, h: BULLET_SIZE,
          vx: 0, vy: -bspd, owner: "player",
        });
      }
      if (player.stats[StatIndex.Power] >= 3) {
        gs.bullets.push({
          x: cx + 45, y: py, w: BULLET_SIZE, h: BULLET_SIZE,
          vx: bspd * 0.3, vy: -bspd, owner: "player",
        });
        gs.bullets.push({
          x: cx - 55, y: py, w: BULLET_SIZE, h: BULLET_SIZE,
          vx: -bspd * 0.3, vy: -bspd, owner: "player",
        });
      }
      player.shootTimer = 0;
    }

    // -- player bomb --
    player.bombTimer++;
    if (
      keys["KeyX"] &&
      player.bombTimer >= PLAYER_BOMB_COOLDOWN &&
      player.stats[StatIndex.Bombs] > 0
    ) {
      const cx = player.x + player.w / 2;
      const bspd = PLAYER_BULLET_SPEED * sm;
      for (let i = 0; i < 36; i++) {
        const angle = (i * 10 * Math.PI) / 180;
        gs.bullets.push({
          x: cx - BULLET_SIZE / 2, y: player.y, w: BULLET_SIZE, h: BULLET_SIZE,
          vx: bspd * Math.cos(angle), vy: bspd * Math.sin(angle), owner: "player",
        });
      }
      player.stats[StatIndex.Bombs]--;
      player.bombTimer = 0;
    }

    // -- cap stats --
    for (let i = 0; i < 4; i++) {
      if (player.stats[i] > STAT_CAP) player.stats[i] = STAT_CAP;
    }

    // -- enemies --
    for (let i = gs.enemies.length - 1; i >= 0; i--) {
      const e = gs.enemies[i];

      // scroll down
      if (!e.active) {
        e.y += 1 * sm;
      } else {
        e.y += e.speed * sm;
      }

      // activate when on-screen
      if (!e.active && e.y > 0 && e.y < H) {
        e.active = true;
      }

      // remove if scrolled past bottom
      if (e.y > H + 100) {
        gs.enemies.splice(i, 1);
        continue;
      }

      // enemy dead
      if (e.health <= 0) {
        gs.score += SCORE_PER_KILL;
        maybeDropPowerUp(gs, e);
        gs.enemies.splice(i, 1);
        continue;
      }

      // enemy shoot
      if (e.active) {
        e.shootTimer++;
        if (e.shootTimer >= e.shootCooldown) {
          const ecx = e.x + e.w / 2;
          const ecy = e.y + e.h / 2;
          const pcx = player.x + player.w / 2;
          const pcy = player.y + player.h / 2;
          const v = vectorize(ecx, ecy, pcx, pcy, ENEMY_BULLET_SPEED * sm);
          gs.bullets.push({
            x: ecx - BULLET_SIZE / 2, y: ecy, w: BULLET_SIZE, h: BULLET_SIZE,
            vx: v.vx, vy: v.vy, owner: "enemy",
          });
          e.shootTimer = 0;
        }
      }
    }

    // -- enemy-player body collision --
    if (player.invincibleTimer <= 0) {
      for (const e of gs.enemies) {
        if (e.health > 0 && e.active && rectsIntersect(
          player.x, player.y, player.w, player.h,
          e.x, e.y, e.w, e.h,
        )) {
          player.stats[StatIndex.Health]--;
          player.hitFlashTimer = HIT_FLASH_TICKS;
          e.health--;
          break;
        }
      }
    }

    // -- bullets --
    for (let i = gs.bullets.length - 1; i >= 0; i--) {
      const b = gs.bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      // out of bounds
      if (b.x < PLAY_AREA_LEFT - 20 || b.x > PLAY_AREA_RIGHT + 20 || b.y < -20 || b.y > H + 20) {
        gs.bullets.splice(i, 1);
        continue;
      }

      if (b.owner === "player") {
        // hit enemy
        let hit = false;
        for (const e of gs.enemies) {
          if (e.health > 0 && rectsIntersect(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) {
            e.health--;
            hit = true;
            break;
          }
        }
        if (hit) {
          gs.bullets.splice(i, 1);
          continue;
        }
      } else {
        // hit player
        if (
          player.invincibleTimer <= 0 &&
          rectsIntersect(b.x, b.y, b.w, b.h, player.x, player.y, player.w, player.h)
        ) {
          player.stats[StatIndex.Health]--;
          player.hitFlashTimer = HIT_FLASH_TICKS;
          gs.bullets.splice(i, 1);
          continue;
        }
      }
    }

    // -- power-ups --
    for (let i = gs.powerUps.length - 1; i >= 0; i--) {
      const pu = gs.powerUps[i];
      pu.y += POWERUP_SPEED * sm;

      if (pu.y > H + 20) {
        gs.powerUps.splice(i, 1);
        continue;
      }

      if (rectsIntersect(pu.x, pu.y, pu.w, pu.h, player.x, player.y, player.w, player.h)) {
        applyPowerUp(player, pu.kind);
        gs.powerUps.splice(i, 1);
      }
    }

    // -- hit flash countdown --
    if (player.hitFlashTimer > 0) player.hitFlashTimer--;

    // -- player death --
    if (player.stats[StatIndex.Health] <= 0) {
      gs.lives--;
      if (gs.lives <= 0) {
        gs.phase = Phase.GameOver;
        setFinalScore(gs.score);
        setShowHighScores(true);
        forceRender((n) => n + 1);
        return;
      }
      const newPlayer = makePlayer();
      newPlayer.invincibleTimer = INVINCIBLE_DURATION;
      newPlayer.stats[StatIndex.Invincibility] = 1;
      gs.player = newPlayer;
      gs.score = Math.max(0, gs.score - DEATH_SCORE_PENALTY);
    }

    if (gs.score > gs.bestScore) gs.bestScore = gs.score;

    // -- boss check / stage advance --
    const bossAlive = gs.enemies.some((e) => e.type === "boss");
    if (!bossAlive && gs.enemies.length === 0) {
      advanceStage(gs);
    }

  };

  // ---- power-up helpers ----
  const maybeDropPowerUp = (gs: GameState, enemy: Enemy) => {
    const roll = Math.floor(Math.random() * 10);
    if (roll < 5) {
      const kind = POWERUP_KINDS[roll] as PowerUpKind;
      gs.powerUps.push({
        x: enemy.x + enemy.w / 2 - POWERUP_SIZE / 2,
        y: enemy.y + enemy.h / 2 - POWERUP_SIZE / 2,
        w: POWERUP_SIZE,
        h: POWERUP_SIZE,
        kind,
      });
    }
  };

  const applyPowerUp = (player: Player, kind: PowerUpKind) => {
    const idx = POWERUP_KINDS.indexOf(kind);
    if (idx >= 0) {
      player.stats[idx]++;
      if (idx === StatIndex.Invincibility && player.stats[idx] >= 1) {
        player.stats[idx] = 1;
        player.invincibleTimer = INVINCIBLE_DURATION;
      }
    }
  };

  const advanceStage = (gs: GameState) => {
    gs.stage++;
    gs.enemies = buildStage(gs.stage);
    gs.bullets = [];
  };

  // ---- draw ----
  const draw = (ctx: CanvasRenderingContext2D, gs: GameState) => {
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);

    drawStars(ctx, gs);
    drawEnemies(ctx, gs);
    drawPlayer(ctx, gs);
    drawBullets(ctx, gs);
    drawPowerUps(ctx, gs);

    // hit flash overlay
    if (gs.player.hitFlashTimer > 0) {
      const alpha = 0.3 * (gs.player.hitFlashTimer / HIT_FLASH_TICKS);
      ctx.fillStyle = `rgba(255, 40, 40, ${alpha})`;
      ctx.fillRect(PLAY_AREA_LEFT, 0, PLAY_AREA_RIGHT, H);
    }

    drawHUD(ctx, gs);

    if (gs.phase === Phase.Menu) drawMenu(ctx);
    if (gs.paused) drawPauseOverlay(ctx);
    if (gs.phase === Phase.GameOver) drawGameOver(ctx, gs);
  };

  const drawStars = (ctx: CanvasRenderingContext2D, gs: GameState) => {
    for (const star of gs.stars) {
      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = "#fff";
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, gs: GameState) => {
    const { player } = gs;
    if (gs.phase !== Phase.Play && gs.phase !== Phase.GameOver) return;

    // blink during invincibility (skip every other 8-tick cycle)
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 8) % 2 === 1) return;

    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const invincible = player.invincibleTimer > 0;

    ctx.save();
    if (invincible) {
      ctx.shadowColor = "#e040fb";
      ctx.shadowBlur = 20;
    }

    // ship body
    ctx.fillStyle = invincible ? "#e040fb" : "#4caf50";
    ctx.beginPath();
    ctx.moveTo(cx, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(cx - 5, player.y + player.h * 0.7);
    ctx.lineTo(cx + 5, player.y + player.h * 0.7);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // cockpit
    ctx.fillStyle = "#b9f6ca";
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // engine glow
    ctx.fillStyle = "#ffab40";
    ctx.beginPath();
    ctx.moveTo(cx - 8, player.y + player.h);
    ctx.lineTo(cx, player.y + player.h + 10 + Math.random() * 6);
    ctx.lineTo(cx + 8, player.y + player.h);
    ctx.closePath();
    ctx.fill();
  };

  const drawEnemies = (ctx: CanvasRenderingContext2D, gs: GameState) => {
    for (const e of gs.enemies) {
      if (e.y + e.h < 0 || e.y > H) continue;
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;

      ctx.fillStyle = e.color;

      switch (e.type) {
        case "light": {
          ctx.beginPath();
          ctx.moveTo(cx, e.y + e.h);
          ctx.lineTo(e.x, e.y);
          ctx.lineTo(e.x + e.w, e.y);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case "medium": {
          ctx.beginPath();
          ctx.moveTo(cx, e.y);
          ctx.lineTo(e.x + e.w, cy);
          ctx.lineTo(cx, e.y + e.h);
          ctx.lineTo(e.x, cy);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case "heavy": {
          const r = e.w / 2;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          break;
        }
        case "boss": {
          // main body
          ctx.beginPath();
          ctx.arc(cx, cy, e.w / 2.2, 0, Math.PI * 2);
          ctx.fill();

          // inner ring
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, e.w / 3, 0, Math.PI * 2);
          ctx.stroke();

          // HP bar
          ctx.fillStyle = "#333";
          ctx.fillRect(e.x, e.y - 12, e.w, 8);
          const hpFrac = Math.max(0, e.health / e.maxHealth);
          ctx.fillStyle = hpFrac > 0.5 ? "#4caf50" : hpFrac > 0.25 ? "#ff9800" : "#f44336";
          ctx.fillRect(e.x, e.y - 12, e.w * hpFrac, 8);
          break;
        }
      }
    }
  };

  const drawBullets = (ctx: CanvasRenderingContext2D, gs: GameState) => {
    for (const b of gs.bullets) {
      ctx.fillStyle = b.owner === "player" ? "#42a5f5" : "#ef5350";
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawPowerUps = (ctx: CanvasRenderingContext2D, gs: GameState) => {
    const pulse = 0.6 + 0.4 * Math.sin(gs.tickCount * 0.1);
    for (const pu of gs.powerUps) {
      const puCx = pu.x + pu.w / 2;
      const puCy = pu.y + pu.h / 2;

      // pulsing glow
      ctx.save();
      ctx.shadowColor = POWERUP_COLORS[pu.kind];
      ctx.shadowBlur = 12 * pulse;

      ctx.fillStyle = POWERUP_COLORS[pu.kind];
      ctx.beginPath();
      ctx.arc(puCx, puCy, pu.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(puCx, puCy, pu.w / 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px 'Syne', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pu.kind.toUpperCase(), puCx, pu.y - 6);
    }
  };

  const drawHUD = (ctx: CanvasRenderingContext2D, gs: GameState) => {
    const { player } = gs;

    // sidebar background
    ctx.fillStyle = "#111122";
    ctx.fillRect(PLAY_AREA_RIGHT, 0, W - PLAY_AREA_RIGHT, H);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PLAY_AREA_RIGHT, 0);
    ctx.lineTo(PLAY_AREA_RIGHT, H);
    ctx.stroke();

    const sx = HUD_LEFT;
    const barW = W - HUD_LEFT - 24;
    const barH = 28;

    ctx.fillStyle = "#eee";
    ctx.font = "bold 20px 'Syne', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE`, sx, 32);
    ctx.fillStyle = "#42a5f5";
    ctx.fillText(`${gs.score}`, sx, 58);

    ctx.fillStyle = "#eee";
    ctx.fillText(`STAGE ${gs.stage + 1}`, sx, 92);

    // lives
    ctx.fillStyle = "#ccc";
    ctx.font = "14px 'Syne', sans-serif";
    ctx.fillText("LIVES", sx, 115);
    ctx.fillStyle = "#4caf50";
    ctx.font = "bold 20px 'Syne', sans-serif";
    for (let i = 0; i < gs.lives; i++) {
      const lx = sx + i * 28;
      const ly = 124;
      ctx.beginPath();
      ctx.moveTo(lx + 10, ly);
      ctx.lineTo(lx, ly + 18);
      ctx.lineTo(lx + 20, ly + 18);
      ctx.closePath();
      ctx.fill();
    }

    // enemies remaining
    ctx.fillStyle = "#888";
    ctx.font = "14px 'Syne', sans-serif";
    ctx.fillText(`ENEMIES: ${gs.enemies.length}`, sx, 160);

    const bars: { label: string; value: number; color: string; y: number }[] = [
      { label: "HEALTH", value: player.stats[StatIndex.Health], color: "#4caf50", y: 185 },
      { label: "POWER", value: player.stats[StatIndex.Power], color: "#ff5722", y: 255 },
      { label: "SPEED", value: player.stats[StatIndex.SpeedBoost], color: "#2196f3", y: 325 },
      { label: "BOMBS", value: player.stats[StatIndex.Bombs], color: "#ff9800", y: 395 },
    ];

    for (const bar of bars) {
      ctx.fillStyle = "#ccc";
      ctx.font = "14px 'Syne', sans-serif";
      ctx.fillText(bar.label, sx, bar.y);

      ctx.fillStyle = "#222";
      ctx.fillRect(sx, bar.y + 6, barW, barH);

      const fill = Math.min(bar.value / STAT_CAP, 1);
      ctx.fillStyle = bar.color;
      ctx.fillRect(sx, bar.y + 6, barW * fill, barH);

      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, bar.y + 6, barW, barH);
    }

    // invincibility indicator
    if (player.invincibleTimer > 0) {
      ctx.fillStyle = "#e040fb";
      ctx.font = "bold 14px 'Syne', sans-serif";
      ctx.fillText("INVINCIBLE", sx, 500);
      const frac = player.invincibleTimer / INVINCIBLE_DURATION;
      ctx.fillStyle = "#222";
      ctx.fillRect(sx, 508, barW, 12);
      ctx.fillStyle = "#e040fb";
      ctx.fillRect(sx, 508, barW * frac, 12);
    }

    // best score
    ctx.fillStyle = "#888";
    ctx.font = "14px 'Syne', sans-serif";
    ctx.fillText(`BEST: ${gs.bestScore}`, sx, H - 30);
  };

  const drawMenu = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, PLAY_AREA_RIGHT, H);

    const cx = PLAY_AREA_RIGHT / 2;

    ctx.fillStyle = "#42a5f5";
    ctx.font = "bold 64px 'Syne', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("STARFLUX", cx, H / 2 - 60);

    ctx.fillStyle = "#ccc";
    ctx.font = "24px 'Syne', sans-serif";
    ctx.fillText("A vertical-scrolling space shooter", cx, H / 2 - 15);

    const touch = isTouchRef.current;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px 'Syne', sans-serif";
    ctx.fillText(touch ? "Tap to start" : "Press Z or SPACE to start", cx, H / 2 + 50);

    ctx.fillStyle = "#888";
    ctx.font = "16px 'Syne', sans-serif";
    if (!touch) {
      ctx.fillText("Arrow keys to move  |  Z to shoot  |  X for bomb  |  Shift for focus", cx, H / 2 + 100);
    } else {
      ctx.fillText("Drag to move  |  Auto-shoots while moving", cx, H / 2 + 100);
    }
  };

  const drawPauseOverlay = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, PLAY_AREA_RIGHT, H);

    const cx = PLAY_AREA_RIGHT / 2;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 56px 'Syne', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", cx, H / 2 - 10);

    const touch = isTouchRef.current;
    ctx.font = "22px 'Syne', sans-serif";
    ctx.fillStyle = "#bbb";
    ctx.fillText(touch ? "Tap Resume to continue" : "Press ESC or P to resume", cx, H / 2 + 35);
  };

  const drawGameOver = (ctx: CanvasRenderingContext2D, _gs: GameState) => {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, PLAY_AREA_RIGHT, H);
  };

  // ---- callbacks ----
  const restartGame = useCallback(() => {
    const best = getBestScore("starflux");
    const spd = gsRef.current.speedMultiplier;
    gsRef.current = initState(best, spd);
    gsRef.current.phase = Phase.Play;
    setShowHighScores(false);
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;
    forceRender((n) => n + 1);
  }, []);

  const setSpeed = useCallback((value: number) => {
    gsRef.current.speedMultiplier = value;
    setActiveSpeed(value);
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
            gameId="starflux"
            score={finalScore}
            onDismiss={restartGame}
          />
        )}
      </div>
      {isTouch ? (
        <p style={styles.hint}>
          Drag to move &amp; auto-shoot&ensp;|&ensp;Tap to start/restart
        </p>
      ) : (
        <p style={styles.hint}>
          <kbd>&larr;</kbd> <kbd>&uarr;</kbd> <kbd>&darr;</kbd> <kbd>&rarr;</kbd> move
          &ensp;|&ensp;<kbd>Z</kbd> shoot&ensp;|&ensp;<kbd>X</kbd> bomb
          &ensp;|&ensp;<kbd>Shift</kbd> focus&ensp;|&ensp;<kbd>Esc</kbd> pause
        </p>
      )}
      <div style={styles.speedRow}>
        {isTouch && (
          <button
            type="button"
            onClick={togglePause}
            style={{ ...styles.speedBtn, marginRight: "0.5rem" }}
          >
            {gsRef.current.paused ? "Resume" : "Pause"}
          </button>
        )}
        <span style={styles.speedLabel}>Speed:</span>
        {SPEED_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSpeed(opt.value)}
            style={{
              ...styles.speedBtn,
              ...(activeSpeed === opt.value ? styles.speedBtnActive : {}),
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
  speedRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  speedLabel: {
    color: "#888",
    fontSize: "0.9rem",
    fontFamily: "'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif",
  },
  speedBtn: {
    padding: "0.35rem 1rem",
    fontSize: "0.85rem",
    border: "1px solid #e5e5e5",
    borderRadius: 4,
    backgroundColor: "#fff",
    color: "#555",
    cursor: "pointer",
    fontFamily: "'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif",
    transition: "all 0.15s ease-out",
  },
  speedBtnActive: {
    borderColor: "#4a9ae1",
    backgroundColor: "#4a9ae1",
    color: "#fff",
  },
};
