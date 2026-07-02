// Plain (non-'use client') helper so BOTH the edit block and the published
// renderer can import it. A function exported from a 'use client' module becomes
// a non-callable client reference when imported into the server/published render
// path (caused a "F is not a function" 500 at publish + SSR). Keep server-shared
// pure helpers out of 'use client' files.
//
// Validate a Google Maps embed input → safe iframe src, or null. Accepts a bare
// "Embed a map" URL OR a full <iframe src="…"> paste (extracts src). Only
// https://*.google.com/.../maps/embed… survives — anything else returns null, so
// the published static HTML never emits an arbitrary/hostile iframe src.
export function mapEmbedSrc(raw?: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/src=["']([^"']+)["']/i);
  const candidate = m ? m[1] : s;
  try {
    const u = new URL(candidate);
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase();
    const okHost = host === 'maps.google.com' || host === 'google.com' || host.endsWith('.google.com');
    if (!okHost) return null;
    if (!u.pathname.toLowerCase().includes('/maps/embed')) return null;
    return u.toString();
  } catch {
    return null;
  }
}
