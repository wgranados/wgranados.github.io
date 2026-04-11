const SESSION_PREFIX = "arcade_session_";

export function saveSession(gameId: string, state: unknown): void {
  try {
    localStorage.setItem(SESSION_PREFIX + gameId, JSON.stringify(state));
  } catch { /* quota or private mode */ }
}

export function loadSession<T>(gameId: string): T | null {
  try {
    const raw = localStorage.getItem(SESSION_PREFIX + gameId);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearSession(gameId: string): void {
  try {
    localStorage.removeItem(SESSION_PREFIX + gameId);
  } catch { /* ignore */ }
}

export function hasSession(gameId: string): boolean {
  try {
    return localStorage.getItem(SESSION_PREFIX + gameId) !== null;
  } catch {
    return false;
  }
}
