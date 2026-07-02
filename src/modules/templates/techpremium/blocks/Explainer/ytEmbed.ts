// Plain (non-'use client') helper so BOTH the edit block and the published
// renderer can import it. A function exported from a 'use client' module becomes
// a non-callable client reference when imported into the server/published render
// path (caused a "F is not a function" 500 at publish + SSR). Keep server-shared
// pure helpers out of 'use client' files.

// Normalise a YouTube URL/ID → privacy-friendly embed URL ('' if not a YT link).
export function ytEmbed(url: string): string {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  const id = m ? m[1] : (/^[\w-]{11}$/.test(url.trim()) ? url.trim() : '');
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : '';
}
