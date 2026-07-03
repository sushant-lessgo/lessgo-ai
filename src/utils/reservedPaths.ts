// Blog (Phase 1): /blog and /blog/* are reserved — routes/blobs there are owned
// by the per-post blog publish pipeline (src/lib/blog/publishBlogPost.ts). Plain
// module: consumed by BOTH the edit store (client guard) and the publish path
// (authoritative server guard in renderPublishedExport).
export function isReservedBlogPath(pathSlug: string): boolean {
  const p = (pathSlug.startsWith('/') ? pathSlug : `/${pathSlug}`).toLowerCase();
  return p === '/blog' || p.startsWith('/blog/');
}
