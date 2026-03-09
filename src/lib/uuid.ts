/**
 * Génère un UUID v4 compatible avec les contextes non-sécurisés (HTTP).
 * crypto.randomUUID() ne fonctionne qu'en HTTPS ou localhost.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback si contexte non-sécurisé
    }
  }
  // Fallback manuel
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
