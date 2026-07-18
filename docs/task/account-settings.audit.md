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
