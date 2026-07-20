// src/app/api/collections/collections.authz.test.ts
// ============================================================================
// MANDATORY authz regression for the five /api/collections/* routes
// (cms-collections plan phase 1, step 6, third bullet).
//
// WHY THIS TEST EXISTS, AND WHY IT IS SHAPED THIS WAY
// ---------------------------------------------------
// `assertProjectOwner` returns a RESULT object (`{ok:true,…} | {ok:false,…}`).
// It does NOT throw and does NOT 403 by itself. A handler that calls it and
// discards the result ships a gate that enforces NOTHING — and a test that only
// asserts "no data came back" would sit GREEN through exactly that bug (the
// inert-assertion trap). So:
//
//   * the REAL `assertProjectOwner` runs (only `createSecureResponse` is faked,
//     to keep NextResponse out of jsdom) — the 403 must come from the real gate,
//     not from a mock we told to deny;
//   * every case asserts the STATUS **and** the ERROR BODY;
//   * every wrong-owner case ALSO asserts that not a single Collection /
//     CollectionGroup / CollectionItem query was issued — denial must happen
//     BEFORE any table read.
//
// MOCKED: module boundaries only — clerk `auth`, `@/lib/prisma` (an in-memory
// fake), `@/lib/admin` (isAdmin → false; the admin override is a separate,
// intentional path). The route logic, the Zod contract and the slug helpers all
// run for real.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── fixtures ────────────────────────────────────────────────────────────────

const TOKEN_A = 'tok_project_a';
const TOKEN_B = 'tok_project_b';
const CLERK_OWNER_A = 'clerk_owner_a';
const CLERK_OWNER_B = 'clerk_owner_b';
const USER_A = 'u_a';
const USER_B = 'u_b';

const COLLECTION_A = 'col_a';
const COLLECTION_B = 'col_b'; // belongs to project B
const ITEM_A = 'item_a';
const GROUP_A = 'group_a';

const FIELDS = [
  { id: 'title', name: 'Title', type: 'text_short' },
  { id: 'cover', name: 'Cover', type: 'image' },
];

/** Collection rows, keyed by id, each carrying the token it belongs to. */
const COLLECTION_ROWS: Record<string, any> = {
  [COLLECTION_A]: {
    id: COLLECTION_A,
    projectId: 'p_a',
    tokenId: TOKEN_A,
    name: 'Books',
    slug: 'books',
    fieldSchema: FIELDS,
    roles: { title: 'title' },
    detailPages: false,
    layoutHint: null,
    order: 0,
  },
  [COLLECTION_B]: {
    id: COLLECTION_B,
    projectId: 'p_b',
    tokenId: TOKEN_B,
    name: 'Secrets',
    slug: 'secrets',
    fieldSchema: FIELDS,
    roles: {},
    detailPages: false,
    layoutHint: null,
    order: 0,
  },
};

// ── mocks ───────────────────────────────────────────────────────────────────

const authFn = vi.hoisted(() => vi.fn());
const db = vi.hoisted(() => ({
  /** every call to a CMS table, recorded — the "no read before denial" proof */
  cmsCalls: [] as string[],
  userFindUnique: vi.fn(),
  projectFindUnique: vi.fn(),
  collectionFindMany: vi.fn(),
  collectionFindFirst: vi.fn(),
  collectionCreate: vi.fn(),
  collectionUpdate: vi.fn(),
  collectionDelete: vi.fn(),
  groupFindMany: vi.fn(),
  groupFindFirst: vi.fn(),
  groupCreate: vi.fn(),
  groupUpdate: vi.fn(),
  groupDelete: vi.fn(),
  groupAggregate: vi.fn(),
  itemFindMany: vi.fn(),
  itemFindFirst: vi.fn(),
  itemCreate: vi.fn(),
  itemUpdate: vi.fn(),
  itemDelete: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => authFn(...args),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: () => false,
  logAdminOverride: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const track = (label: string, fn: (...a: any[]) => any) => (...args: any[]) => {
    db.cmsCalls.push(label);
    return fn(...args);
  };
  return {
    prisma: {
      user: { findUnique: (...a: any[]) => db.userFindUnique(...a) },
      project: { findUnique: (...a: any[]) => db.projectFindUnique(...a) },
      collection: {
        findMany: track('collection.findMany', (...a: any[]) => db.collectionFindMany(...a)),
        findFirst: track('collection.findFirst', (...a: any[]) => db.collectionFindFirst(...a)),
        create: track('collection.create', (...a: any[]) => db.collectionCreate(...a)),
        update: track('collection.update', (...a: any[]) => db.collectionUpdate(...a)),
        delete: track('collection.delete', (...a: any[]) => db.collectionDelete(...a)),
      },
      collectionGroup: {
        findMany: track('group.findMany', (...a: any[]) => db.groupFindMany(...a)),
        findFirst: track('group.findFirst', (...a: any[]) => db.groupFindFirst(...a)),
        create: track('group.create', (...a: any[]) => db.groupCreate(...a)),
        update: track('group.update', (...a: any[]) => db.groupUpdate(...a)),
        delete: track('group.delete', (...a: any[]) => db.groupDelete(...a)),
        aggregate: track('group.aggregate', (...a: any[]) => db.groupAggregate(...a)),
      },
      collectionItem: {
        findMany: track('item.findMany', (...a: any[]) => db.itemFindMany(...a)),
        findFirst: track('item.findFirst', (...a: any[]) => db.itemFindFirst(...a)),
        create: track('item.create', (...a: any[]) => db.itemCreate(...a)),
        update: track('item.update', (...a: any[]) => db.itemUpdate(...a)),
        delete: track('item.delete', (...a: any[]) => db.itemDelete(...a)),
      },
      $transaction: (ops: any[]) => Promise.all(ops),
    },
  };
});

// REAL assertProjectOwner + validateToken; only the response helper is faked so
// NextResponse never has to boot under jsdom.
vi.mock('@/lib/security', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/security')>();
  return {
    ...actual,
    createSecureResponse: (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  };
});

import * as collectionsRoute from './route';
import * as collectionRoute from './[collectionId]/route';
import * as groupsRoute from './[collectionId]/groups/route';
import * as itemsRoute from './[collectionId]/items/route';
import * as itemRoute from './[collectionId]/items/[itemId]/route';

// ── helpers ─────────────────────────────────────────────────────────────────

const url = (path: string) => `http://localhost${path}`;

function jsonReq(path: string, body: unknown, method = 'POST') {
  return new Request(url(path), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function readJson(res: Response) {
  return { status: res.status, body: await res.json() };
}

/** Sign in as a clerk user whose DB record maps to `userId`. */
function signInAs(clerkId: string) {
  authFn.mockResolvedValue({ userId: clerkId });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.cmsCalls.length = 0;

  db.userFindUnique.mockImplementation(async ({ where }: any) =>
    where.clerkId === CLERK_OWNER_A
      ? { id: USER_A }
      : where.clerkId === CLERK_OWNER_B
        ? { id: USER_B }
        : null
  );

  // TOKEN_A → owned by USER_A; TOKEN_B → owned by USER_B.
  db.projectFindUnique.mockImplementation(async ({ where }: any) => {
    if (where.tokenId === TOKEN_A) return { id: 'p_a', userId: USER_A };
    if (where.tokenId === TOKEN_B) return { id: 'p_b', userId: USER_B };
    return null;
  });

  // The nested-ownership contract, faithfully modelled: a collection is only
  // findable when the WHERE clause's tokenId matches the row's own tokenId.
  db.collectionFindFirst.mockImplementation(async ({ where }: any) => {
    const row = COLLECTION_ROWS[where.id];
    if (!row) return null;
    if (where.tokenId && row.tokenId !== where.tokenId) return null;
    return { ...row };
  });
  db.collectionFindMany.mockResolvedValue([]);
  db.collectionCreate.mockImplementation(async ({ data }: any) => ({ id: 'new_col', ...data }));
  db.collectionUpdate.mockImplementation(async ({ data }: any) => ({ id: COLLECTION_A, ...data }));
  db.collectionDelete.mockResolvedValue({ id: COLLECTION_A });

  db.groupFindMany.mockResolvedValue([]);
  db.groupFindFirst.mockResolvedValue(null);
  db.groupAggregate.mockResolvedValue({ _max: { order: null } });
  db.groupCreate.mockImplementation(async ({ data }: any) => ({ id: GROUP_A, ...data }));
  db.groupUpdate.mockImplementation(async ({ where, data }: any) => ({ id: where.id, ...data }));
  db.groupDelete.mockResolvedValue({ id: GROUP_A });

  db.itemFindMany.mockResolvedValue([]);
  db.itemFindFirst.mockResolvedValue(null);
  db.itemCreate.mockImplementation(async ({ data }: any) => ({ id: 'new_item', ...data }));
  db.itemUpdate.mockImplementation(async ({ where, data }: any) => ({ id: where.id, ...data }));
  db.itemDelete.mockResolvedValue({ id: ITEM_A });
});

// ── 1. wrong owner → 403 + body, on EVERY route ─────────────────────────────

describe('/api/collections/* — wrong-owner requests are refused', () => {
  const P_COL = { params: { collectionId: COLLECTION_A } };
  const P_ITEM = { params: { collectionId: COLLECTION_A, itemId: ITEM_A } };

  /**
   * Every entry hits TOKEN_A (owned by user A) while signed in as user B.
   * All five route files, all their verbs.
   */
  const cases: Array<{ name: string; run: () => Promise<Response> }> = [
    {
      name: 'GET /api/collections',
      run: () => collectionsRoute.GET(new Request(url(`/api/collections?tokenId=${TOKEN_A}`))),
    },
    {
      name: 'POST /api/collections',
      run: () =>
        collectionsRoute.POST(
          jsonReq('/api/collections', { tokenId: TOKEN_A, name: 'Books', fieldSchema: FIELDS })
        ),
    },
    {
      name: 'GET /api/collections/:id',
      run: () =>
        collectionRoute.GET(
          new Request(url(`/api/collections/${COLLECTION_A}?tokenId=${TOKEN_A}`)),
          P_COL
        ),
    },
    {
      name: 'PATCH /api/collections/:id',
      run: () =>
        collectionRoute.PATCH(
          jsonReq(`/api/collections/${COLLECTION_A}`, { tokenId: TOKEN_A, name: 'Hacked' }, 'PATCH'),
          P_COL
        ),
    },
    {
      name: 'DELETE /api/collections/:id',
      run: () =>
        collectionRoute.DELETE(
          new Request(url(`/api/collections/${COLLECTION_A}?tokenId=${TOKEN_A}`), {
            method: 'DELETE',
          }),
          P_COL
        ),
    },
    {
      name: 'POST /api/collections/:id/groups',
      run: () =>
        groupsRoute.POST(
          jsonReq(`/api/collections/${COLLECTION_A}/groups`, { tokenId: TOKEN_A, name: 'G' }),
          P_COL
        ),
    },
    {
      name: 'PATCH /api/collections/:id/groups',
      run: () =>
        groupsRoute.PATCH(
          jsonReq(
            `/api/collections/${COLLECTION_A}/groups`,
            { tokenId: TOKEN_A, groups: [{ id: GROUP_A, name: 'G2' }] },
            'PATCH'
          ),
          P_COL
        ),
    },
    {
      name: 'DELETE /api/collections/:id/groups',
      run: () =>
        groupsRoute.DELETE(
          new Request(
            url(`/api/collections/${COLLECTION_A}/groups?tokenId=${TOKEN_A}&groupId=${GROUP_A}`),
            { method: 'DELETE' }
          ),
          P_COL
        ),
    },
    {
      name: 'POST /api/collections/:id/items',
      run: () =>
        itemsRoute.POST(
          jsonReq(`/api/collections/${COLLECTION_A}/items`, {
            tokenId: TOKEN_A,
            values: { title: 'X' },
          }),
          P_COL
        ),
    },
    {
      name: 'PATCH /api/collections/:id/items',
      run: () =>
        itemsRoute.PATCH(
          jsonReq(
            `/api/collections/${COLLECTION_A}/items`,
            { tokenId: TOKEN_A, items: [{ id: ITEM_A, order: 3 }] },
            'PATCH'
          ),
          P_COL
        ),
    },
    {
      name: 'GET /api/collections/:id/items/:itemId',
      run: () =>
        itemRoute.GET(
          new Request(url(`/api/collections/${COLLECTION_A}/items/${ITEM_A}?tokenId=${TOKEN_A}`)),
          P_ITEM
        ),
    },
    {
      name: 'PATCH /api/collections/:id/items/:itemId',
      run: () =>
        itemRoute.PATCH(
          jsonReq(
            `/api/collections/${COLLECTION_A}/items/${ITEM_A}`,
            { tokenId: TOKEN_A, values: { title: 'Hacked' } },
            'PATCH'
          ),
          P_ITEM
        ),
    },
    {
      name: 'DELETE /api/collections/:id/items/:itemId',
      run: () =>
        itemRoute.DELETE(
          new Request(url(`/api/collections/${COLLECTION_A}/items/${ITEM_A}?tokenId=${TOKEN_A}`), {
            method: 'DELETE',
          }),
          P_ITEM
        ),
    },
  ];

  it.each(cases)('$name → 403 with an error body', async ({ run }) => {
    signInAs(CLERK_OWNER_B); // NOT the owner of TOKEN_A
    const { status, body } = await readJson(await run());

    // Status AND body — a discarded ownership result would 200 here.
    expect(status).toBe(403);
    expect(body).toEqual({ error: 'Access denied' });
  });

  it.each(cases)('$name → touches no CMS table before denying', async ({ run }) => {
    signInAs(CLERK_OWNER_B);
    await run();
    expect(db.cmsCalls).toEqual([]);
  });

  it.each(cases)('$name → 401 when unauthenticated', async ({ run }) => {
    authFn.mockResolvedValue({ userId: null });
    const { status, body } = await readJson(await run());
    expect(status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(db.cmsCalls).toEqual([]);
  });
});

// ── 2. cross-project nested access (valid token, someone else's collection) ──

describe('/api/collections/* — nested ownership (token A, collection B)', () => {
  const P_COL_B = { params: { collectionId: COLLECTION_B } };
  const P_ITEM_B = { params: { collectionId: COLLECTION_B, itemId: ITEM_A } };

  beforeEach(() => signInAs(CLERK_OWNER_A)); // legitimately owns TOKEN_A

  it('GET /:id — a valid token cannot read another project’s collection', async () => {
    const { status, body } = await readJson(
      await collectionRoute.GET(
        new Request(url(`/api/collections/${COLLECTION_B}?tokenId=${TOKEN_A}`)),
        P_COL_B
      )
    );
    expect(status).toBe(404);
    expect(body).toEqual({ error: 'Collection not found' });
    // and it never went on to read the foreign collection's groups/items
    expect(db.groupFindMany).not.toHaveBeenCalled();
    expect(db.itemFindMany).not.toHaveBeenCalled();
  });

  it('PATCH /:id — cannot mutate another project’s collection', async () => {
    const { status, body } = await readJson(
      await collectionRoute.PATCH(
        jsonReq(`/api/collections/${COLLECTION_B}`, { tokenId: TOKEN_A, name: 'Pwned' }, 'PATCH'),
        P_COL_B
      )
    );
    expect(status).toBe(404);
    expect(body).toEqual({ error: 'Collection not found' });
    expect(db.collectionUpdate).not.toHaveBeenCalled();
  });

  it('DELETE /:id — cannot delete another project’s collection', async () => {
    const { status } = await readJson(
      await collectionRoute.DELETE(
        new Request(url(`/api/collections/${COLLECTION_B}?tokenId=${TOKEN_A}`), {
          method: 'DELETE',
        }),
        P_COL_B
      )
    );
    expect(status).toBe(404);
    expect(db.collectionDelete).not.toHaveBeenCalled();
  });

  it('POST /:id/groups — cannot add a group to another project’s collection', async () => {
    const { status, body } = await readJson(
      await groupsRoute.POST(
        jsonReq(`/api/collections/${COLLECTION_B}/groups`, { tokenId: TOKEN_A, name: 'G' }),
        P_COL_B
      )
    );
    expect(status).toBe(404);
    expect(body).toEqual({ error: 'Collection not found' });
    expect(db.groupCreate).not.toHaveBeenCalled();
  });

  it('POST /:id/items — cannot add an item to another project’s collection', async () => {
    const { status } = await readJson(
      await itemsRoute.POST(
        jsonReq(`/api/collections/${COLLECTION_B}/items`, {
          tokenId: TOKEN_A,
          values: { title: 'X' },
        }),
        P_COL_B
      )
    );
    expect(status).toBe(404);
    expect(db.itemCreate).not.toHaveBeenCalled();
  });

  it('PATCH /:id/items/:itemId — item lookup is scoped by BOTH collection and token', async () => {
    const { status, body } = await readJson(
      await itemRoute.PATCH(
        jsonReq(
          `/api/collections/${COLLECTION_B}/items/${ITEM_A}`,
          { tokenId: TOKEN_A, values: { title: 'Pwned' } },
          'PATCH'
        ),
        P_ITEM_B
      )
    );
    expect(status).toBe(404);
    expect(body).toEqual({ error: 'Item not found' });
    // the WHERE clause itself must carry the token + collection constraints
    expect(db.itemFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: ITEM_A,
          collectionId: COLLECTION_B,
          collection: { tokenId: TOKEN_A },
        }),
      })
    );
    expect(db.itemUpdate).not.toHaveBeenCalled();
  });
});

// ── 3. slug collisions ──────────────────────────────────────────────────────

describe('/api/collections — slug collisions at write time', () => {
  beforeEach(() => signInAs(CLERK_OWNER_A));

  it('POST with an EXPLICIT colliding slug → 409, nothing written', async () => {
    db.collectionFindMany.mockResolvedValue([{ slug: 'books', order: 0 }]);

    const { status, body } = await readJson(
      await collectionsRoute.POST(
        jsonReq('/api/collections', {
          tokenId: TOKEN_A,
          name: 'Books',
          slug: 'books',
          fieldSchema: FIELDS,
        })
      )
    );

    expect(status).toBe(409);
    expect(body.error).toMatch(/already used/i);
    expect(db.collectionCreate).not.toHaveBeenCalled();
  });

  it('POST with a DERIVED colliding slug → clamped to books-2', async () => {
    db.collectionFindMany.mockResolvedValue([{ slug: 'books', order: 0 }]);

    const { status } = await readJson(
      await collectionsRoute.POST(
        jsonReq('/api/collections', { tokenId: TOKEN_A, name: 'Books', fieldSchema: FIELDS })
      )
    );

    expect(status).toBe(201);
    expect(db.collectionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'books-2', projectId: 'p_a', tokenId: TOKEN_A }),
      })
    );
  });

  it('POST derives projectId SERVER-SIDE and ignores a body projectId', async () => {
    const { status } = await readJson(
      await collectionsRoute.POST(
        jsonReq('/api/collections', {
          tokenId: TOKEN_A,
          name: 'Books',
          fieldSchema: FIELDS,
          projectId: 'p_someone_else',
        })
      )
    );

    expect(status).toBe(201);
    expect(db.collectionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ projectId: 'p_a' }) })
    );
  });

  it('a unique-constraint race surfaces as 409, not 500', async () => {
    db.collectionCreate.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));

    const { status, body } = await readJson(
      await collectionsRoute.POST(
        jsonReq('/api/collections', { tokenId: TOKEN_A, name: 'Books', fieldSchema: FIELDS })
      )
    );

    expect(status).toBe(409);
    expect(body.error).toMatch(/already used/i);
  });

  it('PATCH /:id to an already-taken slug → 409, nothing written', async () => {
    db.collectionFindFirst
      .mockResolvedValueOnce({ ...COLLECTION_ROWS[COLLECTION_A] }) // ownership load
      .mockResolvedValueOnce({ id: 'other' }); // the slug clash probe

    const { status, body } = await readJson(
      await collectionRoute.PATCH(
        jsonReq(`/api/collections/${COLLECTION_A}`, { tokenId: TOKEN_A, slug: 'taken' }, 'PATCH'),
        { params: { collectionId: COLLECTION_A } }
      )
    );

    expect(status).toBe(409);
    expect(body.error).toMatch(/already used/i);
    expect(db.collectionUpdate).not.toHaveBeenCalled();
  });

  it('item POST with an explicit colliding slug → 409', async () => {
    db.itemFindMany.mockResolvedValue([{ slug: 'blue-chair', order: 0 }]);

    const { status, body } = await readJson(
      await itemsRoute.POST(
        jsonReq(`/api/collections/${COLLECTION_A}/items`, {
          tokenId: TOKEN_A,
          slug: 'blue-chair',
          values: { title: 'Blue Chair' },
        }),
        { params: { collectionId: COLLECTION_A } }
      )
    );

    expect(status).toBe(409);
    expect(body.error).toMatch(/already used/i);
    expect(db.itemCreate).not.toHaveBeenCalled();
  });

  it('item POST derives its slug from the TITLE-ROLE value and clamps collisions', async () => {
    db.itemFindMany.mockResolvedValue([{ slug: 'blue-chair', order: 0 }]);

    const { status } = await readJson(
      await itemsRoute.POST(
        jsonReq(`/api/collections/${COLLECTION_A}/items`, {
          tokenId: TOKEN_A,
          values: { title: 'Blue Chair' },
        }),
        { params: { collectionId: COLLECTION_A } }
      )
    );

    expect(status).toBe(201);
    expect(db.itemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'blue-chair-2', slugLocked: false }),
      })
    );
  });
});

// ── 4. non-destructive schema edit + value merge (contract, not just authz) ──

describe('/api/collections — non-destructive semantics', () => {
  beforeEach(() => signInAs(CLERK_OWNER_A));

  it('PATCH fieldSchema removing a field never rewrites items', async () => {
    const { status } = await readJson(
      await collectionRoute.PATCH(
        jsonReq(
          `/api/collections/${COLLECTION_A}`,
          { tokenId: TOKEN_A, fieldSchema: [{ id: 'cover', name: 'Cover', type: 'image' }] },
          'PATCH'
        ),
        { params: { collectionId: COLLECTION_A } }
      )
    );

    expect(status).toBe(200);
    expect(db.itemUpdate).not.toHaveBeenCalled();
    expect(db.itemFindMany).not.toHaveBeenCalled();
    // the now-dangling `title` role is pruned rather than left pointing at nothing
    expect(db.collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ roles: {} }) })
    );
  });

  it('item PATCH values MERGES — orphan keys from a removed field survive', async () => {
    db.itemFindFirst.mockResolvedValue({
      id: ITEM_A,
      collectionId: COLLECTION_A,
      slug: 'x',
      slugLocked: false,
      values: { title: 'Old', removedField: 'orphaned' },
      order: 0,
      collection: COLLECTION_ROWS[COLLECTION_A],
    });

    const { status } = await readJson(
      await itemRoute.PATCH(
        jsonReq(
          `/api/collections/${COLLECTION_A}/items/${ITEM_A}`,
          { tokenId: TOKEN_A, values: { title: 'New' } },
          'PATCH'
        ),
        { params: { collectionId: COLLECTION_A, itemId: ITEM_A } }
      )
    );

    expect(status).toBe(200);
    expect(db.itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          values: { title: 'New', removedField: 'orphaned' },
        }),
      })
    );
  });

  it('item PATCH with a manual slug sets slugLocked', async () => {
    db.itemFindFirst
      .mockResolvedValueOnce({
        id: ITEM_A,
        collectionId: COLLECTION_A,
        slug: 'old-slug',
        slugLocked: false,
        values: {},
        order: 0,
        collection: COLLECTION_ROWS[COLLECTION_A],
      })
      .mockResolvedValueOnce(null); // no clash

    const { status } = await readJson(
      await itemRoute.PATCH(
        jsonReq(
          `/api/collections/${COLLECTION_A}/items/${ITEM_A}`,
          { tokenId: TOKEN_A, slug: 'new-slug' },
          'PATCH'
        ),
        { params: { collectionId: COLLECTION_A, itemId: ITEM_A } }
      )
    );

    expect(status).toBe(200);
    expect(db.itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'new-slug', slugLocked: true }),
      })
    );
  });
});

// ── 5. amendment 2026-07-20: preset seeding + the new stored fields ──────────
//
// AMENDMENT ITEM 4 — "presets must not be precluded". A preset is nothing but a
// pre-filled POST body: a fully populated fieldSchema + roles (+ purposes) must
// create a valid collection in ONE call, with the slug derived server-side. No
// preset UI ships in v1 (the START FROM chips are greyed), so this route path has
// no other caller — which is exactly why it needs a pin: a future refactor could
// break programmatic seeding and every shipped surface would stay green.

describe('/api/collections — preset seeding (amendment item 4)', () => {
  beforeEach(() => signInAs(CLERK_OWNER_A));

  /** A realistic "Products" preset, as a seeding caller would send it. */
  const PRESET = {
    name: 'Products',
    fieldSchema: [
      { id: 'title', name: 'Name', type: 'text_short' },
      { id: 'cover', name: 'Photo', type: 'image' },
      { id: 'blurb', name: 'Description', type: 'text_long' },
      { id: 'price', name: 'Price', type: 'text_short' }, // ruling #2: no Price TYPE
      { id: 'spec', name: 'Spec', type: 'stat' },
      { id: 'buy', name: 'Buy', type: 'link' },
    ],
    roles: { title: 'title', cover: 'cover', primaryLink: 'buy' },
    purposes: ['offer', 'price'],
    detailPages: true,
  };

  it('ONE POST with a fully pre-filled schema + roles + purposes creates the collection', async () => {
    const { status, body } = await readJson(
      await collectionsRoute.POST(jsonReq('/api/collections', { tokenId: TOKEN_A, ...PRESET }))
    );

    expect(status).toBe(201);
    expect(db.collectionCreate).toHaveBeenCalledTimes(1); // ONE call, not a build-up
    expect(db.collectionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'p_a',
          tokenId: TOKEN_A,
          name: 'Products',
          slug: 'products', // derived server-side, not supplied
          fieldSchema: PRESET.fieldSchema,
          roles: PRESET.roles, // survives the cross-field role gate intact
          purposes: ['offer', 'price'],
          detailPages: true,
          listingPage: false,
        }),
      })
    );
    expect(body.collection.name).toBe('Products');
  });

  it('a preset whose roles point at the wrong field TYPE is refused, not silently dropped', async () => {
    // Anti-vacuity for the test above: the role gate really runs on this path.
    const { status } = await readJson(
      await collectionsRoute.POST(
        jsonReq('/api/collections', {
          tokenId: TOKEN_A,
          ...PRESET,
          roles: { title: 'blurb' }, // text_long — not allowed for `title`
        })
      )
    );
    expect(status).toBe(400);
    expect(db.collectionCreate).not.toHaveBeenCalled();
  });

  it('a preset carrying an unknown purpose is refused (closed vocab)', async () => {
    const { status } = await readJson(
      await collectionsRoute.POST(
        jsonReq('/api/collections', { tokenId: TOKEN_A, ...PRESET, purposes: ['case-study'] })
      )
    );
    expect(status).toBe(400);
    expect(db.collectionCreate).not.toHaveBeenCalled();
  });

  it('purposes default to [] and listingPage to false when the body omits them', async () => {
    const { status } = await readJson(
      await collectionsRoute.POST(
        jsonReq('/api/collections', { tokenId: TOKEN_A, name: 'Books', fieldSchema: FIELDS })
      )
    );
    expect(status).toBe(201);
    expect(db.collectionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ purposes: [], listingPage: false, detailPages: false }),
      })
    );
  });

  it('PATCH persists listingPage + deduped purposes, and omission leaves them alone', async () => {
    const { status } = await readJson(
      await collectionRoute.PATCH(
        jsonReq(
          `/api/collections/${COLLECTION_A}`,
          { tokenId: TOKEN_A, listingPage: true, purposes: ['proof', 'proof', 'offer'] },
          'PATCH'
        ),
        { params: { collectionId: COLLECTION_A } }
      )
    );
    expect(status).toBe(200);
    const data = db.collectionUpdate.mock.calls[0][0].data;
    expect(data.listingPage).toBe(true);
    expect(data.purposes).toEqual(['proof', 'offer']);

    // Omitted → the key is not written at all (no accidental reset to false/[]).
    db.collectionUpdate.mockClear();
    await collectionRoute.PATCH(
      jsonReq(`/api/collections/${COLLECTION_A}`, { tokenId: TOKEN_A, name: 'Renamed' }, 'PATCH'),
      { params: { collectionId: COLLECTION_A } }
    );
    const data2 = db.collectionUpdate.mock.calls[0][0].data;
    expect('listingPage' in data2).toBe(false);
    expect('purposes' in data2).toBe(false);
  });

  it('item PATCH persists featuredOnHome (reserved column — accepted, never read)', async () => {
    db.itemFindFirst.mockResolvedValue({
      id: ITEM_A,
      collectionId: COLLECTION_A,
      slug: 'x',
      slugLocked: false,
      values: {},
      order: 0,
      featuredOnHome: false,
      collection: COLLECTION_ROWS[COLLECTION_A],
    });

    const { status } = await readJson(
      await itemRoute.PATCH(
        jsonReq(
          `/api/collections/${COLLECTION_A}/items/${ITEM_A}`,
          { tokenId: TOKEN_A, featuredOnHome: true },
          'PATCH'
        ),
        { params: { collectionId: COLLECTION_A, itemId: ITEM_A } }
      )
    );

    expect(status).toBe(200);
    expect(db.itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ featuredOnHome: true }) })
    );
  });
});
