# atelier-template — Phase 9 PORT SPEC (approved design)

**Approved source (founder-confirmed 2026-07-12):** `template-design/designer-workspace/atelier/`
(5 pages: index/work/experiences/about/contact + `styles.css` + `style-system.html`).
Brief: `template-design/designer-workspace/uploads/atelierKonturBrief.md`. Real Kundius images:
`template-design/designer-workspace/delivery/assets/`. **Ignore `delivery/Atelier/app.js`** — it's a
different/older build (`.nav/.cell/.gallery/lightbox` — not present in `atelier/`). The REAL hero-slider JS
is an INLINE `<script>` at the bottom of `atelier/index.html` (~L252-292). `atelier/` otherwise uses ZERO JS
(nav, mobile drawer, work filter all CSS-only).

## ⚖️ Orchestrator reconciliation rulings (design → our template conventions)
1. **Class prefix:** design uses `atl-*`; OUR template must use `lg-atelier-*` (kit/skill landmine). Port
   renames every `atl-` class → `lg-atelier-` in block markup + styles.ts. (Keep the STRUCTURE/CSS values
   identical; only the prefix changes.)
2. **CSS vars:** design uses design-specific `--atl-*` names. Reconcile with phase-6 tokens.ts which already
   defines atelier's token system + knob vars (`--btn-r`, `--card-*`, etc.). Port maps the design's
   `--atl-paper/-ink/-accent/-line/-btn-radius/-space/-card-*` onto atelier's tokens.ts token set. Data-surface
   (`base|alt|dark`) + data-palette stay the axis mechanism. NOTE design applies knobs via `[data-variant~=...]`
   tilde-match — our platform uses `[data-knob-<axis>=...]` (phase 6). Port must wire the design's knob CSS to
   OUR `[data-knob-*]` selectors (phase-6 mechanism), NOT `[data-variant~]`.
3. **Knob values (align phase-6 declaration to what the design actually ships):**
   - buttonShape: square(default `0px`) / rounded(`10px`) / pill(`999px`) — all 3 real. ✓ matches standard vocab.
   - cardStyle: design ships **hairline(default)** + **flat** ONLY (no shadow). → atelier cardStyle values = `['hairline','flat']` (subset of standard {hairline,shadow,flat} — valid). If phase-6 declared shadow, DROP it.
   - density: design ships **regular(default,`--atl-space:1`)** + **dense(`0.82`)** ONLY (no spacious). Map to standard vocab: regular→`comfortable`(default), dense→`compact`. → atelier density values = `['comfortable','compact']`. If phase-6 declared spacious, DROP it. (This may require touching index.ts knob declaration + the assertKnobConformance line — fold into phase 9a scope; note it.)
   - typePairing/texture stay default-only (phase 6).
4. **Fonts:** design uses Bricolage Grotesque with **opsz+wght** axes (opsz 12-96 matters). Phase-8 shipped the
   wght-only fontsource file. **Optional refinement (flag for parity QA):** swap/add the opsz-inclusive Bricolage
   woff2 if optical sizing reads off; port with `font-optical-sizing:auto`. Not a blocker.
5. **Sections not in the 8-block set:**
   - `.atl-closer` (full-bleed CTA band, on every page) — map into the **Footer** block scaffolding OR a Hero
     "closer" mode; implementer decides + documents. Not a new registered section type.
   - `.atl-page-head` (dark inner-page hero band: label + h1 accent `<em>` + lede) — the inner-page counterpart
     to home `hero`. Render via the **Hero** block in a "page-head" mode (multipage subpages), NOT a new type.
   - Marquee = part of the **Hero** region (home only), a `.atl-marquee` band after `.atl-cover`. Belongs to the
     Hero block (home) or a dedicated sub-element; NOT the QuoteBand (QuoteBand is a separate static dark quote grid).
6. **EN/NL toggle** = visual only (buttons + `aria-pressed`); real bilingual is the platform i18n layer (inherited).
   Header renders the toggle; actual locale switching = platform `LanguageToggle`/`switcher.v1.js` (not template JS).

## Design tokens (styles.css :root L11-37)
- Neutrals: `--atl-paper: oklch(0.978 0.004 95)`, `--atl-paper-2: oklch(0.945 0.006 95)`, `--atl-ink: oklch(0.165 0.010 60)`, `--atl-ink-2: oklch(0.385 0.012 60)`, `--atl-ink-3: oklch(0.560 0.012 62)`
- Accent (vermilion default): `--atl-accent: oklch(0.585 0.205 31)`, `--atl-accent-d: oklch(0.535 0.210 31)` (legible on paper)
- Hairlines: `--atl-line: oklch(0.165 0.010 60 / 0.16)`, `--atl-line-d: oklch(0.978 0.004 95 / 0.20)`
- Fonts: `--atl-serif:"Bricolage Grotesque"` (display), `--atl-sans:"Hanken Grotesk"` (body)
- Layout: `--atl-maxw:1380px`, `--atl-px:clamp(20px,5vw,76px)`, `--atl-sec-y:calc(clamp(72px,10vw,150px)*var(--atl-space))`
- Knob vars: `--atl-btn-radius:0px`, `--atl-space:1`, `--atl-card-border:var(--atl-line)`, `--atl-card-bg:var(--atl-paper)`
- Headings: serif, weight 600, `line-height:0.96`, `letter-spacing:-0.02em`; sizes via inline `clamp()` per component (no numeric type-scale tokens). Form input radius = `calc(--atl-btn-radius / 2)`.

## Palettes (styles.css L40-42; style-system L58-113) — `[data-palette="…"]`, body default `vermilion`
- vermilion(default): accent `oklch(0.585 0.205 31)` / -d `oklch(0.535 0.210 31)`
- cobalt: `oklch(0.585 0.170 262)` / `oklch(0.490 0.180 262)`
- moss: `oklch(0.600 0.135 150)` / `oklch(0.500 0.135 150)`
- ochre: `oklch(0.680 0.140 70)` / `oklch(0.540 0.130 66)`

## Per-block markup (design classes shown as `atl-*` → rename to `lg-atelier-*`)
- **Header** `.atl-nav` (+`.solid` inner pages: sticky blurred paper; bare = overlay over dark hero). `.atl-nav-in` 3-col grid `1fr auto 1fr`: left nav links `a.atl-nl`, center `.atl-brand>.atl-wm` (dot-prefixed wordmark), right = Contact link + `.atl-lang` EN/NL toggle (`aria-pressed`) + `.atl-btn-nav` CTA + `.atl-burger`. CSS-only mobile: top-level `<input id="atl-menu" type=checkbox>` + sibling `.atl-drawer` toggled by `<label for="atl-menu">`. Active link `aria-current="page"`. **Two modes (overlay vs solid) required.**
- **Hero** `.atl-cover` (min-h clamp 560-920, flex-center). `.atl-slides[data-atl-slider][data-interval="5000"]` > N `.atl-slide`(first `.is-active`) each `.atl-ph.dark`+`.atl-ph-num`(giant "01")+`.atl-tag`; slides absolute `opacity 0→1` crossfade `1.2s`. `.atl-cover::after` scrim. `.atl-cover-in`(z2): `.atl-label` eyebrow, `h1`(lines as `<span>`, accent line in `<em>`=vermilion), `.atl-tagline`, `.atl-cover-actions`. `.atl-arrows`>`button.atl-arrow-prev/next[data-atl-prev/next]`(SVG chevrons). `.atl-dots[data-atl-dots]` EMPTY (JS injects). `.atl-scroll` cue. **No-JS: first `.is-active` visible; arrows/empty-dots inert.** #1 PARITY CONTRACT — keep hooks exact: `data-atl-slider`, `data-interval`, `.atl-slide/.is-active`, `[data-atl-prev/next]`, `[data-atl-dots]`, `.atl-dot`, `.atl-cover`.
- **Marquee** (hero region, home only) `.atl-marquee[data-surface=dark][aria-hidden=true]` after `.atl-cover`; `.atl-marquee-track` inline-flex `animation:atl-scrollx 32s linear infinite` translateX -50%, repeated `<span>` word tokens; `span::after` vermilion `✳`; content duplicated (×2) for seamless loop; `prefers-reduced-motion` halts. Pure CSS.
- **Work/Gallery** — Home mosaic: `.atl-mosaic`(6-col dense grid) of `a.atl-cell`(+span `.atl-c2/c3/c4`,`.atl-tall`)= `.atl-ph`(aspect `.atl-r32/r45/r11`)+`.atl-cap`(dot-prefixed category); then `.atl-more>a.atl-qlink`. Work page: `.atl-gallery`(CSS `columns:3` masonry) of `.atl-gcell[data-cat]`>`.atl-ph`+`.atl-gcap`(`.t` serif title/`.c` category). Filter = CSS radio hack: 6 `input.atl-filter-input[type=radio][name=atlf]`(#atlf-all checked,-port/-edit/-prod/-inter/-event) BEFORE `.atl-filterbar`(labels)+`.atl-gallery` siblings; `:checked~` hides `.atl-gcell:not([data-cat~=…])`; wrapper `position:relative`.
- **Packages** `.atl-packs`(grid auto-fit minmax(300px,1fr) — survives 2/3/4). `article.atl-pack`(uses `--atl-card-bg/-border`)= `.atl-pack-img`(`.atl-ph` 3:2, optional `.atl-flag` "Most booked" badge)+`.atl-pack-body`: `.atl-pack-cat`(tier), `h3`(name), `.atl-price`(serif,`<small>` unit), `<ul>` features(`li::before`="—"), `.atl-pack-foot>.atl-btn`(full-width). Experiences page adds trailing note `<p>` w/ `.atl-acc` link.
- **About** `.atl-wrap.atl-split`(2-col 1fr 1fr→1). `.atl-split-art`=`.atl-ph` 4:5+`.atl-badge`. `.atl-split-copy`= `.atl-label`,`h2`(accent `<em>`),`<p>` bio,`.atl-sign`(signature serif),`.atl-split-actions`. About page adds Press: `.atl-sec.alt`+`.atl-rule` header+`.atl-press`>`.atl-press-row`(3-col: `.y` year/`.t` title/`.w` publication) + reversed studio-image split.
- **QuoteBand** (static, NOT marquee) `.atl-sec.dark`>`.atl-quotes`(grid auto-fit minmax(320px,1fr), 1-3). `figure.atl-quote`= `.atl-mark`(big serif "),`<p>` quote(serif),`.atl-who` figcaption(`<b>`=accent name). Dark surface, no JS.
- **Contact** `.atl-wrap.atl-contact`(2-col). `.atl-contact-copy`= label,`h2`,`.atl-lede`,`.atl-cd`>`.atl-cd-row`(`.k`/`.v`,`<b>`=serif). `.atl-form`(bordered)= `.atl-form-grid2`(name+email), `.atl-field` blocks(date/occasion + brief textarea), submit `.atl-btn.atl-btn-fill`, `.atl-note`. Inner pages precede w/ `.atl-page-head` dark band.
- **Footer** `.atl-footer[data-surface=dark]`: `.atl-footer-big>.fw`(giant wordmark,`.dot`=accent), `.atl-footer-cols`(3-col 1.6fr 1fr 1fr: desc+contact / Index links / Elsewhere; each under `h4`), `.atl-footer-bottom`(copyright+legal).

## Hero slider JS (inline index.html L252-292 → port to vanilla published asset in phase 10)
Queries `[data-atl-slider]`; `cover=closest('.atl-cover')`; `slides=.atl-slide[]`; bail if <2. Reads `data-interval`(5000). Injects dots into `[data-atl-dots]` as `button.atl-dot[aria-label][aria-current]`, click→`go(i)`+restart. `go(n)`: modulo-wrap, toggle `.is-active`+`aria-current`. `restart()`: setInterval(go(idx+1),interval), skipped if `prefers-reduced-motion`. prev/next → go(±1)+restart. `visibilitychange` pause/resume. Strips `no-js` off `<html>`. **Contract for phase 10 asset:** `data-atl-slider`,`data-interval`,`.atl-slide/.is-active`,`[data-atl-dots]`,`[data-atl-prev/next]`,`.atl-dot`,`.atl-cover` (rename atl-→lg-atelier- consistently; asset selectors must match ported markup).

## Per-page section order (feeds archetype defaults / assembly)
- Home: hero+marquee → work(mosaic) → packages(preview) → quote(dark) → about(teaser) → closer → footer
- Work: page-head → work(filter grid) → closer → footer
- Experiences: page-head → packages(2-4) → quote → closer → footer
- About: about(bio split) → press/recognition → studio split → closer → footer
- Contact: page-head → contact → closer → footer

## Responsive + techniques
Breakpoints 1100 (hide nav CTA + slide tags), 900 (nav→burger drawer, mosaic→2col, gallery 3→2, splits/contact→1col), 560 (mosaic/gallery→1col, form 1col, footer 1col). `overflow-x:hidden` on body. CSS `columns` masonry, `:checked~` filter hack, checkbox-hack drawer, `atl-scrollx` marquee keyframe, oversized numerals/wordmarks, spacing × `--atl-space`. All honor `prefers-reduced-motion`. Placeholders `.atl-ph`(+`.dark`, tone `.t2..t5`, aspect `.atl-r32/r23/r45/r11/r169`) + centered `.atl-tag` = customer image slots.
