---
tier: full
tier-why: net-new AI-write generation (LLM + credits) + blog authoring surface adjacent to the blog publish path. Reskin is bounded, but AI-write + credit-gating pushes it full.
---

# blog-composer-redesign — spec  (Dashboard redesign · Blog · handoff 3b–3d)

# Parallel-safe: dashboard **blog** sub-tree — distinct files from billing (account), S4a
# (analytics/leads), editor, onboarding. Isolated stream.

## Problem / why
The blog backend is shipped (BlogPost model, posts/publish/unpublish routes, `lib/blog/*`) and
S1 re-homed the blog tab under the project workspace, but the authoring UI is pre-redesign and
has **no AI-write**. The handoff (3b–3d) redesigns the blog experience: first-run enablement,
a manager (posts + stats + AI entry), and a "Write a post with AI" flow (brief left / editable
post right).

## Goal
Reskin the blog experience to the handoff and add **AI-assisted post writing**: a user enables
blog on a site (3b), manages posts (3c), and drafts a post with AI that lands editable (3d) —
over the existing blog backend + publish path.

## Approach (decided)
- **Reskin over the shipped backend** (BlogPost + posts routes + `lib/blog/*`); don't touch the
  blog **publish** mechanism (`publishBlogPost`/blob/versioning) — authoring/management only.
- **AI-write (3d) is net-new** (no blog generation route today) — an LLM call producing a draft
  into `BlogPost`, **credit-gated**. It's the heaviest phase → build the reskin first so it can
  land even if AI-write needs more time.

## Scope IN
- **3b — Blog first-time setup**: the Blog tab before it's enabled + how a user turns it on
  (enable state / empty state).
- **3c — Blog manager**: posts list + stats + "Write a post with AI" entry — reskin over
  `blog/posts` (list/create). Under `/dashboard/[token]/blog` (S1 routing).
- **3d — Write a post with AI**: brief-on-the-left / editable-post-on-the-right layout; an AI
  draft lands in the editor and is fully editable, then saved to `BlogPost` (draft) via existing
  routes.
- **AI-write generation** (net-new): LLM call → post draft (title/excerpt/body markdown),
  **credit-gated** via `checkCredits()`, block→upgrade message (align with billing-beta gating).
- Post editor reskin (title/body markdown/hero image/excerpt/SEO) over existing `posts/[postId]`.
- Built on `ui-foundation` primitives; image/hero via `media-library-picker` (coordinate).

## Scope OUT (non-goals)
- **No changes to the blog publish path** — `publishBlogPost`, blob keys, versioning, `buildBlogPages`,
  per-post KV — reskin authoring only (publish/unpublish already work).
- No blog scheduling, categories/tags, comments, or analytics beyond existing stats.
- No newsletter/subscribe changes (`blog/unsubscribe` untouched).
- No per-post SEO rebuild beyond the existing `seo` field (sanitizeSeo).
- No responsive/mobile pass.

## Constraints
- Depends on **`ui-foundation` merged**; blog lives under **`/dashboard/[token]/blog`** (S1
  re-homed) — coordinate with the S1 routing (don't re-home it differently).
- **AI-write = LLM + credits** → gate via `checkCredits()` + gating message (align with
  `billing-beta`); it's the heaviest phase (its own).
- **Reuse existing blog backend** (`blog/posts` routes, `lib/blog/schemas.ts`, body `{format:
  'markdown', markdown}` shape) — don't fork the model or publish path.
- **Coordinate with `media-library-picker`** for hero-image selection (wire, don't rebuild).
- Slug immutability once `firstPublishedAt` is set (URL permanence) — respect it in the editor.
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `prisma/schema.prisma` — `BlogPost` (L80: projectId/slug/title/excerpt/heroImage/body/seo/status/
  publish versioning).
- `src/app/api/blog/posts/route.ts` (list/create), `posts/[postId]/route.ts` (get/update),
  `publish`/`unpublish` (do NOT change).
- `src/lib/blog/` — `schemas.ts`, `buildBlogPages.ts`, `publishBlogPost.ts`.
- `src/app/dashboard/blog/[slug]/page.tsx`, `[slug]/[postId]/page.tsx` — existing manager/editor to reskin (+ re-home under `[token]`).
- Handoff `Lessgo Dashboard.dc.html` 3b (first-run), 3c (manager), 3d (AI-write).
- `checkCredits()` + `docs/task/billing-beta.spec.md` — AI-write gating.
- `docs/task/media-library-picker.spec.md` — hero-image picker (coordinate).
- `docs/task/dashboard-workspace-ia.spec.md` — S1 blog re-home + routing.

## Open exploration questions (feeds scout)
- Current state of the blog manager/editor pages (how much reskin vs rebuild); did S1 already
  re-home blog under `[token]`?
- Cleanest AI-write generation approach — new route reusing generation infra? credit cost for a post?
- The `body` markdown editor in use today (to reskin the 3d editable-post pane).
- Where blog stats come from for the 3c manager.

## Candidate human gates
- **AI-write credit/gating** copy + path before it faces paying users.
- Blog still publishes/unpublishes correctly after the authoring reskin (don't regress the publish path). Founder QA.

## Acceptance criteria
- [ ] Blog first-run enable state (3b) renders; a user can turn blog on for a site.
- [ ] Blog manager (3c) reskinned: posts list + stats + AI-write entry, under `/dashboard/[token]/blog`.
- [ ] Write-with-AI (3d): brief→AI draft lands editable (brief left / post right), saved to BlogPost draft.
- [ ] AI-write is credit-gated; block→upgrade message; no silent fail.
- [ ] Publish/unpublish path unchanged and still works; slug immutability respected.
- [ ] Hero image via the media picker; built on ui-foundation.
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
Phase order: (1) reskin 3b first-run + 3c manager + 3d post editor over existing backend (no AI) —
ships the redesigned authoring, (2) AI-write generation (LLM + credit-gated). Gate after (1): the
blog experience is redesigned and manual authoring works end-to-end; then layer AI-write.
