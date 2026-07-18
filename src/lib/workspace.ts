import { cache } from 'react'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { assertProjectOwner } from '@/lib/security'

/**
 * getWorkspaceProject — the authz spine of `/dashboard/[token]/*`.
 *
 * 🚨 SECURITY-CRITICAL. Every re-homed workspace surface (overview, analytics,
 * leads, blog, testimonials) depends on this. Read before changing anything.
 *
 * ## Why a wrapper exists at all
 *
 * `assertProjectOwner` (`src/lib/security.ts:57-124`) is API-shaped: it RETURNS
 * (never throws) and its `{ok:true}` does NOT mean "this user owns this project".
 * Its allow-ladder deliberately includes branches that WIDEN access:
 *
 *   - `security.ts:63-65` demo token `lessgodemomockdata` → `{ok:true, project:null,
 *     userRecord:null}` for ANYONE.
 *   - `security.ts:98-110` orphan (`project.userId == null`) → `{ok:true}` for ANY
 *     authenticated user.
 *   - `security.ts:113-121` non-owner admin → `{ok:true, adminOverride:true}` + audit log.
 *
 * Today's slug-keyed routes hard-scope their query (`publishedPage.findFirst({slug,
 * userId})`), so an orphan project's analytics/leads are unreachable by a stranger.
 * A naive `{ok:false} → notFound()` mapping would therefore WIDEN the existing gap:
 * any signed-in user could open `/dashboard/<orphan-token>/leads`. Hence the ladder
 * below (B3 + D2).
 *
 * ## The rejection ladder (do not reorder, do not merge branches)
 *
 *   1. `{ok:false}`                       → notFound()   (Clerk middleware owns authn)
 *   2. `isDemo` OR `project == null`      → notFound()   (B3)
 *   3. `project.userId == null` (orphan)  → notFound()   — **OUTSIDE the adminOverride
 *      short-circuit** (D2): an orphan has no owner to god-view *as*, and rejecting it
 *      for admins too is what keeps `clerkId` non-null BY CONSTRUCTION below
 *      (`Project.userId String?`, schema `:22`).
 *   4. else require `adminOverride || project.userId === userRecord.id` → notFound()
 *
 * `claimIfOrphan` is NEVER passed — a page render must not mutate ownership.
 *
 * ## THREE ID SPACES (C2) — a wrong-space pass is tsc-green and silently returns ZERO rows
 *
 *   - `Project.userId`     = internal `User.id`
 *   - `PublishedPage.userId` = **Clerk id**
 *   - `Testimonial.userId`   = **Clerk id**
 *
 * Never join across them. In the token spine, scope by `project.id` /
 * `publishedPage.id`; for Clerk-keyed reads use the returned `clerkId`.
 *
 * 🚨 `clerkId` is the **OWNER's** Clerk id (resolved via the `Project → User` relation,
 * `prisma/schema.prisma:23` + `:12` `User.clerkId`) — NOT the requesting admin's. The
 * admin's own clerkId is used only for the `isAdmin` check + the audit log inside
 * `assertProjectOwner`. Returning the admin's id would make owner-scoped Clerk reads
 * (testimonials) yield zero rows on god-view: silently blank, never an error.
 *
 * ⚠️ NOT an auth boundary by placement. A `[token]/layout.tsx` call does NOT guard
 * nested pages — Next.js does not re-run layouts as a guard on every nested render.
 * **Every page calls this itself and owner-scopes its own query.**
 *
 * ⚠️ Behavior change (intended, per spec): routing analytics/forms/blog through this
 * ADDS admin god-view where the slug routes silently 404'd admins.
 *
 * `src/lib/security.ts` is NOT edited — this is a page-shaped wrapper only.
 */

export interface WorkspaceContext {
  project: {
    id: string
    tokenId: string
    title: string
  }
  /** Null until the project is published. Keyed on `projectId` — never a cross-space userId join. */
  publishedPage: {
    id: string
    slug: string
    title: string | null
  } | null
  /** True when a non-owner admin is god-viewing (audit already logged in security.ts). */
  adminOverride: boolean
  /** The project OWNER's Clerk id — for Clerk-keyed reads only (C2). Non-null by construction. */
  clerkId: string
}

/**
 * React `cache()` dedupes the layout+page double-call within ONE request.
 * ⚠️ Request-scoped only — never replace this with a module-level Map, which would
 * cache one user's project across requests.
 */
export const getWorkspaceProject = cache(
  async (tokenId: string): Promise<WorkspaceContext> => {
    const { userId } = await auth()

    const result = await assertProjectOwner(userId, tokenId, {
      action: 'dashboard_workspace',
      // NO claimIfOrphan — a page render must never take ownership of a project.
    })

    // 1 — API-shaped denial (401/403/404). Clerk middleware already handles unauthenticated.
    if (!result.ok) notFound()

    // 2 + 3 — B3/D2: demo token, missing project, and orphans are rejected FIRST,
    // OUTSIDE the adminOverride short-circuit. Do not "optimise" this into step 4.
    if (result.isDemo || result.project == null || result.project.userId == null) notFound()

    // 4 — owner-or-admin.
    if (!result.adminOverride && result.project.userId !== result.userRecord?.id) notFound()

    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: {
        id: true,
        tokenId: true,
        title: true,
        // C2 — the OWNER's Clerk id, not the caller's.
        user: { select: { clerkId: true } },
      },
    })
    // Non-null by construction after step 3 (userId != null ⇒ the relation resolves),
    // but a race (project deleted between the two reads) must 404, not crash.
    if (!project || !project.user) notFound()

    const publishedPage = await prisma.publishedPage.findFirst({
      where: { projectId: project.id },
      select: { id: true, slug: true, title: true },
    })

    return {
      project: { id: project.id, tokenId: project.tokenId, title: project.title },
      publishedPage,
      adminOverride: result.adminOverride,
      clerkId: project.user.clerkId,
    }
  }
)
