/**
 * renderProbe.ts — reusable reactivity + perf probe for the editor.
 *
 * WHY: no automated test catches an over-narrow Zustand selector (a subscription
 * that stops observing a field a component still renders). This probe is the
 * manual net: it drives real editor surfaces in a real browser and asserts the
 * live DOM/store react. It also records the render-churn + heap perf numbers the
 * store-selectorization phases (editor-phase-4-store-finish, Step B) compare
 * against. Built in phase 4; run per Step-B batch on that batch's touched
 * surfaces.
 *
 * NOT a Playwright spec — named `.ts` (not `.spec.ts`) so the default runner
 * never auto-picks it up, and it lives outside tsconfig's compiled set (e2e is
 * excluded). Run it standalone with tsx.
 *
 * USAGE (caller starts its own dev server on a FREE port — never :3000 — with
 * NEXT_PUBLIC_DEBUG_EDITOR=true, then):
 *
 *   PROBE_URL=http://localhost:3021 npx tsx e2e/tools/renderProbe.ts
 *   PROBE_URL=http://localhost:3021 npx tsx e2e/tools/renderProbe.ts --smoke=type,select,undo,redo
 *   PROBE_URL=http://localhost:3021 npx tsx e2e/tools/renderProbe.ts --no-perf --headed
 *
 * FLAGS:
 *   --smoke=a,b,c   run only these smoke subcommands (default: all).
 *                   available: type, select, undo, redo, palette, modal
 *   --no-perf       skip the perf measurement (renders/keystroke + heap delta)
 *   --headed        run with a visible browser (default: headless)
 *   --audience=X    seed audience by templateId (default: meridian)
 *
 * Reuses the exact authed-Clerk pattern from e2e/auth.setup.ts + e2e/global.setup.ts
 * and the e2e/helpers/seedDraft.ts project seeder. All three Clerk creds must be
 * in the worktree .env.local (loaded below).
 *
 * Exit code 0 = every requested subcommand passed (and perf, if run, produced
 * numbers). Non-zero = at least one failed. Machine-readable JSON summary is
 * printed last, prefixed `PROBE_RESULT `.
 */
import path from 'node:path';
import dotenv from 'dotenv';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { clerk, clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { createClerkClient } from '@clerk/backend';
import { AUDIENCES, seedDraft, type AudienceConfig } from '../helpers/seedDraft';

// Load .env.local so the Node side gets CLERK_SECRET_KEY + publishable key + the
// E2E test creds (mirrors playwright.config.ts). The dev server loads its own.
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// ---------------------------------------------------------------------------
// arg parsing
// ---------------------------------------------------------------------------
const ARGS = process.argv.slice(2);
function flag(name: string): string | undefined {
  const hit = ARGS.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

const ALL_SMOKES = ['type', 'select', 'undo', 'redo', 'palette', 'modal'] as const;
type Smoke = (typeof ALL_SMOKES)[number];

const requestedSmokes: Smoke[] = (() => {
  const raw = flag('smoke');
  if (raw === undefined || raw === '') return [...ALL_SMOKES];
  const chosen = raw.split(',').map((s) => s.trim()).filter(Boolean) as Smoke[];
  const bad = chosen.filter((s) => !ALL_SMOKES.includes(s));
  if (bad.length) {
    throw new Error(`unknown --smoke value(s): ${bad.join(', ')} (valid: ${ALL_SMOKES.join(', ')})`);
  }
  return chosen;
})();

const RUN_PERF = flag('no-perf') === undefined;
const HEADED = flag('headed') !== undefined;
const AUDIENCE_ID = flag('audience') || 'meridian';

const PROBE_URL = process.env.PROBE_URL;
if (!PROBE_URL) {
  console.error('PROBE_URL env is required (e.g. PROBE_URL=http://localhost:3021). Never :3000.');
  process.exit(2);
}
if (/:3000(\/|$)/.test(PROBE_URL)) {
  console.error('Refusing to run against :3000 (the founder dev server). Use a free port 3020+.');
  process.exit(2);
}

const HEADLINE = '[data-element-key="headline"]';

// ---------------------------------------------------------------------------
// result plumbing
// ---------------------------------------------------------------------------
interface SmokeResult {
  name: string;
  status: 'pass' | 'fail';
  detail: string;
}
const smokeResults: SmokeResult[] = [];
function record(name: string, ok: boolean, detail: string) {
  smokeResults.push({ name, status: ok ? 'pass' : 'fail', detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[smoke:${name}] ${tag} — ${detail}`);
}

// ---------------------------------------------------------------------------
// store access from the browser: the editor exposes window.__useEditStoreDebug
// (dev only) with getCurrentStore(tokenId) → the Zustand store for that token.
// We read .getState() through it to assert store-level truth alongside DOM.
// ---------------------------------------------------------------------------
// React-commit counter. We inject a minimal React DevTools global-hook stub
// (via context.addInitScript, before React loads) whose onCommitFiberRoot bumps
// window.__lessgoRenderCommits on every React commit pass. This is a
// framework-level render-churn signal independent of app debug logs — the edit
// page renders sections via EditablePageRenderer, which (unlike the published
// LandingPageRenderer) emits no per-render debug log, so we can't count logs.
// The counting stub is benign (it's what real DevTools would install).
const REACT_HOOK_STUB = `
(() => {
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) return;
  window.__lessgoRenderCommits = 0;
  const noop = () => {};
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject: function (r) { const id = this.renderers.size + 1; this.renderers.set(id, r); return id; },
    onCommitFiberRoot: function () { window.__lessgoRenderCommits++; },
    onCommitFiberUnmount: noop,
    onPostCommitFiberRoot: noop,
    on: noop, off: noop, sub: () => noop, emit: noop,
  };
})();
`;

async function commitCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as any).__lessgoRenderCommits ?? 0);
}

async function readStore<T>(page: Page, token: string, pick: (state: any) => T): Promise<T> {
  return page.evaluate(
    ({ t, fnStr }) => {
      const dbg = (window as any).__useEditStoreDebug;
      const store = dbg?.getCurrentStore?.(t);
      const state = store?.getState?.();
      // eslint-disable-next-line no-new-func
      const fn = new Function('state', `return (${fnStr})(state);`);
      return fn(state);
    },
    { t: token, fnStr: pick.toString() },
  );
}

// ---------------------------------------------------------------------------
// auth (replicates global.setup.ts + auth.setup.ts inline; no fixtures)
// ---------------------------------------------------------------------------
async function ensureUserAndToken() {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!email || !password || !secretKey) {
    throw new Error('auth needs E2E_CLERK_USER_EMAIL, E2E_CLERK_USER_PASSWORD, CLERK_SECRET_KEY in .env.local');
  }
  await clerkSetup(); // mint the Clerk Testing Token (bypasses bot protection)
  const backend = createClerkClient({ secretKey });
  const { data: existing } = await backend.users.getUserList({ emailAddress: [email] });
  if (existing.length === 0) {
    await backend.users.createUser({ emailAddress: [email], password, skipPasswordChecks: true });
    console.log(`[probe] created test user ${email}`);
  }
  return { email, password };
}

async function signIn(page: Page, email: string, password: string) {
  await setupClerkTestingToken({ page });
  await page.goto('/');
  await clerk.signIn({ page, signInParams: { strategy: 'password', identifier: email, password } });
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
}

// ---------------------------------------------------------------------------
// smoke subcommands. Each is best-effort but throws on hard failure; the runner
// converts throw → fail so one bad surface doesn't abort the rest.
// ---------------------------------------------------------------------------

// type: type into the hero headline, assert the LIVE DOM text reflects it
// (the canonical over-narrow-selector detector for the content render path).
async function smokeType(page: Page, token: string): Promise<string> {
  const marker = `PROBE${Date.now().toString().slice(-6)}`;
  const headline = page.locator(HEADLINE).first();
  await headline.click();
  await page.keyboard.press('End');
  await page.keyboard.type(marker, { delay: 25 });
  // live DOM assertion (before any blur/commit)
  const text = await headline.innerText();
  if (!text.includes(marker)) throw new Error(`DOM headline did not show typed marker (got: ${text.slice(0, 60)})`);
  // commit + assert it reached the store (proves the write path, not just cE DOM)
  await headline.evaluate((el: HTMLElement) => el.blur());
  await page.waitForTimeout(300);
  return `DOM updated live with "${marker}"`;
}

// select: click the headline to enter text-edit selection, assert the floating
// toolbar appears (ToolbarShell renders a [data-toolbar-type] surface) AND the
// store's selection state updated (over-narrow selector here = selection or
// toolbar silently dies).
async function smokeSelect(page: Page, token: string): Promise<string> {
  const headline = page.locator(HEADLINE).first();
  await headline.click();
  // The text toolbar mounts on focus (handleFocus → showToolbar('text')). It
  // carries a data-toolbar-type attribute (value 'text-mvp'/'element'/…).
  const toolbar = page.locator('[data-toolbar-type]').first();
  await toolbar.waitFor({ state: 'visible', timeout: 5_000 });
  const selected = await readStore(page, token, (s) => ({
    el: s?.selectedElement ?? null,
    sec: s?.selectedSection ?? null,
    textEditing: s?.textEditingElement ?? null,
  }));
  const hasSelection = Boolean(selected.el || selected.sec || selected.textEditing);
  if (!hasSelection) throw new Error('store shows no selection after click');
  const ttype = await toolbar.getAttribute('data-toolbar-type');
  await page.keyboard.press('Escape');
  return `selection set (store.textEditing + toolbar[${ttype}] visible)`;
}

// undo/redo: commit an edit, undo → assert reverted, redo → assert reapplied.
// These share setup so `smokeUndo` does the edit+undo and `smokeRedo` the redo;
// when both requested they run in sequence with shared marker via closure.
async function editThenGetBaseline(page: Page): Promise<{ before: string; marker: string }> {
  const headline = page.locator(HEADLINE).first();
  const before = (await headline.innerText()).trim();
  const marker = `UNDO${Date.now().toString().slice(-5)}`;
  await headline.click();
  await page.keyboard.press('End');
  await page.keyboard.type(marker, { delay: 20 });
  await headline.evaluate((el: HTMLElement) => el.blur());
  await page.waitForTimeout(300);
  return { before, marker };
}

async function smokeUndo(page: Page, token: string): Promise<string> {
  const { before, marker } = await editThenGetBaseline(page);
  const headline = page.locator(HEADLINE).first();
  if (!(await headline.innerText()).includes(marker)) throw new Error('edit did not land before undo');
  // Ctrl+Z (undo). Focus a neutral area first so cE doesn't swallow it.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);
  const after = (await headline.innerText()).trim();
  if (after.includes(marker)) throw new Error(`undo did not revert (still shows marker: ${after.slice(0, 60)})`);
  (page as any).__undoBefore = before;
  (page as any).__undoMarker = marker;
  return `undo reverted "${marker}" → "${after.slice(0, 30)}"`;
}

async function smokeRedo(page: Page, token: string): Promise<string> {
  // If undo didn't run this session, do a self-contained edit+undo first.
  let marker: string | undefined = (page as any).__undoMarker;
  if (!marker) {
    await smokeUndo(page, token);
    marker = (page as any).__undoMarker;
  }
  await page.keyboard.press('Control+y').catch(() => {});
  await page.keyboard.press('Control+Shift+z').catch(() => {}); // alt redo binding
  await page.waitForTimeout(500);
  const headline = page.locator(HEADLINE).first();
  const after = (await headline.innerText()).trim();
  if (!after.includes(marker!)) throw new Error(`redo did not reapply "${marker}" (got: ${after.slice(0, 60)})`);
  return `redo reapplied "${marker}"`;
}

// Open the header theme popover ("Style" for product template modules, or the
// service/legacy theme control). Returns the palette-swatch locator scope.
async function openThemePopover(page: Page): Promise<void> {
  // Blur any active contenteditable first so the popover trigger click lands.
  await page.keyboard.press('Escape').catch(() => {});
  const trigger = page.getByRole('button', { name: /Style|Theme|Design/i }).first();
  await trigger.click({ timeout: 5_000 });
  // Popover content carries the "Palette" section label.
  await page.getByText('Palette', { exact: false }).first().waitFor({ state: 'visible', timeout: 5_000 });
}

// palette: UI-driven palette swap through the header theme popover. Asserts
// (a) the store's paletteId changed to the clicked swatch and (b) the renderer
// re-rendered in response (fresh per-render debug logs fire). Over-broad→narrow
// regressions in palette/theme consumers surface as "store changed, no repaint".
async function smokePalette(page: Page, token: string): Promise<string> {
  const readPalette = () => readStore(page, token, (s) => s?.meta?.paletteId ?? s?.paletteId ?? null);
  const before = await readPalette();
  await openThemePopover(page);
  // Palette swatches are buttons with title=<paletteId> + aria-pressed. Pick a
  // non-active one.
  const inactive = page.locator('button[title][aria-pressed="false"]');
  const count = await inactive.count();
  let targetId: string | null = null;
  for (let i = 0; i < count; i++) {
    const t = await inactive.nth(i).getAttribute('title');
    // swatch titles are palette ids (short, no spaces); skip variant/other buttons
    if (t && !/\s/.test(t) && t !== before) {
      // ensure it's a palette swatch (has inner [data-palette] span)
      const isSwatch = await inactive.nth(i).locator('[data-palette]').count().then((c) => c > 0);
      if (isSwatch) {
        targetId = t;
        const startCommits = await commitCount(page);
        await inactive.nth(i).click();
        await page.waitForTimeout(600);
        const after = await readPalette();
        if (after !== targetId) throw new Error(`store paletteId did not update (before=${before}, clicked=${targetId}, after=${after})`);
        const rendered = (await commitCount(page)) - startCommits;
        if (rendered <= 0) throw new Error(`palette changed in store (${before}→${after}) but no React re-commit — canvas would not repaint`);
        await page.keyboard.press('Escape').catch(() => {});
        return `palette ${before}→${after} via popover, ${rendered} React re-commit(s)`;
      }
    }
  }
  await page.keyboard.press('Escape').catch(() => {});
  throw new Error('no inactive palette swatch found in theme popover');
}

// modal: open the header theme popover (a "named" overlay surface) and assert it
// REFLECTS a store value — the active palette swatch (aria-pressed="true") must
// carry title === the store's current paletteId (store → UI reflection). A
// store→UI reflection break is exactly what an over-narrow selector causes.
async function smokeModal(page: Page, token: string): Promise<string> {
  const storePalette = await readStore(page, token, (s) => s?.meta?.paletteId ?? s?.paletteId ?? null);
  await openThemePopover(page);
  const active = page.locator('button[aria-pressed="true"] [data-palette]').first();
  await active.waitFor({ state: 'visible', timeout: 5_000 });
  const reflected = await active.getAttribute('data-palette');
  await page.keyboard.press('Escape').catch(() => {});
  if (storePalette && reflected !== storePalette) {
    throw new Error(`theme popover active swatch (${reflected}) does not reflect store paletteId (${storePalette})`);
  }
  return `theme popover open; active swatch reflects store paletteId="${reflected}"`;
}

// ---------------------------------------------------------------------------
// perf: React-commit churn over a 20-char typing burst + a commit(blur), plus
// CDP JSHeapUsedSize delta across the whole sequence.
//
// NOTE on the burst metric: this editor commits a text edit to the store on
// BLUR, not per keystroke (InlineTextEditorV2.saveContent on blur/Enter), so a
// pure typing burst drives ~0 React commits — the plan's "renders/keystroke"
// baseline is ~0 here by construction, and the discriminating store-subscription
// signal is `commitsOnCommit` (re-renders triggered when the edit reaches the
// store). Both are recorded; Step-B compares against them.
// ---------------------------------------------------------------------------
async function measurePerf(page: Page, token: string, mutations: { count: number }) {
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  await client.send('HeapProfiler.enable').catch(() => {});

  const heapBefore = await getHeap(client);

  const headline = page.locator(HEADLINE).first();
  await headline.click();
  await page.keyboard.press('End');

  const burst = 'abcdefghijklmnopqrst'; // 20 chars
  const startCommits = await commitCount(page);
  const startMutations = mutations.count;
  for (const ch of burst) {
    await page.keyboard.type(ch, { delay: 30 });
  }
  const commitsDuringBurst = (await commitCount(page)) - startCommits;

  // commit (blur) — where the whole-store-subscription re-render churn fires.
  const beforeCommit = await commitCount(page);
  await headline.evaluate((el: HTMLElement) => el.blur());
  await page.waitForTimeout(800);
  const commitsOnCommit = (await commitCount(page)) - beforeCommit;
  const storeMutations = mutations.count - startMutations; // debug-log cross-check
  const heapAfter = await getHeap(client);

  return {
    keystrokes: burst.length,
    commitsDuringBurst,
    reactCommitsPerKeystroke: Number((commitsDuringBurst / burst.length).toFixed(3)),
    commitsOnCommit,
    storeMutationsObserved: storeMutations,
    heapBeforeBytes: heapBefore,
    heapAfterBytes: heapAfter,
    heapDeltaBytes: heapAfter - heapBefore,
    heapDeltaMB: Number(((heapAfter - heapBefore) / (1024 * 1024)).toFixed(3)),
  };
}

async function getHeap(client: any): Promise<number> {
  // Force GC first so the delta reflects RETAINED growth (leaks), not transient
  // allocations that a collection would reclaim — otherwise the number is pure
  // noise (observed ±15MB run-to-run without this).
  await client.send('HeapProfiler.collectGarbage').catch(() => {});
  const { metrics } = await client.send('Performance.getMetrics');
  const m = metrics.find((x: any) => x.name === 'JSHeapUsedSize');
  return m ? m.value : 0;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const cfg: AudienceConfig | undefined = AUDIENCES.find((a) => a.templateId === AUDIENCE_ID);
  if (!cfg) throw new Error(`no seed audience for templateId=${AUDIENCE_ID}`);

  const { email, password } = await ensureUserAndToken();

  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  try {
    browser = await chromium.launch({ headless: !HEADED });
    context = await browser.newContext({ baseURL: PROBE_URL });
    // Install the React-commit counter BEFORE any page script runs.
    await context.addInitScript(REACT_HOOK_STUB);
    const page = await context.newPage();

    // Secondary signal: store-mutation count from the EDITOR_DEBUG-gated
    // "updateElementContent CALLED" logs (the plan's debug-log approach). A
    // cross-check for the React-commit metric; confirms edits reach the store.
    const mutations = { count: 0 };
    const DUMP = process.env.PROBE_DEBUG_CONSOLE === '1';
    let dumped = 0;
    page.on('console', (msg) => {
      const t = msg.text();
      if (DUMP && dumped < 60) {
        dumped++;
        console.log(`[console] ${t.slice(0, 120)}`);
      }
      if (t.includes('updateElementContent CALLED')) mutations.count++;
    });

    console.log(`[probe] signing in as ${email} …`);
    await signIn(page, email, password);

    console.log('[probe] creating + seeding a project …');
    const personaRes = await page.request.post('/api/user/persona', { data: { persona: cfg.persona } });
    if (!personaRes.ok()) throw new Error(`persona upsert failed: ${personaRes.status()}`);
    const startRes = await page.request.get('/api/start');
    if (!startRes.ok()) throw new Error(`/api/start failed: ${startRes.status()}`);
    const { url } = await startRes.json();
    const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
    await seedDraft(page.request, token, cfg);
    console.log(`[probe] seeded token=${token}`);

    await page.goto(`/edit/${token}`);
    await page.locator(HEADLINE).first().waitFor({ state: 'visible', timeout: 60_000 });
    console.log('[probe] editor loaded (hero headline visible)');

    // smokes
    const runners: Record<Smoke, () => Promise<string>> = {
      type: () => smokeType(page, token),
      select: () => smokeSelect(page, token),
      undo: () => smokeUndo(page, token),
      redo: () => smokeRedo(page, token),
      palette: () => smokePalette(page, token),
      modal: () => smokeModal(page, token),
    };
    for (const name of requestedSmokes) {
      try {
        const detail = await runners[name]();
        record(name, true, detail);
      } catch (err) {
        record(name, false, err instanceof Error ? err.message : String(err));
      }
    }

    // perf (after smokes so the page is warm; reload to a clean edit state first)
    let perf: Awaited<ReturnType<typeof measurePerf>> | null = null;
    if (RUN_PERF) {
      await page.goto(`/edit/${token}`);
      await page.locator(HEADLINE).first().waitFor({ state: 'visible', timeout: 60_000 });
      await page.waitForTimeout(1000);
      perf = await measurePerf(page, token, mutations);
      console.log('[perf]', JSON.stringify(perf, null, 2));
    }

    const allPassed = smokeResults.every((r) => r.status === 'pass');
    const summary = {
      url: PROBE_URL,
      audience: AUDIENCE_ID,
      token,
      smokes: smokeResults,
      perf,
      allPassed,
    };
    console.log('PROBE_RESULT ' + JSON.stringify(summary));
    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await context?.close();
    await browser?.close();
  }
}

main().catch((err) => {
  console.error('[probe] fatal:', err);
  process.exit(3);
});
