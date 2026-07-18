# account-settings — audit

## Phase 1 — page swap + `profileAppearance`

**Files changed:**
- `src/lib/clerkAppearance.ts` — added `profileAppearance` export (`authAppearance` untouched).
- `src/app/dashboard/settings/page.tsx` — rewrote body: persona editor → Clerk `<UserProfile/>`.

No 3rd file needed (server component + Clerk client `<UserProfile/>` child worked without `'use client'`).

### What changed
- `clerkAppearance.ts`: new `profileAppearance: Appearance` sibling. Variables duplicated verbatim from `authAppearance` (colorPrimary `#006CFF`, colorText `#191922`, fontFamily Onest, borderRadius `12px`, etc.) — duplicated rather than a shared const so `authAppearance` source is untouched. Card chrome KEPT: `cardBox` gets `rounded-app-card border border-app-border bg-app-surface shadow-app-card` (clean panel on `#f7f8fa` main); `card` transparent/shadowless. Profile nav + fields + primary CTA themed with `app-*` tokens (mirroring the auth map's input/button styling). Doc comment mirrors `authAppearance`'s and notes the card-chrome-kept difference. Element keys used are valid for `@clerk/nextjs` 6.31.0.
- `settings/page.tsx`: DELETED prisma import + `User.persona` read, `PersonaPrompt` import/mount, `UserPersona` type import, `next="/dashboard?personaUpdated=1"`, and the full-screen shell (`min-h-screen bg-white` wrapper, inner `<main className="max-w-3xl">`, "← Back to dashboard" link). KEPT the `auth()` → `redirect('/sign-in')` guard; page stays a server component. New body is plain content inside the dashboard layout's `<main>`: `app-*`-tokened header (`h1` "Account settings" + subhead) → `<UserProfile routing="hash" appearance={profileAppearance} />` → commented notifications placeholder containing the exact marker `// TODO(beta+): notifications settings — needs a prefs backend`. Padding follows the sibling `dashboard/leads` page (`px-[26px] pb-[26px] pt-[22px]`). Brand string = "Lessgo AI".

### Deviations
- None functional. Chose to duplicate the `variables` object (spec-permitted "your call") to guarantee `authAppearance` is byte-untouched.
- Padding/header wrapper: sibling dashboard pages diverge (older ones like `testimonials` still carry their own shell; redesigned `leads` uses `px-[26px]` inside the layout `<main>`). Conservative pick = the redesigned `leads` pattern (plain content, `app-*` tokens), matching the plan's "plain content inside the layout" instruction.

### Verification
- `npx tsc --noEmit`: **PASS for touched files.** One pre-existing, unrelated error remains: `src/app/page.tsx(6,26): TS2307 Cannot find module '@/assets/images/founder.jpg'` — confirmed present with my two files stashed (and after `rm -rf .next`), so not introduced here and outside scope.
- `npm run test:run`: **PASS** — 250 files passed / 1 skipped; 4035 tests passed / 14 skipped.
- `npm run lint`: **PASS** — no errors; only pre-existing warnings in unrelated files (`no-img-element`, one `exhaustive-deps`). No warnings from touched files.
- `npm run build`: **PASS** — "Compiled successfully"; `/dashboard/settings` built as dynamic route (391 B).
- Source sanity: persona editor gone (no `PersonaPrompt`/`prisma`/`persona` in the page); `<UserProfile routing="hash" appearance={profileAppearance} />` mounted.

### Open risks
- Themed Clerk profile visual polish is beta-lightweight (Clerk default inner UI accepted, spec Scope OUT) — founder visual eyeball is the merge-gate human check.
- Pre-existing `founder.jpg` TS2307 is a repo-wide condition unrelated to this phase; flagged, not fixed (out of scope).

## Phase 2 — e2e regression spec (deterministic-QA)

**Files changed:**
- `e2e/account-settings.spec.ts` (new) — authed regression guard.
- `playwright.config.ts` (edit) — registered the new spec in the `authed` project's `testMatch` allowlist.

### What changed
- `e2e/account-settings.spec.ts`: single authed test (reuses the `setup`-project Clerk session via `storageState: e2e/.clerk/user.json`, same pattern as `publish.spec.ts` — no per-spec sign-in). It `goto('/dashboard/settings')` and asserts three things:
  1. Header `getByRole('heading', { name: 'Account settings' })` is visible.
  2. Clerk `<UserProfile/>` mounted — resilient class-prefix selector `[class*="cl-userProfile"]` (`.first()`), 15s timeout for client-side hydration; deliberately copy-independent.
  3. Persona selector ABSENT — `getByText('What do you do?')` has count 0.
- `playwright.config.ts`: added `/account-settings\.spec\.ts/` to the `authed` project's `testMatch` array (right after `dashboard-lifecycle`), matching the existing regex style, with a short comment.

### Verified persona heading string
The old `/dashboard/settings/page.tsx` (git `28cd9808^`) mounted `PersonaPrompt` with `heading="What do you do?"` — the plan's guess was correct, confirmed against source (not `PersonaPrompt`'s default of "Who are you?"). Assertion locks the exact string that used to appear on this route.

### testMatch line added
`/account-settings\.spec\.ts/,`

### Deviations
- None. Ran the new spec in isolation (`--project=setup --project=authed account-settings.spec.ts`) rather than the full authed suite, since the phase scope is this one regression guard; the allowlist-trap concern (spec silently never running) is directly disproven by both the `--list` discovery and the actual execution below.

### Verification
- `npx playwright test --list --project=authed` → spec DISCOVERED: `[authed] › account-settings.spec.ts:11:5 › account settings renders Clerk profile, not the persona selector` (allowlist registration correct).
- `npx playwright test --project=setup --project=authed account-settings.spec.ts` → **2 passed** (setup authenticate 8.4s, account-settings 3.5s). Real dev server (mock mode) + real Clerk test session — RAN and PASSED, not faked/skipped.
- `npx tsc --noEmit` → clean over the diff (only the pre-existing, unrelated `src/app/page.tsx` `founder.jpg` TS2307 remains, filtered).
- `npx eslint e2e/account-settings.spec.ts playwright.config.ts` → clean, no errors/warnings.

### Open risks
- The spec asserts `<UserProfile/>` is mounted (class prefix present), not that every Clerk sub-flow works — Clerk-owned flows (name/email/password/avatar/sign-out) stay founder-manual per the plan's human gate.
- Existing authed specs were not re-run in full this phase (only the new spec + its `setup` dependency); no shared file/state was touched, so no regression to them is expected.
