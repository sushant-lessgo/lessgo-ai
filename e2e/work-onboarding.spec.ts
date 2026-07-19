import path from 'node:path';
import { test, expect } from '@playwright/test';
import {
  seedWorkBrief,
  startProject,
  loadDraft,
  seedRealFanoutAtelier2,
} from './helpers/seedWorkBrief';

/** EXIF fixtures: 2 photos on 2023-06-14, 2 on 2023-06-20 (⇒ two same-day clusters). */
const EXIF_CLUSTER_FILES = [
  'exif-day1-a.jpg',
  'exif-day1-b.jpg',
  'exif-day2-a.jpg',
  'exif-day2-b.jpg',
].map((f) => path.resolve('e2e/fixtures/images', f));

// ============================================================================
// The work onboarding journey — SEEDED-RESUME e2e (decision 9 / landmine 13).
//
// Mock mode CANNOT classify work, so every spec here SEEDS a confirmed work
// brief through the REAL serve gate and resumes the shell. The entry path is now
// the DECIDER (engineDecider phase 3): D1 → D2/D3 → D6 (which owns the confirm
// handoff the retired JourneyEntryStep used to). That entry — and the O1
// one-liner-once regression — is covered by e2e/engine-decider.spec.ts (real
// routing, /api/v2/understand route-intercepted) + D6Handoff.test.tsx (the
// confirm/serve/manual/enrichment unit gate) + P7 founder QA. Nothing here fakes
// entry; these specs resume post-confirm.
//
// Authed: the flow needs a Clerk session (registered in the `authed` project).
// Serial for the same reason as publish.spec.ts — one shared test user.
//
// P2b scope: dispatch + resume-mount + legacy-unchanged. The rail (P3), steps
// (P4), generation (P5) and reveal (P6) add their assertions to this file.
// ============================================================================

test.describe.configure({ mode: 'serial' });

/** Clerk's session JWT is ~60s — refresh it, then use `page.request`. */
async function authedApi(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, {
    timeout: 30_000,
  });
  return page.request;
}

/**
 * Satisfy the E3 required gate (D-D) from STEP 03: price + languages must be
 * answered before Continue un-blocks. price is the native `price` kind whose
 * default mode IS the on-request confirm posture (one tap = answer); languages
 * is a `choice` MULTI (tap English, then Save — not an immediate commit).
 * Call while STEP 03 (`step-questions`) is visible.
 */
async function answerRequiredQuestions(page: import('@playwright/test').Page) {
  // price — select on-request (the default confirm posture) and save.
  await page
    .getByTestId('question-price-mode-price')
    .getByRole('radio', { name: 'On request' })
    .click();
  await page.getByTestId('question-save-price').click();
  // languages — multi choice: tap English, then Save.
  await page.getByTestId('question-chip-languages-English').click();
  await page.getByTestId('question-save-languages').click();
}

test('served work brief resumes the JOURNEY shell at STEP 02 (not WizardShell)', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  // The serve gate stamps the project (landmine 3: saveDraft never writes
  // audienceType — /api/brief/confirm is the only writer).
  const draft = await loadDraft(api, token);
  // work is an ENGINE, never an audience: a served work brief is a
  // SERVICE-audience atelier project whose BRIEF carries copyEngine 'work'.
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');
  expect(draft.brief.copyEngine).toBe('work');

  await page.goto(`/onboarding/${token}`);

  // Load-detection → isJourneyEligible(work, atelier) → JourneyShell, mounted at
  // the resume step (02).
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // Dot progress is the journey's chrome signature.
  await expect(page.getByTestId('journey-dot-2')).toHaveAttribute('data-state', 'active');

  // NOT the legacy wizard.
  await expect(page.getByText('Basics', { exact: true })).toHaveCount(0);
});

// ⚠️ Scope narrowed in P5 (deliberate, not a weakening): this walk used to run
// 02 → 06 with the generic nav. STEP 05 is no longer a passive frame — mounting
// it DRIVES generation and then advances itself to 06 — so walking THROUGH it
// with the nav buttons would fan out a real generation and race its own
// assertions. Steps 05 → 06 are covered by the P5 generation spec below, which
// enters through STEP 04's "Build my site" CTA — the real door.
test('the journey step machine walks 02 → 04 and back', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  const next = page.getByTestId('journey-next');

  // 02 → 03.
  await next.click();
  await expect(page.getByTestId('step-questions')).toBeVisible();

  // ⚠️ The E3 required gate (D-D) now blocks Continue on STEP 03 until price +
  // languages are answered — so a naive Continue-through-03 stalls here. Answer
  // the required questions first. This is NOT scaffolding: it is the regression
  // that the gate EXISTS — `journey-next` is disabled below until both land, and
  // a silently-green walk would be gate theatre.
  await expect(next).toBeDisabled();
  await answerRequiredQuestions(page);
  await expect(next).toBeEnabled();

  // 03 → 04.
  await next.click();
  await expect(page.getByTestId('step-plan')).toBeVisible();

  // 02 is the floor.
  await page.getByTestId('journey-back').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await page.getByTestId('journey-back').click();
  await expect(page.getByTestId('step-show-work')).toBeVisible();
  await expect(page.getByTestId('journey-back')).toBeDisabled();
});

// ============================================================================
// P3 — the "What we understood" rail, over a REAL persisted project.
//
// These are the assertions unit tests structurally cannot make: that a rail
// belief actually reaches Postgres through /api/saveDraft's brief merge, and
// that it does so WITHOUT dropping `facts.entry` (landmine 4) or breaking the
// group `kind` invariant that STEP-05 generation depends on (landmine 6).
// ============================================================================

test('the rail projects the seeded brief and its edits SURVIVE a reload', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('understood-rail')).toBeVisible({ timeout: 30_000 });

  // Projected from the seeded facts.work — not typed in by this test.
  await expect(page.getByTestId('rail-value-name')).toHaveText('Kundius Studio');
  await expect(page.getByTestId('rail-value-descriptor')).toHaveText(
    'Documentary wedding photography'
  );
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Wedding day coverage');
  await expect(page.getByTestId('rail-chip-g1')).toHaveText('Engagement session');

  // ── Edit #1: NAME ────────────────────────────────────────────────────────
  await page.getByTestId('rail-edit-name').click();
  await page.getByTestId('rail-input-name').fill('Kundius Photography');
  await page.getByTestId('rail-save-name').click();
  await expect(page.getByTestId('rail-value-name')).toHaveText('Kundius Photography');

  // ── Edit #2, immediately after: DESCRIPTOR (lost-update guard) ────────────
  // Edit #2 re-emits the FULL bag from the snapshot edit #1 wrote. If commitRail
  // did not sync briefFacts in the same `set` as the save, this would re-emit
  // stale facts and silently revert edit #1.
  await page.getByTestId('rail-edit-descriptor').click();
  await page.getByTestId('rail-input-descriptor').fill('Wedding & portrait photographer');
  await page.getByTestId('rail-save-descriptor').click();
  await expect(page.getByTestId('rail-value-descriptor')).toHaveText(
    'Wedding & portrait photographer'
  );

  // ── Edit #3: RENAME a group chip (the id-join, end to end) ────────────────
  await page.getByTestId('rail-edit-groups').click();
  await page.getByTestId('rail-chip-input-0').fill('Wedding days');
  await page.getByTestId('rail-chips-save').click();
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Wedding days');

  // ── Note ─────────────────────────────────────────────────────────────────
  await page.getByTestId('rail-note-input').fill('The prices are wrong');
  await page.getByTestId('rail-note-submit').click();
  await expect(page.getByTestId('rail-note-input')).toHaveValue('', { timeout: 10_000 });

  // ── The real assertion: it is in the DB, and nothing else was dropped ─────
  const draft = await loadDraft(api, token);
  const work = draft.brief.facts.work;
  expect(work.identity.name).toBe('Kundius Photography');
  expect(work.identity.descriptor).toBe('Wedding & portrait photographer'); // BOTH edits
  expect(work.groups.map((g: { name: string }) => g.name)).toEqual([
    'Wedding days',
    'Engagement session',
  ]);
  // The renamed group is still kind-valid — a kind-less group nulls
  // getWorkFacts and dead-ends STEP 05 with an unrecoverable 400.
  for (const g of work.groups) expect(g.kind).toBe('category');
  expect(work.userNotes).toEqual(['The prices are wrong']);

  // Sibling facts survived every full-facts re-emit (landmine 4).
  expect(draft.brief.facts.entry.businessName).toBe('Kundius Studio');
  // And the serve-gate stamps are untouched by rail writes (landmine 3).
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');
  expect(draft.brief.copyEngine).toBe('work');

  // Reload: the rail re-projects from the DB, not from client memory.
  await page.reload();
  await expect(page.getByTestId('rail-value-name')).toHaveText('Kundius Photography', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Wedding days');
});

// ============================================================================
// P4 — the THIN steps 02 → 04, over a REAL persisted project.
//
// What only e2e can prove: a STEP 03 answer reaches Postgres through the rail
// adapter STILL `kind`-valid (landmine 6 — a `kind`-less group nulls
// `getWorkFacts`, 400s the work strategy, and PERSISTS, so a retry never
// recovers), and that STEP 04's plan seeding is idempotent across back-nav
// (landmine 8).
// ============================================================================

test('the journey walks 02 → 04: answers land in the rail and in the DB, kind-valid', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // ── 02: the functional show-work body (E2) + Skip ────────────────────────
  await expect(page.getByTestId('show-work-pick-files')).toBeVisible();
  await page.getByTestId('show-work-skip').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();

  // ── 03 ask-if: the seeded brief has a name AND groups, so neither is asked —
  // only the optional price.
  await expect(page.getByTestId('question-name')).toHaveCount(0);
  await expect(page.getByTestId('question-groups')).toHaveCount(0);
  await expect(page.getByTestId('question-price')).toBeVisible();

  // Empty the seeded groups from the RAIL, so the group question becomes real
  // (the fixture is deliberately well-seeded; this is how a sparse classify
  // lands). The question must then appear — ask-if is driven by the projection.
  await page.getByTestId('rail-edit-groups').click();
  await page.getByTestId('rail-chip-remove-1').click();
  await page.getByTestId('rail-chip-remove-0').click();
  await page.getByTestId('rail-chips-save').click();
  await expect(page.getByTestId('rail-field-groups')).toHaveAttribute('data-skeleton', 'true');

  await expect(page.getByTestId('question-groups')).toBeVisible();
  // E3: price is a REQUIRED question — it is asked from the start regardless of
  // groups (its commit simply refuses until something exists to price), so unlike
  // the E1 placeholder it does NOT disappear when groups are empty.
  await expect(page.getByTestId('question-price')).toBeVisible();

  // ── The answer: it appears IN THE RAIL (the journey's core promise) ───────
  await page.getByTestId('question-input-groups').fill('Newborn sessions');
  await page.getByTestId('question-save-groups').click();
  await expect(page.getByTestId('rail-chip-g0')).toHaveText('Newborn sessions');
  // …and the price question is still there, now with something to price.
  await expect(page.getByTestId('question-price')).toBeVisible();

  // Default is "On request" (always valid); "From" needs an amount — the Save
  // stays disabled without one, and the seam refuses it anyway.
  await page.getByTestId('question-price-mode-price').getByRole('radio', { name: 'From' }).click();
  await page.getByTestId('question-price-amount-price').fill('900');
  await page.getByTestId('question-save-price').click();

  // E3 required gate (D-D): languages is ALSO required — answer it (tap English,
  // Save) so Continue un-blocks for the STEP 04 advance below. Price is already
  // answered above.
  await page.getByTestId('question-chip-languages-English').click();
  await page.getByTestId('question-save-languages').click();

  // ── The real assertion: it is in the DB, and it is generation-valid ───────
  // Polled, not slept: the price answer has no rail field of its own to watch
  // (PRICE POSITION is a derived BAND, and it is already non-null from the
  // group answer's on-request default — asserting on it would pass before the
  // save landed).
  await expect
    .poll(async () => (await loadDraft(api, token)).brief.facts.work.groups[0].price.mode, {
      timeout: 15_000,
    })
    .toBe('from');

  const draft = await loadDraft(api, token);
  const groups = draft.brief.facts.work.groups;
  expect(groups.map((g: { name: string }) => g.name)).toEqual(['Newborn sessions']);
  // A question answer routed through the rail adapter is NEVER kind-less.
  expect(groups[0].kind).toBe('category');
  expect(groups[0].price).toEqual({ mode: 'from', amount: 900 });
  expect(draft.brief.facts.entry.businessName).toBe('Kundius Studio'); // landmine 4
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');

  // ── 04: the plan, seeded chargelessly ────────────────────────────────────
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();
  const cards = page.getByTestId('plan-items').getByRole('listitem');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  // Back-nav must not re-seed (landmine 8 — the guard lives in fetchStrategy).
  await page.getByTestId('journey-back').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();
  await expect(page.getByTestId('plan-items').getByRole('listitem')).toHaveCount(count);
});

// ============================================================================
// E2 STEP 02 — the FUNCTIONAL show-work body: loose-file upload → EXIF same-day
// clustering → commit into facts.work.groups[].photos, persisted.
//
// What only e2e can prove: real files POST through /api/upload-image, exifr reads
// their DateTimeOriginal in the browser, `proposeGroups` clusters them into TWO
// same-day groups, and the D10 commit funnel writes them into the rail (new chips)
// AND Postgres — surviving a reload. Folder→group is Vitest-only (Playwright can
// NOT fabricate `webkitRelativePath`); loose-file clustering is the e2e surface.
// ============================================================================

test('STEP 02 upload: EXIF same-day clusters surface as 2 rail groups + persist', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // ── P5 MediaAsset/blur API assert ─────────────────────────────────────────
  // The upload pipeline is what writes the MediaAsset row AND its blurDataUrl
  // (route.ts → recordMediaAssetBestEffort({ blurDataUrl })). The row is not
  // reachable via a public API here, so we assert the pipeline OUTPUT that the
  // row is built from: every /api/upload-image response carries a WebP blur
  // micro-thumb in its metadata. That blur is exactly what lands on the row and
  // what paints the correction-board thumbnails (the blur AC read).
  const uploadBlurs: (string | undefined)[] = [];
  page.on('response', async (res) => {
    if (!res.url().includes('/api/upload-image') || res.request().method() !== 'POST') return;
    try {
      const body = await res.json();
      uploadBlurs.push(body?.metadata?.blurDataUrl);
    } catch {
      /* non-JSON / failed upload — ignored; the count assert below is the gate */
    }
  });

  // The seeded brief already has 2 groups (g0, g1). Uploading 4 loose photos across
  // TWO capture days should append TWO new date-labelled groups (g2, g3).
  await page.locator('[data-testid="show-work-file-input"]').setInputFiles(EXIF_CLUSTER_FILES);

  // The proposal surfaces exactly two clusters…
  await expect(page.getByTestId('show-work-proposal')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('show-work-proposal-group')).toHaveCount(2);

  // …and every uploaded JPEG produced a WebP blur micro-thumb (⇒ the MediaAsset
  // row carries `blurDataUrl`). Poll: responses resolve asynchronously.
  await expect
    .poll(() => uploadBlurs.length, { timeout: 15_000 })
    .toBe(EXIF_CLUSTER_FILES.length);
  expect(uploadBlurs.every((b) => typeof b === 'string' && b.startsWith('data:image/webp'))).toBe(
    true
  );

  // …and the rail gains two chips as a consequence of the commit (progressive update).
  await expect(page.getByTestId('rail-chip-g2')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('rail-chip-g3')).toBeVisible();

  // The real assertion: it is in the DB, photo-bearing, and nothing was dropped.
  const draft = await loadDraft(api, token);
  const groups = draft.brief.facts.work.groups as Array<{
    name: string;
    kind: string;
    photos?: unknown[];
  }>;
  expect(groups.length).toBe(4);
  for (const g of groups) expect(g.kind).toBe('category'); // landmine 6 — never kind-less
  const photoBearing = groups.filter((g) => (g.photos ?? []).length > 0);
  expect(photoBearing.length).toBe(2); // the two uploaded clusters
  // 4 photos across the 2 new groups (2 per day).
  const totalPhotos = groups.reduce((n, g) => n + (g.photos?.length ?? 0), 0);
  expect(totalPhotos).toBe(4);
  // Sibling facts survived the full-facts re-emit (landmine 4).
  expect(draft.brief.facts.entry.businessName).toBe('Kundius Studio');

  // Reload: the rail re-projects the committed groups from Postgres.
  await page.reload();
  await expect(page.getByTestId('rail-chip-g3')).toBeVisible({ timeout: 30_000 });
});

// ============================================================================
// E2 P4 — the CORRECTION BOARD (5 tap verbs), over a REAL persisted project.
//
// The verb SEMANTICS are pinned deterministically in correctionReducer.test.ts
// (the gate of record). Here we prove the wiring: a tap in the board rebuilds the
// FULL group array and re-commits it through the D10 funnel into Postgres. We
// assert at the FACTS level (loadDraft) — deterministic and cheap — because the
// finalContent BINDING of those facts (covers → gallery cover_image, photos →
// /works item pages) is already the subject of the REAL-fanout atelier2 spec
// above; re-driving a full generation per verb here would only add rate-limit
// flake for coverage that spec already owns.
//
// Drag-between is BEST-EFFORT (Playwright dnd flakes under the serial runner);
// its transform is the reducer's `movePhoto` unit test — the gate of record.
// ============================================================================

test('STEP 02 correction board: rename / pick-cover / hide / merge persist to the DB', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // Upload 4 EXIF photos → two same-day clusters append as groups g2 + g3
  // (the seeded brief already carries g0 + g1, which have no photos).
  await page.locator('[data-testid="show-work-file-input"]').setInputFiles(EXIF_CLUSTER_FILES);
  await expect(page.getByTestId('correction-board')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('correction-group-3')).toBeVisible({ timeout: 30_000 });

  // ── RENAME (group 2) → the rail chip label updates + persists ──────────────
  await page.getByTestId('correction-group-name-2').click();
  await page.getByTestId('correction-rename-input-2').fill('Spring set');
  await page.getByTestId('correction-rename-input-2').press('Enter');
  await expect(page.getByTestId('rail-chip-g2')).toHaveText('Spring set', { timeout: 15_000 });
  await expect
    .poll(async () => (await loadDraft(api, token)).brief.facts.work.groups[2].name, {
      timeout: 15_000,
    })
    .toBe('Spring set');

  // ── PICK COVER (group 2, 2nd photo) → exclusive cover in facts ─────────────
  await page.getByTestId('correction-cover-2-1').click();
  await expect
    .poll(
      async () => {
        const photos = (await loadDraft(api, token)).brief.facts.work.groups[2].photos as Array<{
          cover?: boolean;
        }>;
        return photos.filter((p) => p.cover).length === 1 && photos[1]?.cover === true;
      },
      { timeout: 15_000 }
    )
    .toBe(true);

  // ── HIDE (group 3, 2nd photo) → that url is DROPPED from facts (D12) ────────
  const hiddenUrl = await page
    .getByTestId('correction-photo-3-1')
    .getAttribute('data-photo-url');
  expect(hiddenUrl).toBeTruthy();
  await page.getByTestId('correction-hide-3-1').click();
  await expect
    .poll(
      async () => {
        const photos = (await loadDraft(api, token)).brief.facts.work.groups[3].photos as Array<{
          url?: string;
        }>;
        return photos.length === 1 && !photos.some((p) => p.url === hiddenUrl);
      },
      { timeout: 15_000 }
    )
    .toBe(true);

  // ── MERGE (groups 2 + 3) → group count drops, photos conserved ─────────────
  const before = await loadDraft(api, token);
  const beforeGroups = before.brief.facts.work.groups as Array<{ photos?: unknown[] }>;
  const beforeCount = beforeGroups.length; // 4
  const beforePhotos = beforeGroups.reduce((n, g) => n + (g.photos?.length ?? 0), 0);

  await page.getByTestId('correction-select-2').check();
  await page.getByTestId('correction-select-3').check();
  await page.getByTestId('correction-merge').click();

  await expect
    .poll(async () => (await loadDraft(api, token)).brief.facts.work.groups.length, {
      timeout: 15_000,
    })
    .toBe(beforeCount - 1); // one group collapsed

  const after = await loadDraft(api, token);
  const afterGroups = after.brief.facts.work.groups as Array<{ kind: string; photos?: unknown[] }>;
  const afterPhotos = afterGroups.reduce((n, g) => n + (g.photos?.length ?? 0), 0);
  expect(afterPhotos).toBe(beforePhotos); // conserved (well under the 24 cap)
  for (const g of afterGroups) expect(g.kind).toBe('category'); // landmine 6
  expect(after.brief.facts.entry.businessName).toBe('Kundius Studio'); // landmine 4

  // ── DRAG-BETWEEN (best-effort; reducer test is the gate of record) ─────────
  // Playwright's synthetic dnd is flaky under @dnd-kit's PointerSensor in the
  // serial runner. We ATTEMPT the drag and, if it moves a photo, assert it; a
  // no-op is tolerated (NOT a silent skip — `movePhoto` is unit-covered).
  try {
    // Post-merge the photo-bearing group is at index 2; g1 (Engagement) is empty.
    const source = page.getByTestId('correction-photo-2-0');
    if (await source.count()) {
      await source.dragTo(page.getByTestId('correction-group-1'));
    }
  } catch {
    // tolerated — see the comment above.
  }
});

// ============================================================================
// E3 — STEP 03 questions (deterministic gating).
//
// The E1 STEP 03 placeholder (name / what-you-sell / one price) is replaced by
// the full gating step: a zero-AI resolver decides per slot whether we KNOW
// (skip), are almost sure (one-tap confirm) or DON'T know (ask), price +
// language are required to proceed, and every answer writes the frozen WorkFacts
// through the SAME `commitRail` door the rail uses. These are the deterministic
// assertions only — real-LLM copy quality of the branch (new vs established) is
// the founder's manual pass (plan Phase 5 human gate).
//
// The seeded Kundius fixture already carries name + 2 groups, so the resolver
// must NEVER ask them, and the ceiling (D-F) lands EXACTLY 5 candidates: price
// (ask, required) · establishment (ask) · dreamClient (confirm from
// entry.audiences) · contactMethod (confirm) · languages (ask, required).
// ============================================================================

test.describe('E3 — STEP 03 questions (deterministic gating)', () => {
  /** Seed a Kundius project and drive 02 → 03 (Skip the E1 upload stub). */
  async function openQuestions(page: import('@playwright/test').Page) {
    const api = await authedApi(page);
    const { token } = await seedWorkBrief(api);
    await page.goto(`/onboarding/${token}`);
    await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('show-work-skip').click();
    await expect(page.getByTestId('step-questions')).toBeVisible();
    return { api, token };
  }

  test('asks EXACTLY the 5 known gaps — never what the seed already knows', async ({ page }) => {
    await openQuestions(page);

    // The seed carries name + groups ⇒ they are NEVER asked ("never ask twice").
    await expect(page.getByTestId('question-name')).toHaveCount(0);
    await expect(page.getByTestId('question-groups')).toHaveCount(0);

    // Exactly the 5 gaps, and no more (the D-F ceiling). Counting the CARD
    // wrappers only — chips/inputs/save buttons are nested, not direct children.
    const cards = page.locator('[data-testid="step-questions"] > [data-testid^="question-"]');
    await expect(cards).toHaveCount(5);
    for (const id of ['price', 'establishment', 'dreamClient', 'contactMethod', 'languages']) {
      await expect(page.getByTestId(`question-${id}`)).toBeVisible();
    }
  });

  test('required gate + answers reach the rail & DB (siblings intact) + never ask twice on reload', async ({
    page,
  }) => {
    const { api, token } = await openQuestions(page);
    const next = page.getByTestId('journey-next');

    // ── AC 4: the required gate is CLOSED until price + languages are answered ─
    await expect(next).toBeDisabled();

    // ── establishment (single choice) — one tap commits; the rail row updates ─
    await page.getByTestId('question-chip-establishment-new').click();
    await expect(page.getByTestId('rail-value-establishment')).toHaveText('Just starting out');

    // ── dreamClient (MULTI choice) — tap the suggested chip, THEN Save ────────
    await page.getByTestId('question-chip-dreamClient-Couples getting married').click();
    await page.getByTestId('question-save-dreamClient').click();
    // The answered slot collapses to the compact "value — Change" posture (D-E),
    // NOT vanishing (correctable + keeps required slots reachable).
    await expect(page.getByTestId('question-change-dreamClient')).toBeVisible();

    // Neither answer un-blocked the gate — only price + languages are required.
    await expect(next).toBeDisabled();

    // ── Answer the two REQUIRED questions → the gate opens (AC 4) ─────────────
    await answerRequiredQuestions(page);
    await expect(next).toBeEnabled();

    // ── The real assertion: it is in the DB, through the REAL /api/saveDraft,
    // and the entry sibling survived every full-facts re-emit (landmine 4) ────
    const draft = await loadDraft(api, token);
    const work = draft.brief.facts.work;
    expect(work.establishment).toBe('new');
    expect(work.dreamClient).toBe('Couples getting married');
    expect(work.languages).toEqual(['English']);
    // price was answered on-request — persisted onto the groups, kind-valid.
    for (const g of work.groups) expect(g.kind).toBe('category');
    expect(draft.brief.facts.entry.businessName).toBe('Kundius Studio'); // landmine 4
    expect(draft.audienceType).toBe('service');
    expect(draft.templateId).toBe('atelier');
    expect(draft.brief.copyEngine).toBe('work');

    // ── D-C · "never ask twice / on-request degrades to one tap" across reload ─
    // A confirmed-but-ungenerated draft resumes at STEP 02, so re-skip to 03.
    // Session-answered ids are GONE (fresh mount), so the resolver re-derives
    // purely from persisted facts.
    await page.reload();
    await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('show-work-skip').click();
    await expect(page.getByTestId('step-questions')).toBeVisible();

    // Answered-from-facts slots are KNOWN now ⇒ never re-asked.
    await expect(page.getByTestId('question-establishment')).toHaveCount(0);
    await expect(page.getByTestId('question-dreamClient')).toHaveCount(0);
    await expect(page.getByTestId('question-languages')).toHaveCount(0);

    // price is the D-C edge: a genuine on-request answer is indistinguishable
    // from the seed default after the session resets, so it degrades to a ONE-TAP
    // confirm (the native price mode picker, on-request pre-selected) — NOT an
    // open free-text re-ask.
    await expect(page.getByTestId('question-price')).toBeVisible();
    const onRequest = page
      .getByTestId('question-price-mode-price')
      .getByRole('radio', { name: 'On request' });
    await expect(onRequest).toBeVisible();
    await expect(onRequest).toHaveAttribute('aria-checked', 'true');
    // The price kind has no free-text input in on-request mode — proving it is a
    // confirm posture, not an open ask.
    await expect(page.getByTestId('question-input-price')).toHaveCount(0);
  });
});

// ============================================================================
// P5 — STEP 05: generation, over a REAL project (mock LLM).
//
// This is the ONLY gate that catches the P5 trap. `resumeStep.test.ts`
// fabricates its `loaded` objects, so the `finalContent`-based resume rules go
// GREEN there whether or not anything actually PASSES `finalContent` — which
// nothing did until P5 widened /api/loadDraft → page.tsx → JourneyShell. The
// reload assertion below is the only thing standing between that chain and a
// silent "resumes at STEP 02 forever" regression.
//
// It also pins landmine 7: `finalizeMultiPageGeneration` DELETES
// `generationProgress`. If a future refactor drops finalize, the draft stays
// "resumable" and the reload lands on STEP 05, not 06 — this test fails loudly
// instead of the editor silently treating a finished site as mid-generation.
//
// The seeded fixture's persisted `kind`-valid `facts.work` is what makes work
// generation runnable at all here (preflight's second gate).
//
// ⚠️ THE RATE-LIMIT RETRY BELOW IS NOT TEST SCAFFOLDING — IT IS A REAL FINDING.
// A work multipage run is 1 strategy call + 1 copy call PER PAGE, back to back.
// atelier seeds FIVE default pages (`ATELIER_PAGE_ARCHETYPES`, all
// `defaultIncluded`) ⇒ SIX AI requests within seconds. `withAIRateLimit` allows
// FIVE per minute on the FREE tier (`TIER_RATE_LIMITS`, src/lib/rateLimit.ts) —
// so the last page 429s DETERMINISTICALLY for any free-tier user, not just here.
// It is recoverable (the driver persists per page and resumes on
// `completedPageKeys`; STEP 05 offers "Try again"), but the founder meets it on
// the very first pilot run. Fixing it means touching `rateLimit.ts` / the work
// routes — outside P5's Files-touched — so it is REPORTED, and this loop both
// keeps the gate honest and proves the resume path works. See the audit.
// ============================================================================

// ============================================================================
// P6 — STEP 06: the reveal → editor handoff.
//
// The reveal assertions are APPENDED to the P5 generation test rather than given
// their own spec, deliberately: reaching STEP 06 honestly costs a full work
// fan-out (1 strategy + 5 copy calls) AND, on the free tier, a 61s rate-limit
// wait (Bug A). A second spec would double that for zero extra coverage — the
// generation path is identical. So this ONE test is the full-journey gate:
// 02 → 06 → the real site in the iframe → the editor.
// ============================================================================

test('STEP 05 generates the site (mock), STEP 06 reveals it, and the editor opens', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await seedWorkBrief(api);

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // 02 → 03 → 04. The seed answers name + groups already, but the E3 required
  // gate (D-D) now blocks Continue until price + languages are answered — so
  // clear them before advancing (the same gate the E3 spec pins).
  await page.getByTestId('show-work-skip').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await answerRequiredQuestions(page);
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();

  // 04's CTA is the ONLY door into generation.
  await page.getByTestId('plan-build').click();
  await expect(page.getByTestId('step-building')).toBeVisible();

  // The flag is ON in webServer.env — so this is the REAL drive, not the
  // engine-disabled state (landmine 2's explicit error would be here instead).
  await expect(page.getByTestId('building-error-engine-disabled')).toHaveCount(0);
  await expect(page.getByTestId('building-stages')).toBeVisible();
  // NOT asserted here: the top bar's "Building…" slot. Mock generation finishes
  // in ~2s, so any assertion on an in-flight-only element is a RACE — it passed
  // and failed run to run. A test that flakes gets retried into meaninglessness;
  // the transient chrome is a founder-QA item (P7) instead. What IS asserted
  // below is that it's gone once we're done.

  // The free-tier AI rate limit bites on the 6th call (see the header). Retry
  // through it — ONLY for that specific error, and only while the drive is
  // making progress: any OTHER error must still fail this test loudly.
  for (let i = 0; i < 3; i++) {
    const settled = await Promise.race([
      page
        .getByTestId('step-reveal')
        .waitFor({ state: 'visible', timeout: 90_000 })
        .then(() => 'done' as const),
      page
        .getByTestId('building-error-error')
        .waitFor({ state: 'visible', timeout: 90_000 })
        .then(() => 'error' as const),
    ]);
    if (settled === 'done') break;
    const message = await page.getByTestId('step-building').innerText();
    expect(message, 'STEP 05 failed for a reason other than the AI rate limit').toMatch(
      /too many requests/i
    );
    // The window is 60s. The retry RESUMES (completedPageKeys skip) — it does
    // not re-generate the pages already persisted.
    await page.waitForTimeout(61_000);
    await page.getByTestId('building-retry').click();
  }

  // Success ⇒ journeyStep 6. NO router.push — the reveal owns forward motion,
  // so we must still be on /onboarding/{token}, not /edit/{token} (the
  // driver's own redirectTo is deliberately dropped by the seam).
  await expect(page.getByTestId('step-reveal')).toBeVisible({ timeout: 120_000 });
  expect(new URL(page.url()).pathname).toBe(`/onboarding/${token}`);
  await expect(page.getByTestId('journey-dot-6')).toHaveAttribute('data-state', 'active');
  await expect(page.getByTestId('topbar-building')).toHaveCount(0);

  // ── The DB: content exists AND the in-progress marker is gone ─────────────
  const draft = await loadDraft(api, token);
  expect(draft.finalContent, 'no finalContent — generation did not persist').toBeTruthy();
  expect(Object.keys(draft.finalContent.pages ?? {}).length).toBeGreaterThan(0);
  // Every planned page was written.
  //
  // ⚠️ TRIPWIRE — THIS ASSERTION IS EXPECTED TO FAIL WHEN BUG B IS FIXED. ⚠️
  // It only passes because of Bug B (see below + the audit): `generationProgress`
  // is SUPPOSED to be gone from the DB by now — `finalizeMultiPageGeneration`
  // deletes it — but the deletion never reaches Postgres, because /api/saveDraft
  // shallow-spreads the incoming finalContent over the stored one
  // (route.ts:194-199), so a client-side `delete` is merely an ABSENT key and the
  // stored value survives. We are therefore asserting on a stale marker.
  //
  // The day someone gives /api/saveDraft tombstone support, `generationProgress`
  // becomes undefined here ⇒ `?? []` ⇒ length 0 vs 5 ⇒ this line fails, and it
  // will look like a real regression to whoever is holding the saveDraft fix.
  // IT IS NOT. That failure is the FIX LANDING. When it happens, replace this
  // with the assertion it was always standing in for:
  //
  //     expect(draft.finalContent.generationProgress).toBeUndefined();
  //
  // Kept (not deleted) meanwhile because it is the only thing pinning "every
  // planned page was written" — and it is a useful canary for the saveDraft fix.
  expect(draft.finalContent.generationProgress?.completedPageKeys ?? []).toHaveLength(
    Object.keys(draft.finalContent.pages).length
  );

  // ⚠️ NOT ASSERTED (REPORTED INSTEAD — see the audit): that the in-progress
  // marker is GONE from the DB. It isn't, and NOT because finalize was skipped —
  // `runWorkLLMGeneration` does call `finalizeMultiPageGeneration`, which
  // `delete`s `fc.generationProgress`. The deletion cannot REACH Postgres:
  // `/api/saveDraft` shallow-SPREADS the incoming finalContent over the stored
  // one (`{...existingContent.finalContent, ...finalContent}`, route.ts:194-199),
  // so a key deleted client-side survives from the earlier per-page save.
  // It predates this phase — every multi-page LLM run (thing included) is
  // affected. Fixing it means touching `/api/saveDraft` (or having the driver
  // send an explicit tombstone), both outside this feature's Files-touched.
  //
  // ⟳ SEVERITY CORRECTED DOWN (P6 review — P5's wording overstated it).
  // Landmine 7's stated symptom, "the editor treats a finished site as
  // mid-generation", is NOT what happens: NO editor code reads
  // `generationProgress` (only `isResumableGeneration`, the work/thing
  // skip-loops, `resumeStep.ts`, and `editDelta/capture.ts:98`, where it is
  // explicitly skip-listed). The real consequence is the brief STEP-05 flash on
  // reload asserted below, which re-drives CHARGELESSLY (every page is already
  // in `completedPageKeys` ⇒ 0 AI calls ⇒ re-finalize ⇒ 06), plus permanent junk
  // in the stored finalContent. Cosmetic + wasteful — NOT a handoff break.

  // The stamps are untouched by the whole run (landmine 3).
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier');
  expect(draft.brief.copyEngine).toBe('work');

  // ── THE PLUMBING ASSERTION (the P5 trap) ─────────────────────────────────
  // A reload re-runs load-detection → resolveResumeStep(loaded). Reaching the
  // REVEAL proves `finalContent` actually reaches the seam: if page.tsx or
  // JourneyShell ever stops forwarding it, `loaded.finalContent` is undefined,
  // the rule returns 2, and this sits on STEP 02 forever — with every unit test
  // in resumeStep.test.ts still green (it fabricates its input). This assertion
  // is the ONLY thing guarding that chain.
  //
  // NB it does not assert "resumes DIRECTLY at 06": because of the stale
  // in-progress marker above, `isResumableGeneration` is still true, so the
  // draft resumes at STEP 05 first and re-drives — the fan-out finds every page
  // already in `completedPageKeys`, skips them all, re-finalizes and advances to
  // 06. Self-healing and chargeless, but wasted work; it disappears the moment
  // the saveDraft merge bug is fixed. Asserting the destination (not the route)
  // keeps this test true both before and after that fix.
  await page.reload();
  await expect(page.getByTestId('step-reveal')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId('step-show-work')).toHaveCount(0);

  // ── P6: THE REVEAL ───────────────────────────────────────────────────────
  // The site renders in an IFRAME — a separate document — which is the entire
  // mechanism that keeps the journey's `.app-chrome` from becoming an ancestor
  // of template output (landmine 1). Asserting through frameLocator is itself
  // part of the point: if someone ever "simplifies" this into an inline render,
  // there is no frame to locate and these assertions die loudly.
  const frame = page.frameLocator('[data-testid="reveal-frame"]');

  // The chromeless preview mounted...
  await expect(frame.getByTestId('preview-chromeless')).toBeVisible({ timeout: 60_000 });

  // ...and it is the REAL generated site, not an empty shell: template blocks
  // emit token attributes (same proof render.spec.ts uses). Mock copy still
  // renders through the real atelier template.
  await expect(
    frame.locator('[data-surface], [data-palette], [data-variant]').first()
  ).toBeVisible({ timeout: 60_000 });

  // ── NO PUBLISH SURFACE — absent from the DOM, not merely hidden ───────────
  // The reveal IS the review; the only way forward is the editor. `toHaveCount(0)`
  // (not `not.toBeVisible()`) is the assertion the plan pins: a hidden-but-present
  // Publish button would pass visibility checks and still be one CSS change from
  // shipping a publish action into the magic moment.
  await expect(frame.getByRole('button', { name: 'Publish' })).toHaveCount(0);
  await expect(frame.getByRole('button', { name: 'Custom Domain' })).toHaveCount(0);
  await expect(frame.getByRole('button', { name: 'Back to Edit' })).toHaveCount(0);
  await expect(frame.getByText('Preview from edit mode')).toHaveCount(0);

  // Nor is there a publish control in the SHELL around the iframe.
  await expect(page.getByRole('button', { name: 'Publish' })).toHaveCount(0);

  // Site content lives ONLY inside the iframe: the shell's own document must
  // carry no template output (the landmine-1 tripwire, from the outside).
  await expect(page.locator('[data-surface], [data-palette], [data-variant]')).toHaveCount(0);

  // Phone toggle constrains the frame; desktop is the default.
  await page.getByTestId('reveal-viewport').getByRole('radio', { name: 'Phone' }).click();
  await expect(page.getByTestId('reveal-frame')).toHaveAttribute('style', /width:\s*390px/);

  // ── The handoff: the one forward path ────────────────────────────────────
  await page.getByTestId('reveal-open-editor').click();
  await page.waitForURL(`**/edit/${token}`, { timeout: 60_000 });

  // The editor loads the generated site (template output present = it rendered,
  // not an empty canvas). Here it IS in the page document — the editor is not
  // under `.app-chrome`, which is exactly why the reveal needed the iframe.
  await expect(
    page.locator('[data-surface], [data-palette], [data-variant]').first()
  ).toBeVisible({ timeout: 60_000 });

  // The stamps survive the whole journey, end to end (landmine 3).
  const afterEdit = await loadDraft(api, token);
  expect(afterEdit.audienceType).toBe('service');
  expect(afterEdit.templateId).toBe('atelier');
  expect(afterEdit.brief.copyEngine).toBe('work');
});

// ============================================================================
// P2 (work-onboarding-ingestion E2) — the REAL fan-out path on atelier2.
//
// The prior STEP-05 test proves generation on ATELIER (no `works` capability ⇒ the
// fan-out is dormant). THIS test proves the E2 promise on the works-FLIPPED
// atelier2 skeleton pilot: a photo-bearing brief, driven through the SAME STEP-05
// door, produces `/works/<slug>` item pages carrying the user's VERBATIM photos AND
// stamps those photos as the home gallery's covers — all pure code (mock copy is
// enough; the binding is deterministic).
//
// Same free-tier rate-limit reality as the atelier STEP-05 test (1 strategy + N
// copy calls); the retry loop is a real finding, not scaffolding (see that test).
//
// ⚠️ KNOWN LIMITATION (reported, not hidden): the `/works/<slug>` DETAIL page's
// in-editor/preview RENDER is blocked until the two collection layouts register in
// the layout schema aggregator (`src/modules/audience/work/elementSchema.ts`, out
// of this phase's scope — see the audit Blockers). The fan-out DATA (item pages +
// verbatim photos) and the schema-backed HOME gallery covers are unaffected, so
// this test asserts exactly those two.
// ============================================================================
test('REAL fan-out on atelier2: STEP 05 binds group photos → /works pages + home covers', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token, coverUrls, workSlugs } = await seedRealFanoutAtelier2(api);

  // The flip persisted: the journey resolves onto the works-flipped skeleton pilot.
  const seeded = await loadDraft(api, token);
  expect(seeded.templateId).toBe('atelier2');
  expect(seeded.brief.copyEngine).toBe('work');

  await page.goto(`/onboarding/${token}`);
  await expect(page.getByTestId('step-show-work')).toBeVisible({ timeout: 30_000 });

  // 02 → 03 → 04 → generation (the fixture answers 03's ask-ifs; price is optional).
  await page.getByTestId('show-work-skip').click();
  await expect(page.getByTestId('step-questions')).toBeVisible();
  await page.getByTestId('journey-next').click();
  await expect(page.getByTestId('step-plan')).toBeVisible();
  await page.getByTestId('plan-build').click();
  await expect(page.getByTestId('step-building')).toBeVisible();
  await expect(page.getByTestId('building-error-engine-disabled')).toHaveCount(0);

  // Retry through the free-tier AI rate limit ONLY (any other error fails loudly).
  for (let i = 0; i < 3; i++) {
    const settled = await Promise.race([
      page.getByTestId('step-reveal').waitFor({ state: 'visible', timeout: 90_000 }).then(() => 'done' as const),
      page.getByTestId('building-error-error').waitFor({ state: 'visible', timeout: 90_000 }).then(() => 'error' as const),
    ]);
    if (settled === 'done') break;
    const message = await page.getByTestId('step-building').innerText();
    expect(message, 'STEP 05 failed for a reason other than the AI rate limit').toMatch(/too many requests/i);
    await page.waitForTimeout(61_000);
    await page.getByTestId('building-retry').click();
  }

  await expect(page.getByTestId('step-reveal')).toBeVisible({ timeout: 120_000 });

  // ── DATA: the fan-out wrote a `/works/<slug>` item page per group, carrying the
  //         seeded photos VERBATIM (pure code — no AI clobber). ─────────────────
  const draft = await loadDraft(api, token);
  const pages = draft.finalContent.pages ?? {};
  for (let i = 0; i < workSlugs.length; i++) {
    const slug = workSlugs[i];
    const pageKey = `page-${slug}`;
    expect(pages[pageKey], `missing /works/${slug} item page`).toBeTruthy();
    expect(pages[pageKey].pathSlug).toBe(`/works/${slug}`);
    // The group's cover photo url reached its item page (shape-tolerant substring).
    expect(
      JSON.stringify(pages[pageKey]),
      `item page /works/${slug} missing its seeded cover photo`
    ).toContain(coverUrls[i]);
  }

  // ── REVEAL: the home gallery paints the seeded covers (schema-backed surface). ─
  const frame = page.frameLocator('[data-testid="reveal-frame"]');
  await expect(frame.getByTestId('preview-chromeless')).toBeVisible({ timeout: 60_000 });
  for (const url of coverUrls) {
    await expect(frame.locator(`img[src="${url}"]`).first()).toBeVisible({ timeout: 30_000 });
  }

  // The serve stamps are untouched by the run except the intended atelier2 flip.
  expect(draft.audienceType).toBe('service');
  expect(draft.templateId).toBe('atelier2');
});

test('legacy unchanged: a non-seam brief still reaches the entry card / WizardShell', async ({
  page,
}) => {
  const api = await authedApi(page);
  const token = await startProject(api);

  // A TRUST brief (agency) — no journey seam ⇒ the dispatch must not touch it.
  const res = await api.post('/api/brief/confirm', {
    data: {
      tokenId: token,
      brief: {
        businessType: 'agency',
        copyEngine: 'trust',
        facts: {
          entry: {
            rawInput: 'a six-week brand studio for DTC founders',
            resolvedEngine: 'trust',
            classificationSource: 'lookup',
            tiebreaker: 'none',
            platformNeeds: 'none',
            summary: 'Brand identity studio',
            businessName: 'Studio Six',
            offerings: ['Brand identity'],
            audiences: ['DTC founders'],
            categories: ['branding'],
            outcomes: [],
            deliveryModel: 'remote',
            offer: 'Book a call',
            oneLiner: 'A six-week brand studio for DTC founders.',
            testimonials: [],
          },
        },
        structure: { mode: 'single', pages: [] },
        confidence: 0.9,
      },
    },
  });
  expect(res.ok(), `/api/brief/confirm: ${res.status()}`).toBeTruthy();
  expect((await res.json()).outcome).toBe('serve');

  await page.goto(`/onboarding/${token}`);

  // The unified wizard, exactly as before — no journey chrome anywhere.
  await expect(page.getByText('Basics', { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId('journey-dot-2')).toHaveCount(0);
  await expect(page.getByTestId('step-show-work')).toHaveCount(0);
});
