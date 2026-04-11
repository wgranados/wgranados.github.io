import { useState, useEffect, useRef, useCallback } from "react";
import {
  type HighScoreEntry,
  getHighScores,
  isHighScore,
  addHighScore,
} from "../lib/highscores";

interface Props {
  gameId: string;
  score: number;
  onDismiss: () => void;
}

const enum View {
  Entry = 0,
  Board = 1,
}

export default function HighScoreOverlay({ gameId, score, onDismiss }: Props) {
  const qualifies = isHighScore(gameId, score);
  const [view, setView] = useState<View>(qualifies ? View.Entry : View.Board);
  const [initials, setInitials] = useState("");
  const [board, setBoard] = useState<HighScoreEntry[]>(() =>
    getHighScores(gameId),
  );
  const [newEntryScore, setNewEntryScore] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === View.Entry) inputRef.current?.focus();
  }, [view]);

  const submit = useCallback(() => {
    const name = initials.trim() || "AAA";
    const updated = addHighScore(gameId, name, score);
    setBoard(updated);
    setNewEntryScore(score);
    setView(View.Board);
  }, [initials, gameId, score]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view === View.Entry && e.key === "Enter") {
        e.preventDefault();
        submit();
      }
      if (view === View.Board && (e.key === "Enter" || e.code === "Space")) {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, submit, onDismiss]);

  return (
    <div style={s.backdrop} onClick={view === View.Board ? onDismiss : undefined}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {view === View.Entry ? (
          <>
            <h2 style={s.flashTitle}>NEW HIGH SCORE!</h2>
            <p style={s.scoreText}>{score.toLocaleString()}</p>
            <label style={s.label}>Enter your initials</label>
            <input
              ref={inputRef}
              type="text"
              maxLength={3}
              value={initials}
              onChange={(e) =>
                setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
              }
              placeholder="AAA"
              style={s.input}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" onClick={submit} style={s.submitBtn}>
              Submit
            </button>
          </>
        ) : (
          <>
            <h2 style={s.title}>HIGH SCORES</h2>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={{ ...s.th, textAlign: "left" }}>Name</th>
                  <th style={{ ...s.th, textAlign: "right" }}>Score</th>
                  <th style={{ ...s.th, textAlign: "right" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {board.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={s.empty}>
                      No scores yet
                    </td>
                  </tr>
                ) : (
                  board.map((entry, i) => {
                    const isNew =
                      newEntryScore !== null &&
                      entry.score === newEntryScore &&
                      !board
                        .slice(0, i)
                        .some((prev) => prev.score === newEntryScore);
                    return (
                      <tr key={i} style={isNew ? s.highlightRow : undefined}>
                        <td style={s.rankCell}>{i + 1}</td>
                        <td style={s.nameCell}>{entry.name}</td>
                        <td style={s.scoreCell}>
                          {entry.score.toLocaleString()}
                        </td>
                        <td style={s.dateCell}>{entry.date}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <button type="button" onClick={onDismiss} style={s.playAgainBtn}>
              Play Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const CYAN = "#48dbfb";
const FONT = "'Syne', sans-serif";
const MONO = "'Courier New', Courier, monospace";

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modal: {
    background: "linear-gradient(180deg, #111122 0%, #0a0a1a 100%)",
    border: `1px solid ${CYAN}`,
    boxShadow: `0 0 30px rgba(72, 219, 251, 0.25), inset 0 0 60px rgba(72, 219, 251, 0.05)`,
    borderRadius: 12,
    padding: "2rem 2.5rem",
    minWidth: 340,
    maxWidth: 420,
    textAlign: "center" as const,
    fontFamily: FONT,
  },
  flashTitle: {
    color: CYAN,
    fontSize: "1.6rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    margin: "0 0 0.5rem",
    textShadow: `0 0 12px rgba(72, 219, 251, 0.6)`,
    animation: "hsFlicker 1.5s ease-in-out infinite",
  },
  title: {
    color: CYAN,
    fontSize: "1.4rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    margin: "0 0 1rem",
    textShadow: `0 0 12px rgba(72, 219, 251, 0.6)`,
  },
  scoreText: {
    color: "#fff",
    fontSize: "2.2rem",
    fontWeight: 700,
    fontFamily: MONO,
    margin: "0.5rem 0 1.2rem",
  },
  label: {
    display: "block",
    color: "rgba(255,255,255,0.5)",
    fontSize: "0.85rem",
    marginBottom: "0.5rem",
  },
  input: {
    display: "block",
    width: "5ch",
    margin: "0 auto 1.2rem",
    padding: "0.5rem 0.75rem",
    fontSize: "1.8rem",
    fontFamily: MONO,
    fontWeight: 700,
    textAlign: "center" as const,
    letterSpacing: "0.3em",
    color: "#fff",
    background: "rgba(255,255,255,0.06)",
    border: `2px solid rgba(72, 219, 251, 0.4)`,
    borderRadius: 8,
    outline: "none",
    caretColor: CYAN,
  },
  submitBtn: {
    padding: "0.6rem 2rem",
    fontSize: "1rem",
    fontFamily: FONT,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#0a0a1a",
    background: CYAN,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: "1.2rem",
  },
  th: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    padding: "0 0 0.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    textAlign: "center" as const,
  },
  empty: {
    color: "rgba(255,255,255,0.3)",
    padding: "1.5rem 0",
    fontSize: "0.9rem",
  },
  rankCell: {
    color: "rgba(255,255,255,0.35)",
    fontFamily: MONO,
    fontSize: "0.85rem",
    padding: "0.4rem 0.5rem",
    textAlign: "center" as const,
  },
  nameCell: {
    color: "#fff",
    fontFamily: MONO,
    fontWeight: 700,
    fontSize: "0.95rem",
    letterSpacing: "0.15em",
    padding: "0.4rem 0.5rem",
    textAlign: "left" as const,
  },
  scoreCell: {
    color: "#ccc",
    fontFamily: MONO,
    fontSize: "0.9rem",
    padding: "0.4rem 0.5rem",
    textAlign: "right" as const,
  },
  dateCell: {
    color: "rgba(255,255,255,0.3)",
    fontFamily: MONO,
    fontSize: "0.75rem",
    padding: "0.4rem 0.5rem",
    textAlign: "right" as const,
  },
  highlightRow: {
    background: "rgba(72, 219, 251, 0.12)",
  },
  playAgainBtn: {
    padding: "0.6rem 2rem",
    fontSize: "1rem",
    fontFamily: FONT,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#0a0a1a",
    background: CYAN,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};
