import { useRef, useEffect, useCallback, useState } from "react";
import { LEVELS } from "../game/arqanoid/levels";
import { saveSession, loadSession, clearSession } from "../lib/gameSession";
import { getBestScore } from "../lib/highscores";
import { useAutoPause } from "../lib/useAutoPause";
import HighScoreOverlay from "./HighScoreOverlay";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ball {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alive: boolean;
}

const enum Phase {
  Start = 0,
  Play = 1,
  Lose = 2,
}

const enum BallMode {
  Waiting = 0,
  Moving = 1,
}

interface GameState {
  phase: Phase;
  ballMode: BallMode;
  ball: Ball;
  paddle: Paddle;
  bricks: (Brick | null)[][];
  score: number;
  lives: number;
  level: number;
  keys: Record<string, boolean>;
  bestScore: number;
  speedMultiplier: number;
  paused: boolean;
}

// ---------------------------------------------------------------------------
// Constants — match the original Java game
// ---------------------------------------------------------------------------

const W = 1024;
const H = 768;
const PADDLE_W = 150;
const PADDLE_H = 25;
const PADDLE_SPEED = 7;
const BALL_SPEED = 5;
const BALL_SIZE = 14;
const BRICK_W = 56;
const BRICK_H = 20;
const BRICK_GAP_X = 61;
const BRICK_GAP_Y = 30;
const BRICK_TOP = 100;
const ROWS = 8;
const COLS = 16;
const INITIAL_LIVES = 3;
const TICK_MS = 1000 / 60;
const MAX_ACCUMULATOR = TICK_MS * 5;

const COLOR_MAP: Record<string, string> = {
  R: "#e74c3c",
  G: "#2ecc71",
  B: "#3498db",
};

const SPEED_OPTIONS: { label: string; value: number }[] = [
  { label: "Slow", value: 0.6 },
  { label: "Normal", value: 1 },
  { label: "Fast", value: 1.6 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildBricks(levelIndex: number): (Brick | null)[][] {
  const layout = LEVELS[levelIndex % LEVELS.length];
  const grid: (Brick | null)[][] = [];
  for (let row = 0; row < ROWS; row++) {
    const line = layout[row] ?? "";
    const rowArr: (Brick | null)[] = [];
    for (let col = 0; col < COLS; col++) {
      const ch = line[col];
      if (ch && ch in COLOR_MAP) {
        rowArr.push({
          x: col * BRICK_GAP_X,
          y: BRICK_TOP + row * BRICK_GAP_Y,
          w: BRICK_W,
          h: BRICK_H,
          color: COLOR_MAP[ch],
          alive: true,
        });
      } else {
        rowArr.push(null);
      }
    }
    grid.push(rowArr);
  }
  return grid;
}

function rectsIntersect(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function makeBall(speedMultiplier: number): Ball {
  const spd = BALL_SPEED * speedMultiplier;
  return { x: W / 2 - BALL_SIZE / 2, y: 686, w: BALL_SIZE, h: BALL_SIZE, vx: spd, vy: -spd };
}

function makePaddle(): Paddle {
  return { x: W / 2 - PADDLE_W / 2, y: 700, w: PADDLE_W, h: PADDLE_H, vx: 0 };
}

function initState(bestScore = 0, speedMultiplier = 1): GameState {
  return {
    phase: Phase.Start,
    ballMode: BallMode.Waiting,
    ball: makeBall(speedMultiplier),
    paddle: makePaddle(),
    bricks: buildBricks(0),
    score: 0,
    lives: INITIAL_LIVES,
    level: 0,
    keys: {},
    bestScore,
    speedMultiplier,
    paused: false,
  };
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

function loadOrInit(): GameState {
  const saved = loadSession<GameState>("arqanoid");
  if (saved && saved.phase === Phase.Play) {
    saved.keys = {};
    saved.paused = true;
    saved.bestScore = getBestScore("arqanoid");
    clearSession("arqanoid");
    return saved;
  }
  clearSession("arqanoid");
  return initState();
}

export default function ArqanoidGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState>(loadOrInit());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const [_, forceRender] = useState(0);
  const [activeSpeed, setActiveSpeed] = useState(() => gsRef.current.speedMultiplier);
  const [showHighScores, setShowHighScores] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const isTouch = useIsTouch();
  const isTouchRef = useRef(false);
  isTouchRef.current = isTouch;
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    gsRef.current.bestScore = getBestScore("arqanoid");
  }, []);

  const saveState = useCallback(() => {
    const gs = gsRef.current;
    saveSession("arqanoid", { ...gs, keys: {} });
  }, []);

  useAutoPause({ gsRef, playPhase: Phase.Play, forceRender, onPause: saveState });

  // ---- keyboard ----
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const gs = gsRef.current;

      if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "Space") {
        e.preventDefault();
      }

      gs.keys[e.code] = true;

      if ((e.code === "Escape" || e.code === "KeyP") && gs.phase === Phase.Play && gs.ballMode === BallMode.Moving) {
        gs.paused = !gs.paused;
        if (!gs.paused) {
          lastTimeRef.current = 0;
          accumulatorRef.current = 0;
        }
        forceRender((n) => n + 1);
        return;
      }

      if (e.code === "Space") {
        if (gs.phase === Phase.Play && gs.ballMode === BallMode.Waiting) {
          gs.ballMode = BallMode.Moving;
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

    function gameXFromTouch(clientX: number): number {
      const rect = canvas!.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * W;
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartXRef.current = touch.clientX;
      const gs = gsRef.current;
      if (gs.phase === Phase.Play && !gs.paused) {
        const gameX = gameXFromTouch(touch.clientX);
        gs.paddle.x = Math.max(0, Math.min(W - gs.paddle.w, gameX - gs.paddle.w / 2));
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const gs = gsRef.current;
      if (gs.phase === Phase.Play && !gs.paused) {
        const gameX = gameXFromTouch(touch.clientX);
        gs.paddle.x = Math.max(0, Math.min(W - gs.paddle.w, gameX - gs.paddle.w / 2));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const startX = touchStartXRef.current;
      const endTouch = e.changedTouches[0];
      const movedX = startX !== null ? Math.abs(endTouch.clientX - startX) : 0;
      touchStartXRef.current = null;

      if (movedX < 15) {
        const gs = gsRef.current;
        if (gs.phase === Phase.Play && gs.ballMode === BallMode.Waiting) {
          gs.ballMode = BallMode.Moving;
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

  // ---- game loop with fixed timestep ----
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

      if (gs.phase === Phase.Start) {
        gs.phase = Phase.Play;
      }

      while (accumulatorRef.current >= TICK_MS) {
        if (gs.phase === Phase.Play && !gs.paused) {
          update(gs);
        }
        accumulatorRef.current -= TICK_MS;
      }

      draw(ctx, gs);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- update logic ----
  const update = (gs: GameState) => {
    const { ball, paddle, keys } = gs;
    const spd = BALL_SPEED * gs.speedMultiplier;

    if (keys["ArrowLeft"]) paddle.vx = -PADDLE_SPEED;
    else if (keys["ArrowRight"]) paddle.vx = PADDLE_SPEED;
    else paddle.vx = 0;
    if (paddle.vx !== 0) {
      paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x + paddle.vx));
    }

    // ball waiting on paddle
    if (gs.ballMode === BallMode.Waiting) {
      ball.x = paddle.x + paddle.w / 2 - ball.w / 2;
      ball.y = paddle.y - ball.h;
      return;
    }

    // wall bounce
    if (ball.x + ball.vx >= W - ball.w || ball.x + ball.vx < 0) ball.vx *= -1;
    if (ball.y + ball.vy < 0) ball.vy *= -1;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // fell off bottom
    if (ball.y > H) {
      gs.lives--;
      if (gs.lives <= 0) {
        gs.phase = Phase.Lose;
        clearSession("arqanoid");
        setFinalScore(gs.score);
        setShowHighScores(true);
        forceRender((n) => n + 1);
        return;
      }
      resetBall(gs);
      return;
    }

    // paddle collision
    if (rectsIntersect(ball.x, ball.y, ball.w, ball.h, paddle.x, paddle.y, paddle.w, paddle.h)) {
      ball.vy = -Math.abs(ball.vy);
      ball.y = paddle.y - ball.h;
      const hitPos = (ball.x + ball.w / 2 - paddle.x) / paddle.w;
      ball.vx = spd * (hitPos - 0.5) * 2;
      if (Math.abs(ball.vx) < 1) ball.vx = ball.vx < 0 ? -1 : 1;
    }

    // brick collisions — break after first hit to avoid double-flip
    let brickHit = false;
    for (let r = 0; r < ROWS && !brickHit; r++) {
      for (let c = 0; c < COLS && !brickHit; c++) {
        const brick = gs.bricks[r][c];
        if (!brick || !brick.alive) continue;
        if (!rectsIntersect(ball.x, ball.y, ball.w, ball.h, brick.x, brick.y, brick.w, brick.h)) continue;

        brick.alive = false;
        gs.score += 100;
        brickHit = true;

        const overlapLeft = ball.x + ball.w - brick.x;
        const overlapRight = brick.x + brick.w - ball.x;
        const overlapTop = ball.y + ball.h - brick.y;
        const overlapBottom = brick.y + brick.h - ball.y;
        const minX = Math.min(overlapLeft, overlapRight);
        const minY = Math.min(overlapTop, overlapBottom);
        if (minX < minY) ball.vx *= -1;
        else ball.vy *= -1;
      }
    }

    // win check
    if (gs.bricks.every((row) => row.every((b) => !b || !b.alive))) {
      gs.level++;
      gs.bricks = buildBricks(gs.level);
      resetBall(gs);
    }
  };

  // ---- draw ----
  const draw = (ctx: CanvasRenderingContext2D, gs: GameState) => {
    const { ball, paddle, bricks } = gs;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const brick = bricks[r][c];
        if (!brick || !brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
      }
    }

    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.arc(ball.x + ball.w / 2, ball.y + ball.h / 2, ball.w / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#bbb";
    ctx.font = "bold 28px 'Syne', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${gs.score}`, 20, 40);
    ctx.textAlign = "right";
    ctx.fillText(`Lives: ${gs.lives}`, W - 20, 40);
    ctx.textAlign = "center";
    ctx.fillText(`Level ${gs.level + 1}`, W / 2, 40);

    const touch = isTouchRef.current;

    if (gs.phase === Phase.Play && gs.ballMode === BallMode.Waiting) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 36px 'Syne', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(touch ? "Tap to launch" : "Press SPACE to launch", W / 2, H / 2);
      ctx.font = "20px 'Syne', sans-serif";
      ctx.fillText(touch ? "Slide to move paddle" : "\u2190 \u2192 to move paddle", W / 2, H / 2 + 40);
    }

    if (gs.paused) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 56px 'Syne', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", W / 2, H / 2 - 10);
      ctx.font = "22px 'Syne', sans-serif";
      ctx.fillStyle = "#bbb";
      ctx.fillText(touch ? "Tap Resume to continue" : "Press ESC or P to resume", W / 2, H / 2 + 35);
    }

    if (gs.phase === Phase.Lose) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, W, H);
    }
  };

  // ---- helpers ----
  const resetBall = (gs: GameState) => {
    const spd = BALL_SPEED * gs.speedMultiplier;
    gs.ballMode = BallMode.Waiting;
    gs.ball.vx = spd;
    gs.ball.vy = -spd;
  };

  const restartGame = useCallback(() => {
    clearSession("arqanoid");
    const best = getBestScore("arqanoid");
    const spd = gsRef.current.speedMultiplier;
    gsRef.current = initState(best, spd);
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
    if (gs.phase === Phase.Play && gs.ballMode === BallMode.Moving) {
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
            gameId="arqanoid"
            score={finalScore}
            onDismiss={restartGame}
          />
        )}
      </div>
      {isTouch ? (
        <p style={styles.hint}>
          Slide to move&ensp;|&ensp;Tap to launch
        </p>
      ) : (
        <p style={styles.hint}>
          Use <kbd>←</kbd> <kbd>→</kbd> to move&ensp;|&ensp;<kbd>Space</kbd> to launch&ensp;|&ensp;<kbd>Esc</kbd> to pause
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
