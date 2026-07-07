# scale-04 — click system: Destination union, CTA vs Link, GOAL_REF

Source: scalePlan §5 (full spec), D12–D15, §11.7. Depends: scale-01 (goal in Brief). First post-pilot build — closes inventory #30, structurally closes #8.

## Goal
One destination vocabulary; buttons convert (by reference to the goal), links navigate (explicit). Kills the two parallel click models and the ×6 duplicated link popover.

## Scope IN
1. **Destination union** (every type resolves to plain href; `src/utils/resolveCtaHref.ts` stays the one dumb resolver; published pages stay static HTML):
   `section{anchor} · page{pathSlug} · external{url} · whatsapp{number,msg} · call{number} · email{addr} · download{fileUrl} · social{platform,url}`
2. **Two objects**: `CTAButton { role: primary|secondary, dest: 'GOAL_REF' | Destination, formId? }` · `Link { dest: Destination, source: derived|manual }`.
3. **GOAL_REF — by reference, buttons ONLY** (§11.7): primary buttons default to GOAL_REF resolving from `Brief.goal` at render; change goal ⇒ every primary re-points. Links NEVER reference the goal (explicit-only; "buttons convert, links navigate"). Secondary CTA: no default (D14), user-configured in button modal (detach from GOAL_REF / pick dest).
4. **Derived links**: nav ← sitemap · legal ← site settings (privacy generator exists) · social ← site-level socialProfiles list (scrape-prefilled into Brief, editable in editor — D13; new editor panel) · cross-page ← sitemap slugs.
5. **ONE shared link popover** — delete the 6 per-template `LinkTargetPopover` copies (meridian/techpremium/vestria/surge/lumen/granth); shared component writes `Link` objects.
6. **Migration: dual-read shim, no data migration** — raw `href` (`#x`→section, `/x`→page, url→external) and old `buttonConfig` (`type: link|form|link-with-input|page`) map losslessly into Destination on read; new writes = new shape only.
7. **Analytics** (D15 + §11.7): conversion beacon fires on primary AND secondary clicks, payload `{ role, placement: enclosing section id }` → analytics shows WHICH button converted (hero vs footer). Extend `a.v1.js` beacon + `PageAnalytics` aggregation + dashboard rendering. Rebuild published assets (`npm run build` — buildAssets step).
8. **Dual-renderer discipline**: every touched block updates `.tsx` AND `.published.tsx`; content-parity test extended to CTA href output.

## Scope OUT
Mechanism-specific machinery — store badges, follow-social block behavior, form auto-seed, WhatsApp prefill template (spec 05). Goal editing UI beyond what exists.

## Acceptance
Change a project's goal form→WhatsApp ⇒ every primary button re-points, zero copy change, published HTML correct. Footer nav/social links unchanged by goal edits. Old saved pages render identically through the shim (golden/parity tests). Beacon events carry role+placement; dashboard splits conversions per placement. ×6 popovers deleted, one shared popover in all templates, editor↔published parity green.

## Open questions
1. `link-with-input` legacy type: fold into `external` + formId or keep? (coder maps losslessly, lean fold)
