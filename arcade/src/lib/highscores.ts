export interface HighScoreEntry {
  name: string;
  score: number;
  date: string;
}

const MAX_ENTRIES = 10;
const KEY_PREFIX = "arcade_hs_";

function storageKey(gameId: string): string {
  return `${KEY_PREFIX}${gameId}`;
}

export function getHighScores(gameId: string): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(gameId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e: unknown): e is HighScoreEntry =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as HighScoreEntry).name === "string" &&
          typeof (e as HighScoreEntry).score === "number" &&
          typeof (e as HighScoreEntry).date === "string",
      )
      .sort((a: HighScoreEntry, b: HighScoreEntry) => b.score - a.score)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function isHighScore(gameId: string, score: number): boolean {
  if (score <= 0) return false;
  const list = getHighScores(gameId);
  if (list.length < MAX_ENTRIES) return true;
  return score > list[list.length - 1].score;
}

export function addHighScore(
  gameId: string,
  name: string,
  score: number,
): HighScoreEntry[] {
  const list = getHighScores(gameId);
  const entry: HighScoreEntry = {
    name: name.toUpperCase().slice(0, 3).padEnd(3, " "),
    score,
    date: new Date().toISOString().slice(0, 10),
  };
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(storageKey(gameId), JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
  return trimmed;
}

export function getBestScore(gameId: string): number {
  const list = getHighScores(gameId);
  return list.length > 0 ? list[0].score : 0;
}
