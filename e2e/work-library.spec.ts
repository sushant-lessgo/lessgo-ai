import { test, expect, type Page, type Locator } from '@playwright/test';

// ============================================================================
// work-library-board (phase 7) — the "Your work" dashboard board CRUD round-trip.
//
// Authed (Clerk session from auth.setup.ts, same pattern as publish.spec.ts).
// Seeds a WORKS-CAPABLE project directly through the real `/api/saveDraft` route
// (templateId `atelier2` + `brief.facts.work.groups` + a works-shaped
// finalContent) — the board reads its groups from `brief.facts.work` and the PUT
// resyncs the stored content, so no generation/onboarding drive is needed.
//
// Drives the CorrectionBoard (dashboard mode) end-to-end and asserts with
// MUTATION — every step checks an actual DOM/state change AND every persisted
// value is re-verified after a full reload (never endpoint-only / presence-only;
// the inert-assertion lesson from project memory):
//   load groups → rename a group → hide a photo (dims + Restore appears) →
//   restore → move a photo between groups → reorder within a group → pick a cover
//   → reload → assert EVERYTHING persisted.
//
// ⚠️ REGISTRATION: like every authed spec, this file only executes when listed in
// the `authed` project's `testMatch` allowlist in `playwright.config.ts`. That
// file is OUTSIDE this phase's Files-touched list — see the phase-7 audit
// (PILOT PRE-CHECK / open risks): the one-line registration must be added by the
// orchestrator before the gate run, else Playwright silently matches nothing
// (false green).
// ============================================================================

test.describe.configure({ mode: 'serial' });

// Deterministic token → re-seeding overwrites the same project each run (owner is
// the same Clerk test user; saveDraft claims/updates it), resetting board state.
const TOKEN = 'e2e-work-library-board';
const WORK_LIB = '/api/work-library';

/** A works-capable finalContent tree (gallery + workcatalog + two item pages) so
 *  the PUT resync exercises the real path, not the degrade branch. */
function seedFinalContent() {
  const cards = [
    { id: 'card-weddings', name: 'Weddings', cover_image: 'https://cdn.test/w1.jpg', href: '/works/weddings' },
    { id: 'card-portraits', name: 'Portraits', cover_image: 'https://cdn.test/p1.jpg', href: '/works/portraits' },
  ];
  return {
    layout: { sections: ['work-home'], theme: {}, globalSettings: {} },
    content: {
      'work-home': {
        id: 'work-home',
        type: 'work',
        elements: { eyebrow: 'Selected work', heading: 'The work', lead: 'A few.', groups: cards },
      },
    },
    pages: {
      'page-work-catalog': {
        id: 'page-work-catalog', pathSlug: '/works', kind: 'singleton', collectionKey: 'works',
        content: {
          'workcatalog-1': {
            id: 'workcatalog-1', type: 'workcatalog',
            elements: {
              eyebrow: 'Works',
              items: [
                { id: 'it-weddings', name: 'Weddings', cover: 'https://cdn.test/w1.jpg', href: '/works/weddings' },
                { id: 'it-portraits', name: 'Portraits', cover: 'https://cdn.test/p1.jpg', href: '/works/portraits' },
              ],
            },
          },
        },
      },
      'page-weddings': {
        id: 'page-weddings', pathSlug: '/works/weddings', kind: 'collectionItem', collectionKey: 'works',
        content: {
          'workdetail-w': {
            id: 'workdetail-w', type: 'workdetail',
            elements: {
              name: 'Weddings',
              photos: [
                { id: 'w1', url: 'https://cdn.test/w1.jpg', alt: '', cover: true },
                { id: 'w2', url: 'https://cdn.test/w2.jpg', alt: '', cover: false },
              ],
            },
          },
        },
      },
      'page-portraits': {
        id: 'page-portraits', pathSlug: '/works/portraits', kind: 'collectionItem', collectionKey: 'works',
        content: {
          'workdetail-p': {
            id: 'workdetail-p', type: 'workdetail',
            elements: { name: 'Portraits', photos: [{ id: 'p1', url: 'https://cdn.test/p1.jpg', alt: '', cover: false }] },
          },
        },
      },
    },
    meta: { title: 'Kundius (e2e)', slug: '', version: 1 },
    onboardingData: {},
  };
}

/** The work FACTS the board reads (brief.facts.work.groups). */
function seedFacts() {
  return {
    work: {
      identity: { name: 'Kundius (e2e)' },
      groups: [
        {
          name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, slug: 'weddings',
          photos: [
            { id: 'w1', url: 'https://cdn.test/w1.jpg', cover: true },
            { id: 'w2', url: 'https://cdn.test/w2.jpg' },
          ],
        },
        {
          name: 'Portraits', kind: 'category', price: { mode: 'on-request' }, slug: 'portraits',
          photos: [{ id: 'p1', url: 'https://cdn.test/p1.jpg' }],
        },
      ],
    },
  };
}

/** Pointer-drag helper — @dnd-kit PointerSensor (distance:4) needs a real
 *  down → past-threshold move → target move → up sequence. */
async function pointerDrag(page: Page, source: Locator, target: Locator) {
  const s = await source.boundingBox();
  const t = await target.boundingBox();
  if (!s || !t) throw new Error('drag source/target has no bounding box');
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.mouse.down();
  // Cross the 4px activation threshold, then travel to the target in steps.
  await page.mouse.move(s.x + s.width / 2 + 8, s.y + s.height / 2 + 8, { steps: 5 });
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 12 });
  await page.mouse.move(t.x + t.width / 2 + 1, t.y + t.height / 2 + 1, { steps: 3 });
  await page.mouse.up();
}

/** Run `action`, then await the board's PUT commit resolving 200. */
async function commitAnd(page: Page, action: () => Promise<void>) {
  const put = page.waitForResponse(
    (r) => r.url().includes(WORK_LIB) && r.request().method() === 'PUT',
    { timeout: 30_000 }
  );
  await action();
  const res = await put;
  expect(res.status(), `PUT ${WORK_LIB} -> ${res.status()}`).toBe(200);
}

test('Your work board — full CRUD round-trip persists across reload', async ({ page }) => {
  // 1. Fresh Clerk session cookie, then seed via the real authed route.
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  const api = page.request;

  const seedRes = await api.post('/api/saveDraft', {
    data: {
      tokenId: TOKEN,
      title: 'Kundius (e2e)',
      templateId: 'atelier2',
      finalContent: seedFinalContent(),
      brief: { facts: seedFacts() },
    },
  });
  expect(seedRes.ok(), `saveDraft seed -> ${seedRes.status()}`).toBeTruthy();

  // Sanity: the board API returns the two seeded groups for this works project.
  const getRes = await api.get(`${WORK_LIB}?tokenId=${TOKEN}`);
  expect(getRes.ok(), `GET ${WORK_LIB} -> ${getRes.status()}`).toBeTruthy();
  const loaded = await getRes.json();
  expect(loaded.groups.map((g: any) => g.name)).toEqual(['Weddings', 'Portraits']);

  // 2. Open the board.
  await page.goto(`/dashboard/${TOKEN}/work`);
  const board = page.getByTestId('correction-board');
  await expect(board).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('correction-group-name-0')).toHaveText(/Weddings/);
  await expect(page.getByTestId('correction-group-name-1')).toHaveText(/Portraits/);

  // 3. RENAME group 0: Weddings → Wedding Films.
  await commitAnd(page, async () => {
    await page.getByTestId('correction-group-name-0').click();
    const input = page.getByTestId('correction-rename-input-0');
    await input.fill('Wedding Films');
    await input.press('Enter');
  });
  await expect(page.getByTestId('correction-group-name-0')).toHaveText(/Wedding Films/);

  // 4. HIDE photo w2 (group 0, index 1): it dims (opacity 0.4) + Restore appears.
  const w2Thumb = page.getByTestId('correction-photo-0-1');
  await commitAnd(page, async () => {
    await page.getByTestId('correction-hide-0-1').click();
  });
  await expect(page.getByTestId('correction-restore-0-1')).toBeVisible();
  await expect(w2Thumb).toHaveCSS('opacity', '0.4');
  // The hide button is gone while hidden (Restore replaces it).
  await expect(page.getByTestId('correction-hide-0-1')).toHaveCount(0);

  // 5. RESTORE w2: back to full opacity, hide button returns.
  await commitAnd(page, async () => {
    await page.getByTestId('correction-restore-0-1').click();
  });
  await expect(page.getByTestId('correction-hide-0-1')).toBeVisible();
  await expect(w2Thumb).toHaveCSS('opacity', '1');

  // 6. MOVE p1 from Portraits (group 1) into Wedding Films (group 0).
  const p1Source = page.locator('[data-testid="correction-group-1"] [data-photo-url="https://cdn.test/p1.jpg"]');
  await expect(p1Source).toBeVisible();
  await commitAnd(page, async () => {
    await pointerDrag(page, p1Source, page.getByTestId('correction-group-0'));
  });
  // Group 0 now carries p1; group 1 is empty.
  await expect(
    page.locator('[data-testid="correction-group-0"] [data-photo-url="https://cdn.test/p1.jpg"]')
  ).toHaveCount(1);
  await expect(
    page.locator('[data-testid="correction-group-1"] [data-photo-url]')
  ).toHaveCount(0);

  // 7. REORDER within group 0: drag w1 (index 0) onto w2 (index 1) — order changes.
  await commitAnd(page, async () => {
    await pointerDrag(page, page.getByTestId('correction-photo-0-0'), page.getByTestId('correction-photo-0-1'));
  });
  // After the reorder the first thumb is no longer w1's url (w1 moved back).
  await expect(
    page.locator('[data-testid="correction-photo-0-0"]')
  ).not.toHaveAttribute('data-photo-url', 'https://cdn.test/w1.jpg');

  // 8. PICK COVER: make p1 the cover of group 0.
  const p1InGroup0 = page.locator('[data-testid="correction-group-0"] [data-photo-url="https://cdn.test/p1.jpg"]');
  const p1Index = await p1InGroup0.getAttribute('data-testid'); // correction-photo-0-N
  const idx = Number(p1Index!.split('-').pop());
  await commitAnd(page, async () => {
    await page.getByTestId(`correction-cover-0-${idx}`).click();
  });
  await expect(page.getByTestId(`correction-cover-badge-0-${idx}`)).toBeVisible();

  // ── 9. RELOAD → assert EVERYTHING persisted (the CRUD round-trip AC) ─────────
  await page.reload();
  await expect(page.getByTestId('correction-board')).toBeVisible({ timeout: 30_000 });

  // Rename persisted.
  await expect(page.getByTestId('correction-group-name-0')).toHaveText(/Wedding Films/);
  // Move persisted: p1 in group 0, group 1 empty.
  await expect(
    page.locator('[data-testid="correction-group-0"] [data-photo-url="https://cdn.test/p1.jpg"]')
  ).toHaveCount(1);
  await expect(
    page.locator('[data-testid="correction-group-1"] [data-photo-url]')
  ).toHaveCount(0);
  // Restore persisted: w2 present + visible (not dimmed) in group 0.
  const w2After = page.locator('[data-testid="correction-group-0"] [data-photo-url="https://cdn.test/w2.jpg"]');
  await expect(w2After).toHaveCount(1);
  await expect(w2After).toHaveCSS('opacity', '1');
  // Cover persisted: the p1 thumb in group 0 carries the Cover badge.
  const p1After = page.locator('[data-testid="correction-group-0"] [data-photo-url="https://cdn.test/p1.jpg"]');
  await expect(p1After.getByText('Cover')).toBeVisible();

  // Cross-check the persisted FACTS via the API: group 0 = Wedding Films with 3
  // photos incl. p1; group 1 = Portraits empty.
  const finalGet = await api.get(`${WORK_LIB}?tokenId=${TOKEN}`);
  const finalJson = await finalGet.json();
  const g0 = finalJson.groups[0];
  const g1 = finalJson.groups[1];
  expect(g0.name).toBe('Wedding Films');
  expect((g0.photos ?? []).map((p: any) => p.id).sort()).toEqual(['p1', 'w1', 'w2']);
  expect((g1.photos ?? []).length).toBe(0);
  // The picked cover is p1.
  expect((g0.photos ?? []).find((p: any) => p.cover)?.id).toBe('p1');
});
