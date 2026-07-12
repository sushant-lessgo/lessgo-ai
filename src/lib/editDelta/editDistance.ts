// Bounded Levenshtein edit distance for the data-capture edit-delta pipeline.
//
// Plain server-consumed module (NO 'use client') — imported by the saveDraft
// delta-capture path. Keeps cost O(n·m) bounded: strings are capped at 2000
// chars for the DP grid; any tail beyond the cap contributes its absolute
// length difference (a cheap lower-bound approximation, since edit-distance
// magnitude only needs to be directionally meaningful for "how much changed").

const MAX_LEN = 2000;

/**
 * Levenshtein distance between two strings.
 * - Identical strings → 0.
 * - If either input exceeds 2000 chars, the DP runs on the first 2000 chars of
 *   each and `abs(lenA - lenB)` is added for the untracked tail.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;

  const lenA = a.length;
  const lenB = b.length;

  // Bound the DP grid; approximate the tail beyond the cap.
  const capA = lenA > MAX_LEN ? a.slice(0, MAX_LEN) : a;
  const capB = lenB > MAX_LEN ? b.slice(0, MAX_LEN) : b;
  const tail = lenA > MAX_LEN || lenB > MAX_LEN ? Math.abs(lenA - lenB) : 0;

  const n = capA.length;
  const m = capB.length;
  if (n === 0) return m + tail;
  if (m === 0) return n + tail;

  // Two-row DP (O(min) space).
  let prev = new Array<number>(m + 1);
  let curr = new Array<number>(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    const ca = capA.charCodeAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const cost = ca === capB.charCodeAt(j - 1) ? 0 : 1;
      const del = prev[j] + 1;
      const ins = curr[j - 1] + 1;
      const sub = prev[j - 1] + cost;
      curr[j] = del < ins ? (del < sub ? del : sub) : ins < sub ? ins : sub;
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[m] + tail;
}
