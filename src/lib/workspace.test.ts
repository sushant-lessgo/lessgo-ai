// dashboard-workspace-ia phase 3 — SECURITY REGRESSION GUARDS for getWorkspaceProject.
//
// These tests are the only automated proof of the B3/D2 hardening: e2e cannot seed an
// orphan project, and a wrong-space clerkId returns zero rows silently (tsc-green).
// If one of these ever needs "adjusting", stop and re-read src/lib/workspace.ts first.
//
// `assertProjectOwner` is mocked (its own ladder is not under test here) — what IS under
// test is that the wrapper does NOT trust `{ok:true}` on its own.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// react's `cache` does not exist at runtime in React 18.3.1 (Next aliases `react` to its
// bundled canary on the server, where it does). Identity mock = no memoisation, so each
// test's call really re-runs the ladder.
vi.mock('react', () => ({ cache: <T,>(fn: T) => fn }));

class NotFoundError extends Error {
  constructor() {
    super('NEXT_NOT_FOUND');
  }
}
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new NotFoundError();
  },
}));

let currentUserId: string | null = 'clerk_owner';
vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: currentUserId }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: vi.fn() },
    publishedPage: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/security', () => ({
  assertProjectOwner: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { assertProjectOwner } from '@/lib/security';
import { getWorkspaceProject } from './workspace';

const db = prisma as any;
const gate = assertProjectOwner as any;

const OWNER_USER_ID = 'user_internal_owner'; // internal User.id space
const OWNER_CLERK_ID = 'clerk_owner'; // Clerk id space
const TOKEN = 'tok_workspace';

/** The row `prisma.project.findUnique` returns after the gate passes. */
function seedProjectRow(clerkId: string | null = OWNER_CLERK_ID) {
  db.project.findUnique.mockResolvedValue({
    id: 'proj_1',
    tokenId: TOKEN,
    title: 'Peak Fitness Studio',
    user: clerkId ? { clerkId } : null,
  });
  db.publishedPage.findFirst.mockResolvedValue({
    id: 'pp_1',
    slug: 'peakfit',
    title: 'Peak Fitness',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  currentUserId = OWNER_CLERK_ID;
});

describe('getWorkspaceProject — rejection ladder', () => {
  it('rejects a denied gate result ({ok:false}, 403 non-owner) with notFound', async () => {
    gate.mockResolvedValue({ ok: false, status: 403, error: 'Access denied' });
    await expect(getWorkspaceProject(TOKEN)).rejects.toThrow(NotFoundError);
    expect(db.project.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a missing project ({ok:false}, 404) with notFound', async () => {
    gate.mockResolvedValue({ ok: false, status: 404, error: 'Project not found' });
    await expect(getWorkspaceProject(TOKEN)).rejects.toThrow(NotFoundError);
  });

  // B3 — security.ts:63-65 hands ANY caller {ok:true, project:null} for the demo token.
  it('rejects the demo token even though the gate returns ok:true (B3)', async () => {
    gate.mockResolvedValue({
      ok: true,
      isDemo: true,
      adminOverride: false,
      userRecord: null,
      project: null,
    });
    await expect(getWorkspaceProject('lessgodemomockdata')).rejects.toThrow(NotFoundError);
    expect(db.project.findUnique).not.toHaveBeenCalled();
  });

  // Exercises the `result.isDemo ||` sub-clause of rung 2 IN ISOLATION. The test above
  // cannot: its fixture sets isDemo AND project:null, so the `project == null` clause
  // alone rejects it and a mutation dropping `result.isDemo ||` would go undetected.
  // Here the project is non-null AND owned by the caller, so rung 4 would happily pass
  // — only the isDemo clause can reject.
  //
  // NOTE: security.ts:63-65 always pairs isDemo with project:null today, so this guards
  // the WRAPPER'S CONTRACT against a future security.ts change, not a live hole.
  it('rejects isDemo even when the gate also returns a real, owned project (rung 2)', async () => {
    gate.mockResolvedValue({
      ok: true,
      isDemo: true,
      adminOverride: false,
      userRecord: { id: OWNER_USER_ID },
      project: { userId: OWNER_USER_ID },
    });
    seedProjectRow();

    await expect(getWorkspaceProject('lessgodemomockdata')).rejects.toThrow(NotFoundError);
    expect(db.project.findUnique).not.toHaveBeenCalled();
  });

  // B3 — security.ts:98-110 hands ANY authenticated user {ok:true} for an orphan.
  //
  // ⚠️ NOT a mutation-proof guard for rung 3 on its own: with rung 3 deleted, rung 4
  // still rejects this case incidentally (null !== 'user_internal_stranger'). It
  // documents the B3 hole from a stranger's point of view; the ADMIN test below is the
  // one that actually pins rung 3.
  it('rejects an orphan project (userId:null) even though the gate returns ok:true (B3)', async () => {
    gate.mockResolvedValue({
      ok: true,
      isDemo: false,
      adminOverride: false,
      userRecord: { id: 'user_internal_stranger' },
      project: { userId: null },
    });
    await expect(getWorkspaceProject(TOKEN)).rejects.toThrow(NotFoundError);
    expect(db.project.findUnique).not.toHaveBeenCalled();
  });

  // 🚨 D2 — THE SOLE GUARD for rung 3 (`if (result.project.userId == null) notFound()`).
  // DO NOT WEAKEN OR DELETE. Orphan rejection sits OUTSIDE the adminOverride
  // short-circuit: an orphan has no owner to god-view *as*, and rejecting it for admins
  // too is what keeps the returned clerkId non-null BY CONSTRUCTION.
  //
  // This is the discriminating case — rung 4 cannot catch it (`adminOverride`
  // short-circuits it), so deleting rung 3 lets an admin through to the display reads.
  //
  // ⚠️ `rejects.toThrow` ALONE would pass vacuously here: with rung 3 deleted, execution
  // reaches the seeded orphan row (`user: null`) and the race-guard throws the SAME
  // NotFoundError — the right outcome for entirely the wrong reason (an orphan read that
  // rung 3 is supposed to prevent). The `not.toHaveBeenCalled()` assertion below is
  // therefore LOAD-BEARING: it is the only thing that fails if rung 3 is removed.
  it('rejects an orphan project for an ADMIN too, before any display read (D2)', async () => {
    gate.mockResolvedValue({
      ok: true,
      isDemo: false,
      adminOverride: true,
      userRecord: { id: 'user_internal_admin' },
      project: { userId: null },
    });
    // Seed the row an orphan would really return, so a rung-3 deletion takes the
    // realistic path rather than crashing on an unseeded mock.
    db.project.findUnique.mockResolvedValue({
      id: 'proj_orphan',
      tokenId: TOKEN,
      title: 'Orphaned project',
      user: null,
    });

    await expect(getWorkspaceProject(TOKEN)).rejects.toThrow(NotFoundError);
    // LOAD-BEARING (see above) — rung 3 must reject BEFORE any project read.
    expect(
      db.project.findUnique,
      'rung 3 (orphan) must reject before any display read — an admin reached the DB'
    ).not.toHaveBeenCalled();
    expect(db.publishedPage.findFirst).not.toHaveBeenCalled();
  });

  it('rejects when the gate says ok but the project belongs to someone else and no admin override', async () => {
    gate.mockResolvedValue({
      ok: true,
      isDemo: false,
      adminOverride: false,
      userRecord: { id: 'user_internal_stranger' },
      project: { userId: OWNER_USER_ID },
    });
    await expect(getWorkspaceProject(TOKEN)).rejects.toThrow(NotFoundError);
    expect(db.project.findUnique).not.toHaveBeenCalled();
  });

  it('never passes claimIfOrphan — a page render must not take ownership', async () => {
    gate.mockResolvedValue({
      ok: true,
      isDemo: false,
      adminOverride: false,
      userRecord: { id: OWNER_USER_ID },
      project: { userId: OWNER_USER_ID },
    });
    seedProjectRow();
    await getWorkspaceProject(TOKEN);
    expect(gate).toHaveBeenCalledWith(OWNER_CLERK_ID, TOKEN, {
      action: 'dashboard_workspace',
    });
    expect(gate.mock.calls[0][2].claimIfOrphan).toBeUndefined();
  });
});

describe('getWorkspaceProject — pass-through data', () => {
  it('returns project + publishedPage + the owner clerkId for the owner', async () => {
    gate.mockResolvedValue({
      ok: true,
      isDemo: false,
      adminOverride: false,
      userRecord: { id: OWNER_USER_ID },
      project: { userId: OWNER_USER_ID },
    });
    seedProjectRow();

    const ctx = await getWorkspaceProject(TOKEN);

    expect(ctx.project).toEqual({ id: 'proj_1', tokenId: TOKEN, title: 'Peak Fitness Studio' });
    expect(ctx.publishedPage).toEqual({ id: 'pp_1', slug: 'peakfit', title: 'Peak Fitness' });
    expect(ctx.adminOverride).toBe(false);
    expect(ctx.clerkId).toBe(OWNER_CLERK_ID);
    // Keyed on projectId — NEVER a cross-ID-space userId join (C2).
    expect(db.publishedPage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId: 'proj_1' } })
    );
  });

  it('returns publishedPage:null for an unpublished project', async () => {
    gate.mockResolvedValue({
      ok: true,
      isDemo: false,
      adminOverride: false,
      userRecord: { id: OWNER_USER_ID },
      project: { userId: OWNER_USER_ID },
    });
    seedProjectRow();
    db.publishedPage.findFirst.mockResolvedValue(null);

    const ctx = await getWorkspaceProject(TOKEN);
    expect(ctx.publishedPage).toBeNull();
  });

  // C2 — the money test. An admin's own clerkId yields ZERO rows on the owner's
  // Clerk-keyed data (Testimonial.userId is a Clerk id): silently blank, not an error.
  it('returns the OWNER clerkId — not the admin caller\'s — under god-view (C2)', async () => {
    currentUserId = 'clerk_admin';
    gate.mockResolvedValue({
      ok: true,
      isDemo: false,
      adminOverride: true,
      userRecord: { id: 'user_internal_admin' },
      project: { userId: OWNER_USER_ID },
    });
    seedProjectRow();

    const ctx = await getWorkspaceProject(TOKEN);

    expect(ctx.adminOverride).toBe(true);
    expect(ctx.clerkId).toBe(OWNER_CLERK_ID);
    expect(ctx.clerkId).not.toBe('clerk_admin');
  });

  it('404s if the project row vanishes between the gate and the read', async () => {
    gate.mockResolvedValue({
      ok: true,
      isDemo: false,
      adminOverride: false,
      userRecord: { id: OWNER_USER_ID },
      project: { userId: OWNER_USER_ID },
    });
    db.project.findUnique.mockResolvedValue(null);
    await expect(getWorkspaceProject(TOKEN)).rejects.toThrow(NotFoundError);
  });
});
