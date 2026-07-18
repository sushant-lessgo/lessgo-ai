// A01 regression: assertProjectOwner is the single ownership gate behind saveDraft /
// regenerate-section / projects[tokenId] / privacy-policy. Prisma + admin are mocked so the test
// asserts pure authorization logic (owner / non-owner / admin override / demo / orphan claim /
// missing) without a DB. Guards against re-introducing the token-only edit bypass.

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    project: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(() => false),
  logAdminOverride: vi.fn(async () => {}),
}));

import { prisma } from '@/lib/prisma';
import { isAdmin, logAdminOverride } from '@/lib/admin';
import { assertProjectOwner } from './security';

const db = {
  user: prisma.user as unknown as { findUnique: ReturnType<typeof vi.fn> },
  project: prisma.project as unknown as {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  },
};
const isAdminMock = isAdmin as unknown as ReturnType<typeof vi.fn>;
const logAdminOverrideMock = logAdminOverride as unknown as ReturnType<typeof vi.fn>;

const DEMO_TOKEN = 'lessgodemomockdata';

beforeEach(() => {
  vi.clearAllMocks();
  isAdminMock.mockReturnValue(false);
});

describe('assertProjectOwner', () => {
  it('allows the demo token without any DB lookup', async () => {
    const res = await assertProjectOwner('clerk_anyone', DEMO_TOKEN, { action: 'saveDraft' });
    expect(res).toMatchObject({ ok: true, isDemo: true });
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.project.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated caller (no clerkId)', async () => {
    const res = await assertProjectOwner(null, 'tok_1', { action: 'saveDraft' });
    expect(res).toEqual({ ok: false, status: 401, error: 'Unauthorized' });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it('404s when the clerk user has no DB row', async () => {
    db.user.findUnique.mockResolvedValue(null);
    const res = await assertProjectOwner('clerk_ghost', 'tok_1', { action: 'saveDraft' });
    expect(res).toEqual({ ok: false, status: 404, error: 'User not found' });
  });

  it('allows the owner', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user_A' });
    db.project.findUnique.mockResolvedValue({ userId: 'user_A' });
    const res = await assertProjectOwner('clerk_A', 'tok_1', { action: 'saveDraft' });
    expect(res).toMatchObject({ ok: true, adminOverride: false });
    expect(db.project.update).not.toHaveBeenCalled();
  });

  it('403s a non-owner who is not an admin', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user_B' });
    db.project.findUnique.mockResolvedValue({ userId: 'user_A' });
    const res = await assertProjectOwner('clerk_B', 'tok_1', { action: 'saveDraft' });
    expect(res).toEqual({ ok: false, status: 403, error: 'Access denied' });
    expect(logAdminOverrideMock).not.toHaveBeenCalled();
  });

  it('allows a non-owner admin and writes an audit entry', async () => {
    isAdminMock.mockReturnValue(true);
    db.user.findUnique.mockResolvedValue({ id: 'user_admin' });
    db.project.findUnique.mockResolvedValue({ userId: 'user_A' });
    const res = await assertProjectOwner('clerk_admin', 'tok_1', { action: 'saveDraft' });
    expect(res).toMatchObject({ ok: true, adminOverride: true });
    expect(logAdminOverrideMock).toHaveBeenCalledWith({
      actorClerkId: 'clerk_admin',
      ownerId: 'user_A',
      action: 'saveDraft',
      resource: { tokenId: 'tok_1' },
    });
  });

  it('claims an orphan (unowned) project for the caller when claimIfOrphan', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user_B' });
    db.project.findUnique.mockResolvedValue({ userId: null });
    db.project.update.mockResolvedValue({});
    const res = await assertProjectOwner('clerk_B', 'tok_1', {
      action: 'saveDraft',
      claimIfOrphan: true,
    });
    expect(res).toMatchObject({ ok: true, project: { userId: 'user_B' } });
    expect(db.project.update).toHaveBeenCalledWith({
      where: { tokenId: 'tok_1' },
      data: { userId: 'user_B' },
    });
  });

  it('allows reading an orphan without claiming when claimIfOrphan is not set', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user_B' });
    db.project.findUnique.mockResolvedValue({ userId: null });
    const res = await assertProjectOwner('clerk_B', 'tok_1', { action: 'projects.read' });
    expect(res).toMatchObject({ ok: true });
    expect(db.project.update).not.toHaveBeenCalled();
  });

  it('allows a missing project when allowMissing (create-and-own path)', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user_B' });
    db.project.findUnique.mockResolvedValue(null);
    const res = await assertProjectOwner('clerk_B', 'tok_new', {
      action: 'saveDraft',
      allowMissing: true,
    });
    expect(res).toMatchObject({ ok: true, project: null, userRecord: { id: 'user_B' } });
  });

  it('404s a missing project for readers (allowMissing not set)', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user_B' });
    db.project.findUnique.mockResolvedValue(null);
    const res = await assertProjectOwner('clerk_B', 'tok_missing', { action: 'projects.read' });
    expect(res).toEqual({ ok: false, status: 404, error: 'Project not found' });
  });
});

// ── regen routes: the isMock-pairing anchor (regen-modernization D6) ────────
//
// Every regen route suite mocks `@/lib/security`, so the demo short-circuit each
// route pairs its own `isMock` check with is otherwise only ever asserted against
// a fake. These drive the REAL function for the regen action, and pin the exact
// property that makes the pairing MANDATORY rather than stylistic: the demo
// token yields `ok: true` for a caller with NO identity at all, before any read.
describe('assertProjectOwner — regen routes (isMock pairing)', () => {
  it('the demo token returns ok:true for an UNAUTHENTICATED caller, with no user record and no DB read', async () => {
    const res = await assertProjectOwner(null, DEMO_TOKEN, { action: 'regenerate-element' });

    // ok:true + userRecord:null + project:null ⇒ a route that trusted `ok` alone
    // would proceed to charge/generate for an anonymous caller. Hence isMock.
    expect(res).toEqual({
      ok: true,
      isDemo: true,
      adminOverride: false,
      userRecord: null,
      project: null,
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.project.findUnique).not.toHaveBeenCalled();
  });

  it('a regen caller on a real token gets the full gate: owner allowed, non-owner 403', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user_A' });
    db.project.findUnique.mockResolvedValue({ userId: 'user_A' });
    await expect(
      assertProjectOwner('clerk_A', 'tok_1', { action: 'regenerate-element' })
    ).resolves.toMatchObject({ ok: true, isDemo: false });

    db.user.findUnique.mockResolvedValue({ id: 'user_B' });
    await expect(
      assertProjectOwner('clerk_B', 'tok_1', { action: 'regenerate-element' })
    ).resolves.toEqual({ ok: false, status: 403, error: 'Access denied' });
  });

  it('regen never claims and never creates: no claimIfOrphan/allowMissing ⇒ a missing project is a 404', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user_B' });
    db.project.findUnique.mockResolvedValue(null);
    const res = await assertProjectOwner('clerk_B', 'tok_missing', {
      action: 'regenerate-element',
    });
    expect(res).toEqual({ ok: false, status: 404, error: 'Project not found' });
    expect(db.project.update).not.toHaveBeenCalled();
  });
});
