# `src/modules/social/` — On-brand social post generator

Per-project social post generation (LinkedIn / X / Facebook) driven read-only by
a Project's stored brand data. One engine + a data-driven per-platform preset
table; gating via a separate `socialPostsLimit` that never touches the
page-generation credit pool. The landing-page generation/edit/publish pipeline is
consumed read-only and never modified.

Built incrementally — this README grows per phase. Phases 1-3 (below) ship the
brand-context accessor + the pure generation core (presets, prompt engine, mock).

## `brandContext.ts` + `types.ts` — read-only brand accessor (phase 1)

`buildBrandContext(project)` turns a Project row into a normalized `BrandContext`
(prompt-ready), and `summarizeBrandContext(ctx)` renders it to a compact text
block for the phase-3 prompt builder.

**Invariants (do not break):**

- **Read-only over Project.** Pure functions — no writes, no AI calls, no input
  mutation. Sources: `Project.brief` (`@/types/brief`), `Project.content.onboarding`
  (`confirmedFields` / `featuresFromAI` / `hiddenInferredFields.brandTone`),
  `Project.content.finalContent` sections, `Project.inputText`, and the display
  name (`title`/`name`).
- **No `'use client'` imports.** Importing a client-block function into a
  server/pure path throws a runtime "F is not a function" 500. This module stays
  plain (types + prisma-shaped JSON) so routes and pure modules can read it.
- **Absent section = MISSING KEY, not `[]`.** Every accessor is null-safe; a bare
  `{ brief }` yields a usable partial context. Array fields (`features`,
  `testimonials`, `socialProfiles`) are ALWAYS arrays, never `undefined`.
- **Dual testimonial shapes are normalized here.** Product templates store a
  COLLECTION (`elements.testimonials: [{ quote, author_name, author_role }]`);
  service templates store a FLAT block (`elements.{ quote, author_name,
  author_role, author_company }`); writer/Granth has none. Both collapse into
  `{ quote, authorName, authorRole?, authorCompany? }[]`. Features/services
  collections likewise fold into `{ feature, benefit }[]`.
- **Both finalContent storage modes** are scanned: flat `finalContent.content`
  AND page-store `finalContent.pages[*].content` (current editor drafts).

## `presets.ts` + `postEngine.ts` + `mockPosts.ts` — generation core (phase 3)

Pure, testable generation core. No AI call, no Prisma, no `next/*`, no
`'use client'` imports — a plain module a server route imports (phase 4).

- **`presets.ts` — `PLATFORM_PRESETS: Record<Platform, PlatformPreset>` +
  `ACTIVE_PLATFORMS`.** `PlatformPreset = { label, maxChars, tone, formatHints,
  hashtagGuidance }`. LinkedIn is fully populated and active. X (`maxChars: 280`)
  and Facebook rows are typed + present but INACTIVE.
  **Presets are DATA. Adding OR activating a platform = a preset row + an
  `ACTIVE_PLATFORMS` entry — NEVER a new code path** in the engine, route, or UI.
  Phase 6 flips `ACTIVE_PLATFORMS` and nothing else. `x.maxChars = 280` is a fact
  about the platform, correct today even while X is inactive.
- **`postEngine.ts` — one builder, no branching per platform.**
  `buildSocialPostPrompt({ ctx, platform, mode, archetype?, freshContext?, draft? })`
  is mode-conditional (`archetype` / `archetype_context` / `polish`) and injects
  the preset as explicit constraints. Archetype personality lives in the
  `ARCHETYPE_INSTRUCTIONS` DATA map (5 archetypes → instruction). Brand block comes
  from `summarizeBrandContext(ctx)` (omits absent sections). Output is always
  requested as JSON `{ "post": string }`.
  - **No fabricated testimonials.** The `testimonial_quote` archetype builder is
    conditional: WITH testimonials it asks the model to draw on a real one; WITHOUT
    any it explicitly instructs the model NOT to fabricate a quote and to speak to
    results/value instead. A real customer quote must never be hallucinated.
  - **`validatePostOutput(raw, preset)`** parses against `socialPostOutputSchema`
    then hard-checks length. It NEVER throws for length — it returns a structured
    result: `{ ok: true, post }` | `{ ok: false, reason: 'invalid_shape', error }` |
    `{ ok: false, reason: 'too_long', post, length, maxChars }`. Phase 4 uses
    `too_long` to retry once (stricter instruction) or trim, and treats
    `invalid_shape` as a parse failure.
- **`mockPosts.ts` — `getMockPost({ platform, mode, ctx, archetype?, ... })`.**
  DETERMINISTIC (no `Math.random()`, no `Date.now()`), always includes
  `ctx.businessName`, always clamps to `preset.maxChars` (X's 280 included).

## ID-space rule (D6 — applies to later phases; pinned here so it's unmissable)

`UsageEvent.userId`, `SocialPost.userId`, the gating count query, and
`checkLimit(...)` ALL use the **Clerk id from `auth()`** — never the internal
`userRecord.id` returned by `assertProjectOwner`. `Project.userId` is the
INTERNAL `User.id` FK; threading it into gating/ledger makes `usageEvent.count`
return 0 forever → the Free cap silently never fires. A swap is invisible to
`tsc` (both `string`). The demo-bearer path (no real clerkId) persists nothing.
