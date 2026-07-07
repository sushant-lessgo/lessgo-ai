# Testing Infrastructure — State, Gaps & Recommendations

> Snapshot of Lessgo's automated-quality setup, what's missing, and a speed-vs-quality
> plan sized for a solo founder shipping directly to `main`. Audited 2026-07-07.
> Companion to the live QA in [`qa-vestria.md`](./qa-vestria.md), which found the bugs
> that motivate the two "parity" gaps below.

## TL;DR

You already own most of the *quality* layers (Vitest, Playwright, ESLint, golden/contract
tests, Sentry, the `/manual-test` checklist). The real gaps are:

1. **Nothing runs automatically** — no CI, no git hooks. Tests exist but rely on remembering
   to run them before pushing to `main` (which auto-deploys via Vercel).
2. **No guard for the dual-renderer trap** — the `.tsx` vs `.published.tsx` divergence that
   causes "looks right in the editor, wrong when published" (and vice-versa).
3. **No visual/font parity check** — the exact class of the editor↔published serif-font
   mismatch found in the Vestria QA.

Fixing #1 + #2 is ~a day of work and removes most "shipped a bug" risk. #3 is a follow-up.

## Verified current state (as of audit)

| Fact | Value |
|---|---|
| Unit/integration runner | **Vitest 4.1.8**, jsdom, `globals: true`, `@vitejs/plugin-react`, `@`→`src` alias |
| Vitest scope | `src/**/*.test.{ts,tsx}` — unit, regression (palette/dispatch/section selection), golden/contract |
| E2E runner | **Playwright 1.60.0**, serial / 1 worker; specs: `generation.spec.ts`, `render.spec.ts` (public, mock), `publish.spec.ts` (authed via Clerk `auth.setup.ts`) |
| E2E toggles | `E2E_LLM=real`, `E2E_PORT`; runs against `npm run dev` |
| Lint | ESLint (`npm run lint`) |
| Typecheck | ⚠️ **No standalone script** — `tsc` only runs implicitly inside `next build` |
| CI | ❌ **None** (`.github/workflows` empty) |
| Git hooks | ❌ **None** (no husky / lint-staged / pre-commit) |
| Coverage | ❌ None |
| Component render tests (RTL) | ❌ Not installed — existing `.test.tsx` inspect the JSX element tree, they don't mount+interact |
| Visual regression | ❌ None (no Playwright screenshots / Percy / Chromatic / Argos) |
| Accessibility automation | ❌ None (no axe) |
| Error monitoring | ✅ Sentry (`@sentry/nextjs`, DSN-gated) |
| Deploy model | Push direct to `main` → Vercel auto-deploy (no PR gate) |

## The full landscape

Legend — **In repo:** ✅ yes · ⚠️ partial · ❌ no.  **Call:** ➕ add now · 🟡 later · ⬜ skip (overkill now) · ✅keep.

| Layer / practice | In repo | Quality — what it catches | Speed cost | When it should run | Call |
|---|---|---|---|---|---|
| **Pre-push git hook** (husky) | ❌ | Nothing itself — **forces** the checks below to run before code leaves your machine | ~seconds/push | every `git push` | ➕ **#1 ROI** |
| **TypeScript typecheck** (`tsc --noEmit`) | ⚠️ (only inside `next build`) | Broken refs, bad props, renamed content fields (huge in a JSON-content app) | ~10–30s | pre-push | ➕ add `typecheck` script |
| **ESLint** | ✅ | Obvious mistakes, unused/undefined, some footguns | fast | pre-commit / pre-push | ✅keep |
| **Unit / integration** (Vitest) | ✅ good | Logic regressions (palette, dispatch, section selection) | fast (sec) | pre-push | ✅keep |
| **Golden / contract** (frozen fixtures) | ✅ | Generation-shape drift | fast mock / $ real-LLM | on change + on-demand | ✅keep |
| **Component render tests** (RTL, jsdom) | ❌ | Block renders right; **dual-renderer *structural* parity** (`.tsx` vs `.published.tsx`) — the #1 trap | fast | pre-push | ➕ add **1 parity test** |
| **E2E critical path** (Playwright) | ✅ 3 specs (mock) | Onboarding→generate→edit→publish→submit stays unbroken | min | pre-push / nightly / pre-deploy | ✅keep, +1 |
| **Visual regression** (screenshot diff) | ❌ | CSS/layout/**font parity** editor↔published — the #2 bug class | med setup, min run, some flake | pre-deploy / nightly | ➕ add **2–3 snaps** |
| **Rich-text / contentEditable interaction** (Playwright, real browser) | ❌ | The Bold-injects-`<span>` corruption; undo-disabled state | slower, flakier | pre-deploy / nightly | 🟡 after fix, lock it |
| **Manual pre-launch checklist** (`/manual-test`) | ✅ doc | Real-LLM copy quality, editor *feel* — automation can't | slow (human) | before template/feature launch | ✅keep |
| **AI exploratory browser QA** (e.g. the Vestria run) | ⚠️ ad-hoc | Unknown-unknowns, fuzzy flows | slow, $, non-deterministic | before launch / fuzzy specs | 🟡 discovery only → convert findings to tests |
| **CI gate** (GitHub Actions) | ❌ | Forces all the above on a server (defends against "forgot to run") | min/push | on push to `main` | 🟡 you push direct→main; a hook covers ~80% |
| **Error monitoring** (Sentry) | ✅ DSN-gated | What every test misses — real prod errors from real users | continuous | always (prod) | ✅keep — confirm enabled in prod |
| **Coverage %** | ❌ | Nothing — *measures* gaps | — | — | ⬜ skip (vanity at this stage) |
| **Accessibility** (axe) | ❌ | a11y defects | fast | pre-push | ⬜ skip unless a client requires it |

## Why the two "parity" gaps matter here

Lessgo's #1 architectural trap (per `CLAUDE.md`) is the **dual renderer**: every block exists as
a pair — the edit `.tsx` (`'use client'`, contentEditable) and the published `.published.tsx`
(server-safe, static markup). If they diverge, a change "looks right in the editor but wrong when
published." The Vestria QA hit exactly this: the display-serif heading font renders in the editor
as a fallback but on the published page as the real font. There is currently **zero automated
protection** against this whole class of bug. Two cheap tests close most of it:

- **Structural parity (Vitest, fast):** render a block's edit output and published output from the
  same fixture and assert the visible text + key structure match. Catches "field shows in editor,
  missing when published" without a browser.
- **Visual/font parity (Playwright, medium):** snapshot the published page and diff on change;
  optionally compare computed `font-family` of the hero headline in `/edit` vs the published page.

Note on the rich-text bug specifically: jsdom does **not** implement `contentEditable`,
`Selection`/`Range`, or `execCommand`, so the "Bold injects `<span>`" corruption **cannot** be
reproduced in a jsdom component test — it needs a **real browser (Playwright)**.

## Recommendation — the balanced plan

### Do now (≈1 day, cheap, removes most bug-shipping risk)
1. **Pre-push hook** running `typecheck + lint + test:run`. Converts "tests I might forget" into
   "tests that always run." Single biggest lever given there's no CI.
   - Add a `"typecheck": "tsc --noEmit"` script first.
2. **One dual-renderer structural parity test** (Vitest) for a representative block — guards the
   trap that causes editor↔published divergence.

### Do this month (regression-lock the bugs the QA found)
3. **2–3 Playwright visual snapshots** of published pages (catches the font/layout parity class).
4. After the rich-text bug is fixed, **1 Playwright spec** that selects a word, clicks Bold, and
   asserts the field contains no literal `<span` — so it can never regress.

### Skip for now (the "no overkill" part)
- Coverage %, a11y automation, a full CI matrix, exhaustive E2E. Add these when there's a team or
  a client contract that demands them.

## Guiding principle for this stage

> Cheap automated gates on the critical path + human/AI exploratory before each launch + Sentry to
> catch the rest — **not** maximal coverage.

Exploratory testing (human or AI-driven browser runs) is for *finding* unknown bugs; its deliverable
is to **convert each confirmed finding into a deterministic test** so it's protected forever. The
deterministic layers (Vitest + Playwright + typecheck) are what keep shipped quality from
regressing — but only if something forces them to run, which today nothing does.
