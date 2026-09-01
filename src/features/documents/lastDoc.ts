/** Tiny pointer to the most recently opened document, for auto-resume. */
const LAST_DOC_KEY = 'local-reader:lastDocId';

export function getLastDocId(): string | null {
  try {
    return localStorage.getItem(LAST_DOC_KEY);
  } catch {
    return null;
  }
}

export function setLastDocId(id: string): void {
  try {
    localStorage.setItem(LAST_DOC_KEY, id);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function clearLastDocId(): void {
  try {
    localStorage.removeItem(LAST_DOC_KEY);
  } catch {
    /* ignore */
  }
}
