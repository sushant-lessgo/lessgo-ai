/**
 * Teardown: the inverse of the publish pipeline (DD1–DD4).
 *
 * ONE ordered, idempotent sequence shared by Unpublish and Delete. True atomicity
 * across KV + Blob + Postgres is impossible, so this is a FORWARD-ONLY sequence with a
 * **DB-finalize-last invariant**: the DB is only marked `draft` after ALL external state
 * is gone. A crash mid-way leaves `publishState: 'unpublishing'` — detectable, already
 * non-serving (DD0 / `isServingPublishState`), and safe to re-invoke (every step is
 * idempotent, so a retry resumes and completes).
 *
 * Order (KV-first — blobs deleted later are already unreachable; blob-first would leave
 * live routes pointing at deleted blobs):
 *   1. Guard: `customDomain !== null` → `blocked`, ZERO writes (D1).
 *   2. Marker: `publishState: 'unpublishing'` (plain String column, no migration).
 *   3. KV route deletion (DD2) + ISR `revalidatePath` sweep (DD1 3b).
 *      3c. CDN purge — SKIPPED, no supported mechanism exists (see DD1c note below).
 *   4. Blob deletion: every version's blobs (DD3) + blog post/index blobs (DD2b). Strict.
 *      Then null `currentVersionId` BEFORE deleting the version rows.
 *   5. DB finalize (DD4 + blog demote) — `mode: 'unpublish'` only. `mode: 'delete'` stops
 *      after step 4 and returns; the caller runs the DD11 delete transaction.
 *
 * DD1c — CDN cache window (INVESTIGATED, no mechanism found; recorded here so nobody
 * re-litigates it). The public URL (`{slug}.lessgo.site/`) is served by a middleware
 * rewrite to `/api/blob-proxy`, which sets `s-maxage=3600` on Vercel's Edge Network. The
 * CDN cache key is the PUBLIC url, so `revalidatePath('/p/{slug}')` does NOT evict it;
 * re-publish escapes the window by minting a new `&v={version}` key, but unpublish has no
 * new version to mint. Vercel exposes no public/documented per-URL purge REST API (the
 * VERCEL_TOKEN we hold is scoped to the Domains API, `src/lib/vercel/domains.ts`), and
 * `cacheTag`/`revalidateTag` do not govern an edge route handler's own `Cache-Control`
 * response on Next 14. => No purge call. The origin 404s immediately (DD0); the edge can
 * replay a cached copy for ~1h (after `s-maxage`, stale-while-revalidate revalidation hits
 * the missing KV route, 404s, and the cache self-corrects). Phase 5 states this honestly in
 * the confirm dialog + toast. Do NOT lower `s-maxage` — that taxes every published-page
 * view forever for a rare unpublish.
 *
 * NOT used here, deliberately:
 * - `versionCleanup.ts` — untouched (keeps the publish happy path pristine); teardown
 *   enumerates versions itself (DD3).
 * - `unpublishBlogPost()` — it UPLOADS a fresh index blob per non-last post and its deletes
 *   are best-effort `safeDel`. Teardown never uploads anything (DD2b).
 * - `publish/route.ts`'s root-blob-only rollback — known-weak, not a model (DD3).
 */
import 'server-only';
import { del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { deleteRoutes, removeRoutes } from '@/lib/routing/kvRoutes';
import { publishSubdomainHosts } from '@/lib/domains/hosts';

export type TeardownMode = 'unpublish' | 'delete';

/**
 * The step that failed — surfaced to Sentry + the route's 500 body. Labels are TRUTHFUL:
 * `'marker'`/`'db_read'` failures happen BEFORE any external state is touched, so they must
 * not masquerade as `'kv_routes'` (which would send the founder hunting a KV incident).
 */
export type TeardownStep =
  | 'marker'
  | 'db_read'
  | 'kv_routes'
  | 'revalidate'
  | 'blob_delete'
  | 'db_finalize';

export type TeardownResult =
  /** Custom domain attached (any status) — nothing was written. Caller → 409. */
  | { status: 'blocked'; reason: 'custom_domain' }
  /** External cleanup failed; page left `'unpublishing'`. Idempotent — retry. Caller → 500. */
  | { status: 'retryable_failure'; step: TeardownStep; error: string }
  /** Unpublish: fully finalized. Delete: external state gone, caller runs the DB transaction. */
  | { status: 'done'; mode: TeardownMode };

type VersionBlobMeta = { blobs?: Array<{ path?: string; blobKey?: string }> } | null;

/** `/foo/` → `/foo`; `foo` → `/foo`; `''`/`'/'` → `'/'`. */
function normalizePath(raw: string): string {
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  if (p === '/') return p;
  return p.replace(/\/+$/, '') || '/';
}

export async function teardownPublishedPage(
  pageId: string,
  opts: { mode: TeardownMode }
): Promise<TeardownResult> {
  const { mode } = opts;

  const page = await prisma.publishedPage.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      slug: true,
      projectId: true,
      customDomain: true,
      publishState: true,
      blogIndex: true,
    },
  });

  // Already gone — idempotent no-op (a retry after the caller's delete transaction).
  if (!page) return { status: 'done', mode };

  // 1. Guard (D1): pending/failed domains still hold the @unique slot + a Vercel
  //    registration, so key off presence, NOT `customDomainStatus`. Zero writes.
  if (page.customDomain !== null) {
    return { status: 'blocked', reason: 'custom_domain' };
  }

  const { slug } = page;

  // `level` is a knob, not decoration: an incomplete teardown (external state half-gone) is an
  // 'error' the founder must chase; a pre-external failure changed NOTHING and is merely a
  // failed attempt → 'warning'.
  const fail = (
    step: TeardownStep,
    err: unknown,
    level: 'error' | 'warning' = 'error'
  ): TeardownResult => {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[teardown] failed:', { pageId, slug, step, error });
    Sentry.captureMessage('teardown_incomplete', {
      level,
      tags: { area: 'teardown', step },
      extra: { pageId, slug, step, mode, error },
    });
    return { status: 'retryable_failure', step, error };
  };

  // 2. Transient marker. Written BEFORE any external deletion so a crash is detectable
  //    (and already 404s on the SSR path) instead of a lying `'published'`.
  if (page.publishState !== 'unpublishing') {
    try {
      await prisma.publishedPage.update({
        where: { id: pageId },
        data: { publishState: 'unpublishing' },
      });
    } catch (err) {
      // Nothing external touched yet; the page is untouched and still serving. Truthful step
      // ('marker', not 'kv_routes' — no KV call has happened) and warning-level: there is no
      // incomplete teardown to clean up, the attempt simply never started.
      return fail('marker', err, 'warning');
    }
  }

  // --- Enumeration (DD2 / DD2b / DD3) -------------------------------------------------
  // Custom domain is guaranteed absent by the guard → never in the host set.
  const hosts = publishSubdomainHosts(slug);

  let versions: Array<{ id: string; blobKey: string; metadata: unknown }>;
  let blogPosts: Array<{ id: string; slug: string; blobKey: string | null }>;
  try {
    versions = await prisma.publishedPageVersion.findMany({
      where: { publishedPageId: pageId },
      select: { id: true, blobKey: true, metadata: true },
    });
    blogPosts = page.projectId
      ? await prisma.blogPost.findMany({
          where: { projectId: page.projectId, status: 'published' },
          select: { id: true, slug: true, blobKey: true },
        })
      : [];
  } catch (err) {
    // Enumeration read, not a KV call. Stays at 'error' level: the marker IS written by now,
    // so the row is parked at 'unpublishing' (non-serving on SSR) with KV/blobs still alive —
    // a genuinely incomplete teardown needing a retry.
    return fail('db_read', err);
  }

  // Paths: the union across ALL versions — an older version may have written subpage or
  // locale routes the current one no longer has, and those KV keys are still live. A
  // legacy version carrying only `version.blobKey` contributes '/'.
  const paths = new Set<string>(['/']);
  for (const version of versions) {
    const meta = version.metadata as VersionBlobMeta;
    const blobs = Array.isArray(meta?.blobs) ? meta!.blobs! : [];
    if (blobs.length === 0) {
      paths.add('/'); // legacy blobKey-only version → root doc
      continue;
    }
    for (const b of blobs) {
      if (typeof b?.path === 'string' && b.path) paths.add(normalizePath(b.path));
    }
  }
  // Blog keys (DD2b): blog blobs/routes are never registered in a version row, so they are
  // invisible above. Include `/blog` whenever an index exists OR any post is published.
  const blogIndexBlobKey = (page.blogIndex as { blobKey?: string } | null)?.blobKey;
  if (blogPosts.length > 0 || blogIndexBlobKey) paths.add('/blog');
  for (const post of blogPosts) paths.add(normalizePath(`/blog/${post.slug}`));

  // 3. KV route deletion — the switch that stops blob-proxy serving.
  //    `removeRoutes(hosts)` only deletes the ROOT trio (`route:`/`redirect:`/`slug-for:`),
  //    so every non-root (host × path) pair must go through `deleteRoutes` explicitly or it
  //    is left stranded and live.
  try {
    const nonRootKeys = [...paths]
      .filter((p) => p !== '/')
      .flatMap((path) => hosts.map((host) => ({ host, path })));
    await deleteRoutes(nonRootKeys);
    await removeRoutes(hosts);
  } catch (err) {
    return fail('kv_routes', err);
  }

  // 3b. ISR invalidation — `/p/[slug]*` renders are cached for `revalidate = 3600`;
  //     without this the SSR fallback keeps serving the pre-teardown render for up to an
  //     hour even though the row is now non-serving.
  try {
    revalidatePath(`/p/${slug}`);
    revalidatePath(`/p/${slug}/privacy`);
    for (const path of paths) {
      if (path !== '/') revalidatePath(`/p/${slug}${path}`);
    }
  } catch (err) {
    return fail('revalidate', err);
  }

  // 3c. CDN purge: intentionally absent — no supported mechanism (DD1c, see file header).

  // 4. Blob deletion — strict: any failure leaves `'unpublishing'` and is retried.
  //    `del()` on an already-deleted key is a no-op, which is what makes retry safe.
  try {
    for (const version of versions) {
      const meta = version.metadata as VersionBlobMeta;
      const blobKeys = Array.isArray(meta?.blobs)
        ? meta!.blobs!.map((b) => b.blobKey).filter((k): k is string => !!k)
        : [];
      // Legacy fallback: single-page versions recorded only the primary blobKey.
      if (version.blobKey && !blobKeys.includes(version.blobKey)) blobKeys.unshift(version.blobKey);
      for (const key of blobKeys) await del(key);
    }
    // Blog blobs (DD2b) — enumerated directly, never via `unpublishBlogPost` (which would
    // upload a fresh index blob per non-last post).
    for (const post of blogPosts) {
      if (post.blobKey) await del(post.blobKey);
    }
    if (blogIndexBlobKey) await del(blogIndexBlobKey);
  } catch (err) {
    return fail('blob_delete', err);
  }

  // 4b. Drop the version pointer BEFORE deleting the version rows: the "CurrentVersion"
  //     relation declares no explicit `onDelete`, so don't lean on implicit SetNull.
  try {
    await prisma.publishedPage.update({
      where: { id: pageId },
      data: { currentVersionId: null },
    });
    await prisma.publishedPageVersion.deleteMany({ where: { publishedPageId: pageId } });
  } catch (err) {
    return fail('blob_delete', err);
  }

  // Delete mode stops here: external state is gone, the caller owns the DD11 transaction
  // (PublishedPage → Project → Token). Finalizing to 'draft' would be pointless churn.
  if (mode === 'delete') return { status: 'done', mode };

  // 5. DB finalize (DD4) — LAST, so we never sit at `'draft'` with external state alive.
  //    `publishedPage` is written last within this step for the same reason.
  try {
    if (blogPosts.length > 0) {
      // Mirrors `unpublishBlogPost`'s row write. `firstPublishedAt` is kept — the slug
      // stays locked (URL permanence). Consequence: a later site re-publish does NOT
      // auto-restore the blog; posts must be re-published individually.
      await prisma.blogPost.updateMany({
        where: { id: { in: blogPosts.map((p) => p.id) } },
        data: { status: 'draft', publishedVersion: null, blobKey: null, blobUrl: null },
      });
    }
    if (page.projectId) {
      // `updateMany`, NOT `update`: `PublishedPage.projectId` carries no `@relation`/FK by
      // design (DD11), so it can dangle at a deleted Project. `update` would throw P2025 on a
      // dangling id → 'db_finalize' retryable → and since EVERY retry re-runs this same
      // statement, the row would wedge at 'unpublishing' forever. `updateMany` matches zero
      // rows and moves on, so teardown converges.
      await prisma.project.updateMany({
        where: { id: page.projectId },
        data: { status: 'draft' },
      });
    }
    // The PublishedPage ROW is kept: the @unique slug stays reserved so re-publish
    // preserves the URL (DD12). `lastPublishAt` kept as history; `isPublished` NOT
    // written (it has no writer anywhere — DD0b; writing it would be a one-way door).
    await prisma.publishedPage.update({
      where: { id: pageId },
      data: {
        publishState: 'draft',
        publishError: null,
        blogIndex: Prisma.DbNull,
      },
    });
  } catch (err) {
    return fail('db_finalize', err);
  }

  return { status: 'done', mode };
}
