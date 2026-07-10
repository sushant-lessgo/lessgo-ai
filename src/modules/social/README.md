# `src/modules/social/` — On-brand social post generator

Per-project social post generation (LinkedIn / X / Facebook) driven read-only by
a Project's stored brand data. One engine + a data-driven per-platform preset
table; gating via a separate `socialPostsLimit` that never touches the
page-generation credit pool. The landing-page generation/edit/publish pipeline is
consumed read-only and never modified.

Built incrementally — this README grows per phase. Phase 1 (below) ships the
brand-context accessor only.

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

## ID-space rule (D6 — applies to later phases; pinned here so it's unmissable)

`UsageEvent.userId`, `SocialPost.userId`, the gating count query, and
`checkLimit(...)` ALL use the **Clerk id from `auth()`** — never the internal
`userRecord.id` returned by `assertProjectOwner`. `Project.userId` is the
INTERNAL `User.id` FK; threading it into gating/ledger makes `usageEvent.count`
return 0 forever → the Free cap silently never fires. A swap is invisible to
`tsc` (both `string`). The demo-bearer path (no real clerkId) persists nothing.
