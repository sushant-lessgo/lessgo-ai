# Lessgo AI — Repo-Wide Code-Quality Report

**Date:** 2026-07-12 · **Method:** 7 parallel read-only review agents (templates, editor, API routes, publish/render, AI generation, libs/billing, UI/shell+tests), ~1,400 source files; hot files read fully, rest sampled + smell-grepped.
**Scale:** bad / ok / good / world-class. Every below-good item has impact + fix priority.

---

## 1. Verdict

The "low-quality agent code" fear is mostly unfounded for the **current** architecture: the template system, copy engines, domains routes, and test suite are genuinely disciplined (several world-class). The real debt is concentrated in **legacy paths that were never retired** (regeneration pipeline, old editor store slices, legacy prompt builder/parser) and in **billing correctness** (a real double-spend race, a fail-open feature gate). Fix list is short and high-leverage, not a rewrite.

## 2. Area ratings

| Area | Rating | One-liner |
|---|---|---|
| Templates — shared infra, registry, atelier, vestria | **world-class** | Dynamic-import firewall clean; `.core.tsx` single-source kills dual-renderer drift by construction |
| Templates — granth, meridian, hearth, lex, surge, techpremium | **good** | Solid, but 6 older templates hand-duplicate `.tsx`/`.published.tsx` (parity debt) |
| Templates — lumen | **ok** | Bespoke, heaviest per-block complexity, hand-duplicated |
| Editor — ToolbarShell, InlineTextEditorV2, autosave | **good** | Historical edit-loss/cursor bugs genuinely fixed; ToolbarShell strongest file in scope |
| Editor — legacy store slices (`src/hooks/editStore/*`), `useEditor.ts` | **ok** | Debug logs, dead-dangerous `reset` stub, latent crash, second DOM-hijack text-edit path still wired |
| API — domains, social/outreach/email rails, persistence | **good→world-class** | auth+ownership+zod+atomic tx+kill-switch; `assertProjectOwner` uniform |
| API — regenerate-* routes | **bad** | `regenerate-content` = ungated free LLM proxy; all 3 on deprecated models + triplicated code |
| API — forms/analytics/subscribe | **ok** | Public by design but forgeable `userId`, unhardened subscribe |
| Publish/render — renderers, registries, KV routing | **good** | Bundle firewall + published/client boundary verified clean (0 violations) |
| Publish/render — staticExport, build scripts | **ok** | Unescaped head attrs, false-success publish, stale CSS globs |
| Generation — modern path (audience routes, aiClient, engines, brief) | **good→world-class** | Zod-validated, structured outputs, graceful fallbacks |
| Generation — legacy path (`buildPrompt.ts`, `parseAiResponse.ts`) | **bad** | 2347 + 1833 lines, `@ts-nocheck`, regex JSON soup — still live for all regeneration |
| Libs — planManager/creditSystem | **ok** | Double-spend race + fail-open gate + FREE>PRO inversion |
| Libs — integrations | **ok** | Plaintext keys; keys in URL query; schema falsely says "Encrypted" |
| Libs — domains, blog, schemas/types | **good** | SSRF-safe, ownership-gated, zod at boundaries |
| UI/shell — components, onboarding, Design, dashboard | **good** | 0 a11y div-buttons, no prop drilling; dashboard ok-good |
| Config/shell | **ok** | ESLint never gates builds; weak ruleset; PostHog records raw inputs |
| Tests | **good** | ~3,800 behavioral asserts, 0 skips/snapshots; dual-renderer parity + dispatch pinned |

## 3. HIGH priority (fix before public beta / pricing-v2)

| # | Finding | Evidence | Impact |
|---|---|---|---|
| H1 | **Credit deduction not atomic → concurrent double-spend.** `findUnique` then read-modify-write inside `$transaction`; no row lock. "Lock" comment is false. | `src/lib/creditSystem.ts:167-220` | N concurrent generations, charged once. Revenue loss / free AI compute. Fix: conditional `updateMany … decrement` + assert count===1. |
| H2 | **`hasFeature` fails open for every boolean feature.** `x !== 'none'` is true for `false`. Author documented the bug in `hasTrackingPixels` comment but never fixed the source. | `src/lib/planManager.ts:403` | All plan feature gates (removeBranding, whiteLabel, exportHTML…) pass on FREE. Blast radius small today (2 callers), a paywall hole the moment anything new calls it. |
| H3 | **`regenerate-content` = ungated arbitrary-prompt LLM proxy.** Takes body `prompt`, calls OpenAI directly; no credit check, no consumption, no ownership — only rate limit. | `src/app/api/regenerate-content/route.ts:9-83` | Any signed-in user gets unlimited completions on your API key. Cost abuse. |
| H4 | **Entire regeneration surface frozen on legacy stack.** 3 regenerate routes hardcode `gpt-3.5-turbo`/Mixtral + feed `parseAiResponse.ts` (1,833 lines, the repo's only `@ts-nocheck`, 4-fallback regex JSON extraction, silently ships filler copy like "Transform Your Business Today" on partial parse). | `regenerate-{content,section,element}/route.ts`; `src/modules/prompt/parseAiResponse.ts:7,150-207` | The buttons users click most while editing burn credits on a near-deprecated model through a fragile parser — quality visibly worse than initial generation. Fix: route regen through modern `generateRawJson`+Zod, delete `parseAiResponse.ts` + `buildPrompt.ts` (2,347 lines). Biggest single-code-deletion win in the repo. |
| H5 | **`aiClient.ts` raw-JSON extraction is the shared weak link.** Greedy `match(/(\{[\s\S]*\})/)` + unguarded `JSON.parse` → malformed output surfaces as untyped throw, bypassing the typed-fallback contract engines rely on. | `src/lib/aiClient.ts:229-238` | Content-parse failures look like infra errors; failed generations still billed. |

## 4. MEDIUM priority

| # | Finding | Evidence | Impact |
|---|---|---|---|
| M1 | Generation routes bill **after** the AI call, best-effort (`consumeCredits` failure = warn only); no pre-spend balance gate | `audience/*/strategy`,`generate-copy`, `v2/*` (e.g. `product/strategy:222-224`) | 0-credit user still generates; paywall bypass |
| M2 | `withAICredits` charges before op, never refunds on failure; charge model inconsistent across routes | `src/lib/middleware/planCheck.ts:261-293` | Failed generation still billed → support tickets |
| M3 | Publish returns HTTP 200 "published" when static export threw (state set `failed`, then falls through to success response) | `src/app/api/publish/route.ts:481-519` | Customer told success; page serves only via SSR fallback |
| M4 | `og:image` + canonical interpolated unescaped into exported `<head>` (favicon IS escaped — inconsistent) | `src/lib/staticExport/htmlGenerator.ts:359-374` | Stored XSS on published `*.lessgo.site` page via crafted URL field |
| M5 | `buildPublishedCSS.js` globs scan removed dirs (`UIBlocks`, dead `components/published`), omit `templates/**` + `sharedBlocks/**` published twins | `scripts/buildPublishedCSS.js:27-29` | Any Tailwind class added to a template published block silently stripped → editor≠published styling |
| M6 | Integration API keys plaintext; schema comment claims "Encrypted"; live path reads key from `Project.content` JSON; ConvertKit key sent as URL query param | `prisma/schema.prisma:349`; `forms/submit/route.ts:115`; `convertkit.ts:80,110` | Customer secrets exposed at rest + in proxy/CDN logs |
| M7 | Plan config inversion: FREE `publishedPages: 20` > PRO `10`; contradicts DB default (1) + pricing-v2 intent | `src/lib/planManager.ts:69,99` | Free outranks paid; pricing-v2 will trip on this |
| M8 | `forms/submit` trusts body `userId` (public in page HTML) → forged submissions fire victim's integrations + lead emails | `src/app/api/forms/submit/route.ts:56,85,166` | Data pollution + spam amplification via owner's own inbox |
| M9 | Legacy DOM-hijack text-edit path (270 lines: contentEditable, `oninput` reassignment, setTimeout caret) still wired from ElementToolbar — coexists with InlineTextEditorV2 | `src/hooks/useEditor.ts:394-659`; `ElementToolbar.tsx:104` | Two text-edit systems for same element = the exact dual-path shape that caused historical cursor/content bugs. Delete in favor of V2. |
| M10 | `bulkUpdateSection` writes wrong storage shape (`.content` sub-prop where V2 stores raw values) + unguarded `section.aiMetadata` access → crash inside Immer | `src/hooks/editStore/contentActions.ts:587-595,537` | Latent corruption/no-op + runtime crash on sections without aiMetadata |
| M11 | Dead-but-armed `reset` stub would wipe store to 4 fields; harmless only because a later spread shadows it | `src/hooks/editStore/persistenceActions.ts:786-789,855-863` | Spread reorder silently arms a store-wipe landmine. Delete. |
| M12 | PostHog session recording `maskAllInputs: false` + unguarded init key | `src/providers/ph-provider.tsx:14-20` | Records raw text of every input (PII) — revisit before public beta as the comment itself says |
| M13 | ESLint `ignoreDuringBuilds: true` + bare `next/core-web-vitals` ruleset; no CI, push-to-main workflow | `next.config.js:6`; `.eslintrc.json` | Root cause of `as any`/unused-import accumulation; only guardrail is tsc |
| M14 | `isInfrastructureError` matches `'500'`,`'length'` in message text → wrong second paid backup call | `src/lib/aiClient.ts:166-185` | Silent credit/latency waste |
| M15 | 6 older templates hand-duplicate `.tsx`/`.published.tsx` (meridian hero: 345 vs 198 lines); newest 3 prove `.core.tsx` fix | e.g. `meridian/blocks/Hero/TerminalHero{,.published}.tsx`; techpremium ×19 | Every edit must be mirrored by hand → parity bugs shipping to live customer pages; conformance tests mitigate |
| M16 | Duplication: `callAIProvider` ×3 routes; product↔service `parseCopy`/`copyPrompt` mirror-pairs; `thing.ts` fetch ×3 + 408-line function + `as`-cast route responses | `regenerate-*`; `audience/{product,service}/`; `wizard/generation/thing.ts:404-818` | Divergence risk (model strings already drifted) |

## 5. LOW priority

- **Dead code:** `src/components/published/**` (13 files incl. a `'use client'` FormIsland on the boundary); `src/generated/prisma/**` (22 committed files, imported by nothing — delete + gitignore); `useOptimizedEditStore.ts`, `useEditStoreGlobal.ts`, `useCurrentEditStore`/`useEditStoreSelector`; `layout.tsx` ~45 commented lines + 7 unused imports; `forms/submit` GET stub with TODO.
- **Security hygiene:** `subscribe` route no validation/rate-limit + leaks upstream error (`subscribe/route.ts:21`); analytics rate limit in-memory + off by default (`analytics/event/route.ts:76,140`); SVG uploads stored unsanitized (mitigated by Blob host origin); `error.message`/`stack` leaked to clients in ~9 routes (admin/kv returns stack).
- **Correctness nits:** `adjustColorBrightness` no-op → hover/active accent dead on legacy-theme pages (`htmlGenerator.ts:435`); two divergent `extractSectionType` impls (`componentRegistry{,.published}.ts`); regex asset rewriter first-occurrence-only replace (`assetResolver.ts:78,101`); multipage publish rollback leaves subpage blobs + version row; shallow undo-history snapshot + spurious `'theme'` default (`uiActions.ts:905-919`); monthly credit period uses server-local tz (`creditSystem.ts:74`); missing `@@index` on `Project.userId`; ~40 files subscribe to the whole edit store (header/modals re-render per keystroke — hot paths already use selectors).
- **Bulk smells:** `as any` ≈ 237 editor scope / 75 API / 60 templates (templates' are all benign untyped-legacy-store + icon lookups); raw `console.*` ≈ 90 in API handlers + 47 editor (prod builds strip all but `console.error` via `next.config.js:39-43`, so dev-noise not prod-leak — the `upload-image` 22× and `forms/submit` request-detail logs still worth deleting); `ButtonConfigurationModal.tsx` 969-line god component; `FormRenderer` `colorTokens?: any`.

## 6. Worst offenders (repo top 10)

1. `src/modules/prompt/parseAiResponse.ts` — 1,833 lines, `@ts-nocheck`, regex JSON, duplicated emoji ladders (H4)
2. `src/modules/prompt/buildPrompt.ts` — 2,347 lines, 382-line guidance fn (H4)
3. `src/app/api/regenerate-content/route.ts` — ungated LLM proxy (H3)
4. `src/lib/creditSystem.ts` — double-spend race (H1)
5. `src/lib/planManager.ts` — fail-open `hasFeature` + FREE>PRO (H2, M7)
6. `src/lib/aiClient.ts` — unguarded parse, greedy regex, broad infra-match (H5, M14)
7. `src/hooks/useEditor.ts` — live legacy DOM-hijack edit path (M9)
8. `src/hooks/editStore/persistenceActions.ts` — reset landmine + debug logs, 863-line slice (M11)
9. `src/app/api/publish/route.ts` — false-success, 500-line handler, incomplete rollback (M3)
10. `src/components/toolbars/ButtonConfigurationModal.tsx` — 969-line god component

## 7. World-class — don't touch, copy the patterns

- Template registry firewall + filesystem-walking `publishedClientBoundary.test.ts` (0 violations found)
- `.core.tsx` single-source pattern (atelier/vestria/granth) — the template-factory standard
- Copy rails (`social`/`outreach`/`email-sequences`): auth+owner+kill-switch+atomic tx+ledger+zod — best route code in repo
- `domains/*` routes; `src/modules/engines` + `brief`; `ToolbarShell.tsx`; `useAutoSave.ts`; test suite (behavioral, 0 skips)

## 8. Suggested fix order

1. **Billing correctness bundle** (H1+H2+M7+M1/M2) — one small PR, do before pricing-v2 ships
2. **Kill `regenerate-content` hole** (H3) — hours
3. **Regen modernization** (H4+H5+M14+M16) — route 3 regen endpoints through `generateRawJson`+Zod, delete ~4,200 legacy lines
4. **Publish trust** (M3+M4+M5) — false-success, head escaping, CSS globs
5. **Editor landmines** (M9+M10+M11) — mostly deletions
6. **Pre-beta hygiene** (M6+M8+M12+M13) — secrets, forms userId, PostHog masking, lint gate
7. Low bucket opportunistically (dead-code deletes are free wins)
