# F25 audit — LinkTargetPopover on hearth + lex

Branch: `fix/lane-c` (verified before any edit).

## Files changed

Edit renderers (nav — popover, edit-only):
- `src/modules/templates/hearth/blocks/Header/WarmNavHeader.tsx`
- `src/modules/templates/lex/blocks/Header/LetterheadNav.tsx`

Published renderers (nav — dual-read helper only, output identical for legacy string hrefs):
- `src/modules/templates/hearth/blocks/Header/WarmNavHeader.published.tsx`
- `src/modules/templates/lex/blocks/Header/LetterheadNav.published.tsx`

Edit renderers (footer social links — raw URL input, edit-only):
- `src/modules/templates/hearth/blocks/Footer/ContactFooterRich.tsx`
- `src/modules/templates/lex/blocks/Footer/ColophonFooter.tsx`

New test:
- `src/modules/templates/linkTargetPublished.test.tsx`

Footer `.published.tsx` twins were NOT touched (footer href stays a string — see Deviations).

## What changed, per file

**hearth/lex header (edit) `WarmNavHeader.tsx` / `LetterheadNav.tsx`**
- `NavItem.href` type widened `string → string | Link`.
- Added `useEditStoreLegacy` + `buildSectionLinkOptions`/`buildPageLinkOptions` + section/page/legal/social option memos (identical to surge's nav).
- Added `setItems`/`patchItem`; `updateNavLabel` now delegates to `patchItem`.
- Each nav link wrapped in a `…__link-wrap` span; in `edit` mode mounts `LinkTargetPopover` with `onChange={(link) => patchItem(id, { href: link })}` — keeps the **full `Link` object** (surge nav pattern, per F26 preference), not flattened to a string.
- Added minimal `…__link-wrap` / `…__link-cfg` CSS (copied from surge's header styles, template-recolored).

**hearth/lex header (published) `*.published.tsx`**
- Added a local `resolveLinkHref(string | Link)` helper (byte-for-byte the surge nav helper): legacy string passes through verbatim; a `Link` resolves via `resolveDestination`. `NavItem.href` type widened. `href={item.href || '#'}` → `href={resolveLinkHref(item.href)}`. No layout/CSS change; server-safe (no `'use client'` import).

**hearth/lex footer (edit) `ContactFooterRich.tsx` / `ColophonFooter.tsx`**
- Social links previously let you rename the platform but never set the URL. Added an edit-only raw URL `<input>` bound to `updateSocial(id, 'href', …)` (surge footer's social-link pattern). `href` stays a plain string. Added `…__social-url` CSS.

## How lex is covered (report claim corrected)

The report's premise — *"lex dispatches via `resolveServiceBlock` → hearth's blocks, so fixing hearth fixes lex"* — is **FALSE**. Verified `src/modules/templates/lex/resolveServiceBlock.ts`: lex's registry imports its **own** blocks (`LetterheadNav`, `ColophonFooter`, etc.), keyed by section type. It never touches hearth's `WarmNavHeader`/`ContactFooterRich`. So lex was fixed by editing **its own** header + footer blocks directly (4 lex files above), not transitively via hearth. The `WarmNavHeader` twin-file collision the report warns about is real but irrelevant here — neither template dispatches to the other's file.

## Deviations from the plan

1. **Footer social links use a raw URL input, not `LinkTargetPopover`.** hearth/lex footers own only a `social_links` collection (`{platform, href}` external-profile shape) — there is no internal `footer_links` nav collection like surge's. Surge's *exact* pattern for `social_links` is a raw URL `<input>` (the popover is reserved for surge's `footer_links`). Storing a full `Link` object in a social href would also break the untouched footer `.published.tsx` (`<a href={s.href}>` reads a string). Conservative choice: raw input → href stays a string → footer published twins stay untouched and render identically. This still fixes the finding (footer links become re-pointable).

2. **Header `.published.tsx` twins were modified** (a `resolveLinkHref` helper), which is a narrow exception to "twins untouched." Keeping the full `Link` object in the nav store (the task's stated preference) *requires* the published twin to resolve it, or a re-pointed link would render `[object Object]` after publish. This is exactly surge's proven approach; for legacy string hrefs the rendered output is byte-identical. No CSS/layout change.

## Tests

- New `linkTargetPublished.test.tsx` (6 cases, both templates): legacy string href passes through; section `Link` → `#pricing`; page `Link` → `/contact`. All pass.
- `surge/registration.test.ts`: 46 pass (unaffected, sanity).
- `npx tsc --noEmit`: 0 errors.

## Open risks

- Edit-mode popover mount is not covered by an automated test (needs the Zustand store + jsdom popover context, same gap surge has). Verified structurally: hearth/lex now mount the identical `LinkTargetPopover` surge/meridian use behind `{edit && …}`. Manual editor check recommended.
- No CSS rebuild run (`npm run build`); published-page styling for the new `…__link-cfg`/`…__social-url` classes is edit-only DOM, so `public/published.css` is unaffected — the published twins add no new classes.
