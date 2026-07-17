---
tier: full
tier-why: Publish path (mandatory full-tier surface) + a security control where a wrong allow-policy = false protection OR broken published links; consolidates overlapping sanitizers → wants plan-review + impl-review.
---

# publish-sanitize — spec

## Problem / why
Published pages render user-authored HTML **unsanitized** — a genuine stored-XSS hole. Confirmed by
blindspot pass (2026-07-18):
- **64 `.published.tsx` blocks** inject user content via `dangerouslySetInnerHTML`; the editor text
  toolbar emits rich HTML (B/I/U, links, color).
- Content is stored **RAW** — nothing sanitizes on save (`saveDraft`/editor call no sanitizer).
- The one function that runs on publish, `sanitizeContentForPublish`
  (`layoutElementSchema.ts:429`), is **structural only** (schema-gates elements, fills defaults) —
  it does nothing about dangerous markup. The actual HTML cleaner `sanitizeHtmlContent` (imported at
  `publish/route.ts:9` from `@/lib/security`) is **never called** — dead.
- **Highest-severity vector = the import/scrape pipeline:** it pulls **verbatim external content**
  (testimonials/copy) that is attacker-controllable → hidden markup runs on the *visitor's* browser,
  in the context of a lessgo.ai subdomain or a customer's custom domain (cookie theft, phishing
  redirect, fake login/payment forms, defacement).

Split out of `editor-defect-fixes` because it needs a real allow-policy + engine decision, not a
mechanical "call the dead function" — which would strip every link (STRICT_PROFILE lacks `<a>`).

## Goal
Sanitize user HTML at the **publish gate** (the moment untrusted content becomes public) with a
**real DOM-based sanitizer**, under an allow-policy that **keeps** links + basic formatting and
**strips** scripts / event-handlers / dangerous URL schemes. Land on **ONE canonical publish-side
chokepoint**; retire the dead/overlapping sanitizers. Zero visible change to legitimate pages.

## Scope OUT (non-goals)
- **Save-time / editor-input sanitization** — deferred (possible fast-follow). Content stays raw at
  rest; the publish gate is the defense (owner-only preview/editor are lower-risk).
- **SEO/head sanitization** — already shipped by publish-trust M4 (`sanitizeSeo` + URL-scheme gate).
  Do NOT redo.
- **Rewriting the 64 blocks** — sanitize the content payload ONCE at publish, not per-block at render.
- **A new sanitizer dependency** — `dompurify` + `jsdom` are already installed; use them if they suffice.
- **Broad `layoutElementSchema` refactor** beyond slotting in HTML sanitization (its /p perf issue is
  a separate backlog item).

## Constraints
- **Must use a real DOM-based sanitizer** (DOMPurify via jsdom on the server — both installed), NOT
  the regex `sanitizeHTMLServer` path in `htmlSanitizer.ts` (regex HTML sanitization is bypassable =
  false security). Publish runs server-side, so the server engine matters.
- **Allow-policy: keep `<a href>` (+ target/rel) + inline formatting** (b/strong/i/em/u/br/p/span/
  headings/lists); **strip** `<script>/<style>/<iframe>/<object>/<embed>`, all `on*` event handlers,
  and any non-`http(s)`/`mailto` scheme (no `javascript:` / `data:text/html`). `EDITOR_PROFILE` in
  `htmlSanitizer.ts` is close — reuse/adapt, don't reinvent.
- **Sanitize `style` attributes** too (block `expression()`, `url(javascript:)`, `data:text/html`) —
  `sanitizeStyleAttribute` exists but is NOT wired into the sanitizer config.
- **Deep coverage:** content is nested (root sections + `subpages` for multi-page). Every user-text
  field across all sections/subpages must be sanitized — mirror how `sanitizeContentForPublish`
  walks the tree.
- **Idempotent + link-safe:** re-publishing a clean page = no-op; every legitimate link/format/style
  survives (verify on a real multi-page atelier/lumen page).
- Publish path is the surface — the chokepoint sits in the `/api/publish` content flow, server-side.
- Rides the big-bang batch. Re-green = tsc + test:run + build + lint.

## References
- `src/lib/htmlSanitizer.ts` — 3 profiles (STRICT lacks `<a>`; **EDITOR keeps `<a>`**), client
  DOMPurify path, **weak regex server path (do NOT use as the engine)**, `sanitizeStyleAttribute`
  (exists, unwired).
- `src/lib/security.ts` — the dead `sanitizeHtmlContent` (imported at `publish/route.ts:9`, never
  called). Scout: what it does; revive / replace / delete.
- `src/app/api/publish/route.ts:53` — where `sanitizeContentForPublish` runs (structural gate) — the
  natural place to add HTML sanitization adjacent to.
- `src/modules/sections/layoutElementSchema.ts:429` — the tree-walk (root sections + subpages) to
  mirror for field coverage.
- publish-trust M4 (`sanitizeSeo`, URL-scheme gate) — the head-sanitization pattern already shipped;
  align, don't redo.
- Installed deps: `dompurify`, `jsdom` (+ types).

## Open exploration questions (scout)
- What does `sanitizeHtmlContent` (security.ts) actually do — intended engine, another regex, or truly
  dead? Revive / replace / delete decision.
- The full set of content fields that reach `dangerouslySetInnerHTML` — all rich-text, or some plain
  strings / template-authored (don't over-sanitize template markup)?
- Server-side DOMPurify+jsdom wiring — existing isomorphic pattern in-repo, or replace htmlSanitizer's
  server path?
- Confirm the `subpages` (multi-page) tree is fully covered.
- Does any block legitimately store tags the allow-list would strip (e.g. real `<table>`/`<ul>`)?
  Inventory before locking the list.

## Candidate human gates
- **Allow-policy sign-off** — the final keep/strip list (founder confirms links + formatting survive,
  dangerous markup dies).
- Any change to the publish payload/flow (publish path = risky surface).
- **Preview-deploy XSS smoke (deploy-qa §A):** publish a page carrying a known payload (script tag,
  `<img onerror>`, `javascript:` link, style `expression()`) → verify neutralized on `/p/[slug]`, and
  a benign page's links/formatting intact.

## Acceptance criteria
- [ ] User HTML is sanitized at publish with a real DOM sanitizer (DOMPurify/jsdom), not regex.
- [ ] A payload page (script / `<img onerror>` / `javascript:` link / `data:text/html` / style
      `expression()`) publishes with ALL of it neutralized on `/p/[slug]`.
- [ ] A benign page keeps ALL legitimate links, formatting (b/i/u/lists/headings), and inline styles —
      zero visible regression (verify on a multi-page atelier/lumen).
- [ ] Sanitization walks the full content tree (root sections + subpages) — no field slips through.
- [ ] ONE canonical publish-side chokepoint; dead/overlapping sanitizer(s) resolved (revived/replaced/
      deleted — no dead imports left).
- [ ] Idempotent — re-publishing a clean page is a no-op diff.
- [ ] tsc + test:run + build + lint green; a unit test covers the payload matrix
      (script / handler / scheme / style).

## Pilot / smallest slice
Single vertical: wire real DOM sanitization into the publish chokepoint with the keep-links
allow-policy → prove on two published pages — one XSS-payload page (all neutralized) + one benign
multi-page page (unchanged). That IS the feature; no phased rollout, but full-tier review because it's
the publish path + a security control.
