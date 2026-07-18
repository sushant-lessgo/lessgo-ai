// src/app/api/work-library/route.test.ts
// ============================================================================
// Gate / eligibility / round-trip guards for the "Your work" library route
// (work-library-board phase 3).
//
// MOCKED: the module boundaries only — clerk `auth`, `@/lib/security`
// (createSecureResponse / assertProjectOwner / validateToken), and `@/lib/prisma`.
// The PURE core runs FOR REAL: `applyRailEdit` (rail door), `resyncWorkContent`
// (content resync), `getWorkFacts`, `slugify`, `templateHasCapability`. So the
// PUT round-trip pins the real facts→content transformation, not a re-stated mock.
//
// TEST-INTEGRITY: every fixture is hand-written from the CONTRACT (WorkFacts /
// the generation-seeded content shape), never derived from the code's own output.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authFn = vi.hoisted(() => vi.fn());
const assertProjectOwner = vi.hoisted(() => vi.fn());
const validateToken = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());
const findManyMedia = vi.hoisted(() => vi.fn());
const projectUpdate = vi.hoisted(() => vi.fn());
const transaction = vi.hoisted(() => vi.fn());

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => authFn(...args),
}));
vi.mock('@/lib/security', () => ({
  createSecureResponse: (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  assertProjectOwner: (...args: unknown[]) => assertProjectOwner(...args),
  validateToken: (...args: unknown[]) => validateToken(...args),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => projectUpdate(...args),
    },
    mediaAsset: { findMany: (...args: unknown[]) => findManyMedia(...args) },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

import { GET, PUT } from './route';

// ── Fixtures (hand-written from the contracts) ──────────────────────────────

const REAL_TOKEN = 'tok_real_123';
const CLERK_ID = 'user_clerk_1';

/** Two-group work facts bag, works-capable content mirroring the seeded shapes. */
function workFacts() {
  return {
    identity: { name: 'Kristina Kundius' },
    groups: [
      {
        name: 'Weddings',
        kind: 'category',
        price: { mode: 'on-request' },
        slug: 'weddings',
        photos: [
          { id: 'w1', url: 'https://cdn.test/w1.jpg', cover: true },
          { id: 'w2', url: 'https://cdn.test/w2.jpg' },
        ],
      },
      {
        name: 'Portraits',
        kind: 'category',
        price: { mode: 'on-request' },
        slug: 'portraits',
        photos: [{ id: 'p1', url: 'https://cdn.test/p1.jpg' }],
      },
    ],
  };
}

const galleryCards = () => [
  { id: 'card-weddings', name: 'Weddings', cover_image: 'https://cdn.test/w1.jpg', href: '/works/weddings' },
  { id: 'card-portraits', name: 'Portraits', cover_image: 'https://cdn.test/p1.jpg', href: '/works/portraits' },
];

/** The page-data tree stored under `Project.content.finalContent`. */
function finalContent() {
  return {
    content: {
      'work-home': {
        id: 'work-home',
        type: 'work',
        elements: { heading: 'The work', groups: galleryCards() },
      },
    },
    chrome: {
      footer: {
        id: 'footer-home',
        data: { id: 'footer-home', type: 'footer', elements: { copyright: '© KK', groups: galleryCards() } },
      },
    },
    pages: {
      'page-work-catalog': {
        id: 'page-work-catalog',
        kind: 'singleton',
        collectionKey: 'works',
        content: {
          'workcatalog-1': {
            id: 'workcatalog-1',
            type: 'workcatalog',
            elements: {
              items: [
                { id: 'it-weddings', name: 'Weddings', cover: 'https://cdn.test/w1.jpg', href: '/works/weddings' },
                { id: 'it-portraits', name: 'Portraits', cover: 'https://cdn.test/p1.jpg', href: '/works/portraits' },
              ],
            },
          },
        },
      },
      'page-weddings': {
        id: 'page-weddings',
        kind: 'collectionItem',
        collectionKey: 'works',
        content: {
          'workdetail-w': {
            id: 'workdetail-w',
            type: 'workdetail',
            elements: {
              name: 'Weddings',
              client: 'Real client',
              photos: [
                { id: 'w1', url: 'https://cdn.test/w1.jpg', alt: '', cover: true },
                { id: 'w2', url: 'https://cdn.test/w2.jpg', alt: '', cover: false },
              ],
            },
          },
        },
      },
      'page-portraits': {
        id: 'page-portraits',
        kind: 'collectionItem',
        collectionKey: 'works',
        content: {
          'workdetail-p': {
            id: 'workdetail-p',
            type: 'workdetail',
            elements: { name: 'Portraits', photos: [{ id: 'p1', url: 'https://cdn.test/p1.jpg', alt: '', cover: false }] },
          },
        },
      },
    },
  };
}

/** A works-capable project row (atelier declares `works` post-cutover). */
const worksProject = () => ({
  templateId: 'atelier',
  brief: { facts: { work: workFacts() }, businessType: 'photographer' },
  content: { onboarding: { name: 'KK' }, finalContent: finalContent() },
});

/** A non-works template (hearth = trust engine, lead-form only) — NOT works-capable (the trap). */
const atelierProject = () => ({
  templateId: 'hearth',
  brief: { facts: { work: workFacts() } },
  content: { finalContent: finalContent() },
});

function getReq(tokenId: string | null = REAL_TOKEN): Request {
  const url = tokenId
    ? `http://localhost/api/work-library?tokenId=${encodeURIComponent(tokenId)}`
    : 'http://localhost/api/work-library';
  return new Request(url, { method: 'GET' });
}

function putReq(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/work-library', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Send groups WITHOUT slugs (exercises server-side slug seeding). */
function putGroups() {
  return [
    {
      name: 'Weddings',
      price: { mode: 'on-request' },
      photos: [
        // hide w1 (the cover) — hide-not-destroy: the ref stays, flagged hidden.
        { id: 'w1', url: 'https://cdn.test/w1.jpg', cover: true, hidden: true },
        { id: 'w2', url: 'https://cdn.test/w2.jpg' },
      ],
    },
    {
      name: 'Portraits',
      price: { mode: 'on-request' },
      photos: [{ id: 'p1', url: 'https://cdn.test/p1.jpg' }],
    },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  authFn.mockResolvedValue({ userId: CLERK_ID });
  validateToken.mockReturnValue(true);
  assertProjectOwner.mockResolvedValue({ ok: true, isDemo: false, project: { userId: 'u1' } });
  findUnique.mockResolvedValue(worksProject());
  findManyMedia.mockResolvedValue([
    { url: 'https://cdn.test/w1.jpg', blurDataUrl: 'data:blur-w1' },
    { url: 'https://cdn.test/w2.jpg', blurDataUrl: null },
  ]);
  projectUpdate.mockReturnValue({ __update: true });
  transaction.mockResolvedValue([{}]);
});

// ── Authz gates ──────────────────────────────────────────────────────────────

describe('/api/work-library — authz gates', () => {
  it('unauthenticated → 401, no project read', async () => {
    authFn.mockResolvedValue({ userId: null });
    const res = await GET(getReq());
    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('wrong owner → 403, no project read (GET)', async () => {
    assertProjectOwner.mockResolvedValue({ ok: false, status: 403, error: 'Access denied' });
    const res = await GET(getReq());
    expect(res.status).toBe(403);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('wrong owner → 403, nothing written (PUT)', async () => {
    assertProjectOwner.mockResolvedValue({ ok: false, status: 403, error: 'Access denied' });
    const res = await PUT(putReq({ tokenId: REAL_TOKEN, groups: putGroups() }));
    expect(res.status).toBe(403);
    expect(transaction).not.toHaveBeenCalled();
    expect(projectUpdate).not.toHaveBeenCalled();
  });

  it('missing tokenId → 400', async () => {
    const res = await GET(getReq(null));
    expect(res.status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('ownership is asserted with the CLERK id + this route action', async () => {
    await GET(getReq());
    expect(assertProjectOwner).toHaveBeenCalledWith(CLERK_ID, REAL_TOKEN, {
      action: 'work-library:list',
    });
  });
});

// ── Eligibility (decision 7 — the isWorkCopyTemplate trap) ──────────────────

describe('/api/work-library — works-capability eligibility', () => {
  it('non-works template (hearth) → 400 on GET', async () => {
    findUnique.mockResolvedValue(atelierProject());
    const res = await GET(getReq());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/doesn't support the work library/i);
  });

  it('non-works template (hearth) → 400 on PUT, nothing written', async () => {
    findUnique.mockResolvedValue(atelierProject());
    const res = await PUT(putReq({ tokenId: REAL_TOKEN, groups: putGroups() }));
    expect(res.status).toBe(400);
    expect(transaction).not.toHaveBeenCalled();
    expect(projectUpdate).not.toHaveBeenCalled();
  });

  it('project not found → 404', async () => {
    findUnique.mockResolvedValue(null);
    const res = await GET(getReq());
    expect(res.status).toBe(404);
  });
});

// ── GET payload ──────────────────────────────────────────────────────────────

describe('/api/work-library — GET payload', () => {
  it('returns groups (slugs backfilled) + blurByUrl (hidden rows included, null blur skipped)', async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.groups.map((g: any) => g.name)).toEqual(['Weddings', 'Portraits']);
    expect(json.groups.map((g: any) => g.slug)).toEqual(['weddings', 'portraits']);
    // blur map: w1 present, w2 (null blur) skipped.
    expect(json.blurByUrl).toEqual({ 'https://cdn.test/w1.jpg': 'data:blur-w1' });
  });

  it('backfills a slug for a group that lacks one — response only, no write', async () => {
    const proj = worksProject();
    delete (proj.brief.facts.work.groups[0] as any).slug; // Weddings has no slug
    findUnique.mockResolvedValue(proj);
    const res = await GET(getReq());
    const json = await res.json();
    expect(json.groups[0].slug).toBe('weddings'); // slugify(name)
    expect(transaction).not.toHaveBeenCalled();
    expect(projectUpdate).not.toHaveBeenCalled();
  });
});

// ── PUT round-trip (real rail + real resync) ────────────────────────────────

describe('/api/work-library — PUT round-trip', () => {
  it('persists hidden refs in facts + resynced content (incl. catalog items) in ONE transaction', async () => {
    const res = await PUT(putReq({ tokenId: REAL_TOKEN, groups: putGroups() }));
    expect(res.status).toBe(200);

    // One transaction, one update.
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(projectUpdate).toHaveBeenCalledTimes(1);
    const data = projectUpdate.mock.calls[0][0].data;

    // (a) hide-not-destroy: w1 ref STAYS in facts, flagged hidden:true.
    const weddings = data.brief.facts.work.groups[0];
    expect(weddings.name).toBe('Weddings');
    expect(weddings.slug).toBe('weddings'); // seeded server-side (input had none)
    expect(weddings.photos.map((p: any) => p.id)).toEqual(['w1', 'w2']);
    expect(weddings.photos[0].hidden).toBe(true);

    // (b) resynced catalog items — the /works index, third group-ref surface.
    const catalogItems =
      data.content.finalContent.pages['page-work-catalog'].content['workcatalog-1'].elements.items;
    expect(catalogItems.map((i: any) => i.name)).toEqual(['Weddings', 'Portraits']);
    // hidden w1 dropped from the cover → falls back to w2.
    expect(catalogItems[0].cover).toBe('https://cdn.test/w2.jpg');

    // (c) resynced item-page photos: hidden w1 gone from the page.
    const detailPhotos =
      data.content.finalContent.pages['page-weddings'].content['workdetail-w'].elements.photos;
    expect(detailPhotos.map((p: any) => p.id)).toEqual(['w2']);

    // untouched wrapper key preserved.
    expect(data.content.onboarding).toEqual({ name: 'KK' });
    // AI copy left intact.
    expect(data.content.finalContent.pages['page-weddings'].content['workdetail-w'].elements.client)
      .toBe('Real client');
  });

  it('a restore (hidden unset) round-trips the photo back onto the pages', async () => {
    // Start from content where w1 was previously hidden (facts carry hidden:true),
    // then PUT with hidden cleared → resync restores w1 to the item page + cover.
    const groups = putGroups();
    delete (groups[0].photos[0] as any).hidden; // un-hide w1
    const res = await PUT(putReq({ tokenId: REAL_TOKEN, groups }));
    expect(res.status).toBe(200);
    const data = projectUpdate.mock.calls[0][0].data;
    expect(data.brief.facts.work.groups[0].photos[0].hidden).toBeUndefined();
    const detailPhotos =
      data.content.finalContent.pages['page-weddings'].content['workdetail-w'].elements.photos;
    expect(detailPhotos.map((p: any) => p.id)).toEqual(['w1', 'w2']);
  });

  it('rail-rejected groups (all names blank) → 400 with the rail error, nothing written', async () => {
    const res = await PUT(
      putReq({ tokenId: REAL_TOKEN, groups: [{ name: '', price: { mode: 'on-request' } }] })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/needs a name/i);
    expect(transaction).not.toHaveBeenCalled();
    expect(projectUpdate).not.toHaveBeenCalled();
  });

  it('schema-invalid body (groups not an array) → 400 before any read/write', async () => {
    const res = await PUT(putReq({ tokenId: REAL_TOKEN, groups: 'nope' }));
    expect(res.status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('over the total photo cap → 400, nothing written', async () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ id: `x${i}`, url: `https://cdn.test/x${i}.jpg` }));
    const res = await PUT(
      putReq({ tokenId: REAL_TOKEN, groups: [{ name: 'Big', photos: many }] })
    );
    expect(res.status).toBe(400);
    expect(transaction).not.toHaveBeenCalled();
  });
});
