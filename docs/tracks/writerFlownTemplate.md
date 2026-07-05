# docs/tracks/writerFlownTemplate.md — Writer Vertical + Granth Template

Track plan doc (single doc for this track, like docs/tracks/meridianPlan.md / docs/tracks/nsoPlan.md).
**Visual source of truth: `template-design/WRDirection1Granth.html` (repo root).** Design brief: `docs/tracks/writerDesignBrief.md`.

---

## 0. Context & Goal

- **What:** profile sites for Hindi literature writers — "more than link-in-bio, less than a website." One page: identity → bio → books (Amazon outlinks) → one poem → praise → follow.
- **Why:** pilot vertical for the platform's evolution from SaaS-landing-page builder to website-builder-for-everyone. Warm network (user's Hindi-literature seniors), zero CAC, free tier on `{slug}.lessgo.site` = exposure + viral loop in a dense community. Marketing channel, NOT a revenue segment.
- **CTA model:** soft conversion only — social follow + external buy links (Amazon). **No forms, no booking.** This is the first zero-form audience on the platform.
- **Language:** Hindi-only v1 (Devanagari-first). No bilingual toggle, no translation pipeline.
- **Copy:** manual/white-glove in pilot. Writers have their own words; NO Hindi generation pipeline in v1.

## 1. Decisions locked (PO discussion 2026-07-03)

| # | Decision |
|---|----------|
| 1 | **Persona ≠ audienceType.** Writer is a new persona; `writer` is added as an `AudienceType` enum VALUE only — do NOT clone the product/service machinery (no new generation store, no strategy pipeline, no onboarding route in v1). |
| 2 | **Pilot = manual seeding.** No `/onboarding/writer` route in Phase A. User seeds projects white-glove (naayom/Kundius motion). Onboarding = Phase B, behind a gate. |
| 3 | **One parametric template (`granth`), not template-per-variation.** Variation lives in variants × palettes × curated "looks" (presets). New template only for genuinely new structure. |
| 4 | **Font pairing is a variant dimension.** Serif-led (Tiro) default + sans-led (Mukta) alternate — token swap, not new template. |
| 5 | **Single-source block pilot.** Extend Lumen's shared `styles.ts` pattern toward one-source-per-block; fallback = proven `.tsx`/`.published.tsx` clone path if it fights back. |
| 6 | **Free tier on subdomains.** `{slug}.lessgo.site` already works (middleware Branch A, `src/middleware.ts:72-113`). Static export → marginal cost ≈ 0. |
| 7 | **Bespoke-adjacent containment.** Granth registered + renderable but ABSENT from onboarding picker (Lumen precedent, `registry.ts:80`). |
| 8 | Pilot cap ~5 writers, then gate. Does not delay SEO merge / scalifix republish. |

## 2. Design spec — Granth (from `template-design/WRDirection1Granth.html`)

### Palette tokens (CSS vars, applied via `[data-palette]`)

**`sinduri` (default):** paper `#f8f3e9` · paper-2 `#f0e8d8` · ink `#2b2118` · ink-soft `#6f604f` · accent `#8a2f2b` · accent-ink `#f8f3e9` · hairline `rgba(43,33,24,.22)` · gold (ornament only) `#a3762a`

**`neel` (alternate):** paper `#f2f4f3` · paper-2 `#e7ebe9` · ink `#1d2430` · ink-soft `#5a6472` · accent `#2b4a7a` · gold→`#7a8aa8`

Room to add more later (`van` forest-green etc.) — palette family designed for growth like hearth/lex 9-palette families.

### Type

- **Display/heading/body:** Tiro Devanagari Hindi 400 (single weight — hierarchy via size, never faux-bold)
- **Captions/labels/buttons:** Mukta 300/400/500/600, letterspaced
- Scale: display clamp(2.6–4.6rem) lh 1.35 · heading clamp(1.6–2.2rem) lh 1.45 · body 18px **lh 1.85** · caption Mukta .78rem ls .22em
- **Devanagari rules:** generous leading (matras), NO italics for Hindi (weight/color emphasis only), Devanagari numerals (१९४८, २०२१) in facts/years
- **Variant `adhunik` (sans-led):** display/headings switch to Mukta Light/Regular; body stays Tiro (or Mukta per token) — pure token swap

### Signatures (what makes it Granth)

Centered symmetric composition · arched portrait frame (`border-radius:999px 999px 8px 8px` + inset hairline) · gold ornament dividers (`—❖—`) · book covers as CSS-typeset jackets with page-block shadow + inset frame (must tolerate real scanned covers later) · poem on a double-framed "page" card on paper-2 · hairline-divided facts row · double-rule section borders.

## 3. Architecture — where writer plugs in

### 3.1 Type contracts — `src/types/service.ts`

- `audienceTypes` → add `'writer'`
- `templateIds` → add `'granth'`
- `defaultVariantForTemplate.granth = 'granth'` (serif-led); second variant `'adhunik'`
- `defaultTemplateForAudience.writer = 'granth'`
- `usesTemplateModule()` → return true for `audienceType === 'writer'`
- `granthPalettes = ['sinduri','neel']` + `palettesForTemplate()` branch
- `templateLabels.granth = 'Granth'`, blurb: `'Hindi literary — ivory paper, maroon accent, Devanagari-first.'`
- **Persona:** add `'writer'` to `userPersonas` + labels/descriptions + `personaToAudienceType('writer') → 'writer'`. Keep it OUT of `/api/start` active gate in Phase A (waitlist or hidden — see Unresolved Q1).

⚠️ **Blast radius (Divider-removal lesson):** `Record<TemplateId,…>` and `Record<AudienceType,…>` exhaustive maps exist across the repo (registries, pickers, surfaces, prompts). Strategy: make the type change, then `npm run build` and fix iteratively via TS errors. Grep ALL readers; also check keyword scorers + golden tests (field-drop regression memory).

**DB:** `Project.audienceType` / `templateId` are strings in Prisma — expect NO migration. Verify; if any enum constraint exists, `prisma migrate dev` (never `db push`).

### 3.2 Registry — `src/modules/templates/registry.ts`

Add `granth` loader with the standard module surface (`resolveBlock`, `ThemeInjector`, `SSRTokens`, `getSurfaceForSection`, `defaultPaletteId`, `variants`, `defaultVariantId`, `paletteImageKeywords`). Dynamic import ONLY (firewall). Comment it like lumen: registered + renderable, absent from picker.

### 3.3 Template module — `src/modules/templates/granth/`

**Clone base: `lumen`** (closest precedent: bespoke containment, contained editable component `LumenEditable.tsx`, external-link popover `LinkTargetPopover.tsx`, per-block shared `styles.ts`, `registration.test.ts`). Follow `docs/guides/newTemplate.md` for the full checklist.

```
granth/
  tokens.ts            # CSS vars from §2; variant token sets granth|adhunik
  palettes.ts          # sinduri, neel
  sectionRules.ts      # surface per section (data-surface: paper / paper-2 alternation per Granth HTML)
  ThemeInjector.tsx / components/GranthSSRTokens.tsx
  resolveGranthBlock.ts
  paletteSelection.ts  # trivial for 2 palettes; default sinduri
  imageKeywords.ts
  index.ts
  registration.test.ts
  components/GranthEditable.tsx        # clone LumenEditable
  blocks/{Hero,About,Books,Writing,Praise,Footer}/
```

### 3.4 Sections & content contract

Six sections, `${type}-${uuid}` IDs. **Dev investigation required first:** how Lumen registered its section types/layouts (`src/modules/sections/sectionList.ts`, layout schema, `elementDetermination.ts`, both componentRegistries) — reuse existing section types where they exist; register new ones (`books`, `writing`) the same way Lumen's Portfolio/Process registered. One layout per section in v1 (all Granth-named for containment, e.g. `GranthJacketShelf`).

| Section | Layout (v1) | Elements | Optional |
|---|---|---|---|
| hero | `GranthArchedHero` | role_line, name, quote, portrait_image, cta_label(+anchor), socials[] | no |
| about | `GranthParichay` | heading, bio_paragraphs[1–3], facts[0–4]{value,label} | no |
| books | `GranthJacketShelf` | heading, lead, items[2–8]{title, kind, year, blurb, **buy_url (external)**, cover_image?} | no |
| writing | `GranthFramedPage` | label, title, lines[], signature | **yes** |
| praise | `GranthCriticsGrid` | quotes[1–3]{text, source}, awards_line | **yes** |
| footer | `GranthFollowFooter` | heading, note, socials[], copyright | no |

Contract rules: page must compose with `writing`/`praise` dropped (brief requirement) · books cover_image optional — CSS-typeset jacket is the default, real cover replaces the face only · all outbound links `target="_blank" rel="noopener"` · socials ordered Facebook, YouTube first · store years/facts as strings (Devanagari numerals authored, no formatter in v1).

### 3.5 Blocks — single-source pilot (Decision 5)

Per block, target this shape:

```
blocks/Hero/
  styles.ts               # ALL layout/CSS (Lumen pattern, extended)
  GranthHero.core.tsx     # server-safe render: no hooks, no 'use client', flat props;
                          # takes an `E` element-renderer prop (Txt/Img/Link primitives)
  GranthHero.tsx          # 'use client' wrapper: passes editable primitives (GranthEditable)
  GranthHero.published.tsx# thin wrapper: passes static primitives (plain tags)
```

Parity by construction: wrappers stay ~10 lines; every layout change lands in `.core.tsx` once.

**Why this does NOT recreate the published/client 500 burn:** `'use client'` is a module-graph marker; the shared `.core.tsx` carries NO directive — it is a plain module (styles.ts extended to JSX). Import arrows only ever point client→plain and server→plain; published never imports from a client-marked file. Rules that make it hold: (a) core takes FLAT props only — anything a hook computes runs in the client wrapper and is passed down as data (same rule `.published.tsx` already obeys); (b) core never imports hooks/stores/GranthEditable — editing behavior lives entirely inside the injected primitives; (c) primitives typed in a plain module (`GranthPrimitives { Txt, Img, Link }`) so both wrappers implement one contract.

**Mandatory enforcement (not optional):** a node-environment vitest that imports every `granth/**/*.core.tsx` and `renderToStaticMarkup`s it with fixture props — any hook/store/client import added to a core file fails `npm run test:run` immediately, instead of 500ing at publish. Optionally add an ESLint `no-restricted-imports` fence on `**/*.core.tsx` (react hooks, `@/hooks/*`, `@/stores/*`, `*Editable*`).

**Structural-divergence rule:** if a block's edit vs published output differs structurally (interactive JS wiring, e.g. Lumen lightbox), pair-clone THAT block; core-pattern the rest. Granth v1 has zero interactive blocks — that's why it's the safe pilot. **Escape hatch:** if the primitive-injection pattern fights the editor toolbar/selection machinery on the first block (Hero), stop, fall back to the proven Lumen pair-clone for all blocks, and note it here — do not burn days on it. Keep `data-surface` attributes template-agnostic either way.

### 3.6 Fonts — self-hosted Devanagari (new capability)

1. Download woff2 (latin+devanagari subsets): **Tiro Devanagari Hindi** 400 (+400 italic for stray Latin only), **Mukta** 300/400/500/600 → `public/fonts/tiro-devanagari-hindi/`, `public/fonts/mukta/`
2. `@font-face` entries in `src/styles/fonts-self-hosted.css` with `font-display: swap` + correct `unicode-range` for Devanagari + Latin subsets (match existing file's conventions)
3. `src/modules/templates/CriticalFontPreload.tsx` → preload Tiro Devanagari (hero/LCP font) for `templateId === 'granth'`
4. `scripts/buildAssets.js` copies fonts CSS — verify Devanagari woff2 flows into the published bundle; **`npm run build` required** for published.css/assets changes
5. QA Devanagari rendering: Windows Chrome, Android Chrome (primary visitor device), conjuncts + matras at display size

### 3.7 Publishing & free tier

- Publish path is template-agnostic — no changes expected. Verify `scripts/buildPublishedCSS.js` picks up granth block styles.
- Subdomain routing already live (middleware Branch A → `/p/{slug}`).
- **Verify FREE plan can publish** (`src/lib/planManager.ts`) — subdomain publish IS the product here. Set FREE credit cap suitable for zero-AI pilot (generation unused in v1).
- "Made with Lessgo" badge on FREE-plan published pages: footer line + link. Small, dignified, matches palette. (Phase A2; see Unresolved Q4.)

### 3.8 Seeding (pilot ops)

Manual white-glove: create project with `audienceType='writer'`, `templateId='granth'`, `variantId`, `paletteId`, hand-authored Hindi `content` JSON matching §3.4 contract. Recommend `scripts/seedWriter.ts` taking a small per-writer JSON (name, bio, books+urls, socials, poem, quotes) → creates token+project via Prisma (mirror the naayom seed approach). Then normal edit → preview → publish flow.

## 4. Phases & gates (pilot-first)

> **BUILT 2026-07-04** (Phase A steps 1–5, 7 complete; build/tsc/`test:run` green — 551 tests).
> Fonts self-hosted (Tiro Devanagari Hindi + Mukta, devanagari+latin subsets, unicode-range split);
> `writer` audienceType + `granth` template wired (blast-radius collapse sites patched to preserve
> writer); module cloned from Lumen (bilingual stripped); **single-source `.core.tsx` pattern = GO**
> (all 6 blocks: styles + core + edit/published wrappers via shared edit/published primitives;
> core-purity vitest enforces it); `writerElementSchema` (6 Granth* layouts) merged; dev seed at
> `/dev/seed-writer?token=…`. Full published-path smoke (registry→resolveBlock→SSRTokens→6 blocks)
> renders the seeded अरण्य page green. **Remaining before GATE A:** step 6 editor smoke + GATE A
> parity QA (browser, needs Clerk session) — user step.

### Phase A — build the vertical slice
1. Fonts (§3.6) — foundation, do first
2. Type contracts + registry (§3.1–3.2), build green iteratively
3. Template module: tokens/palettes/sectionRules/ThemeInjector (§3.3)
4. Blocks: Hero FIRST via single-source pattern (§3.5) → go/no-go on the pattern → remaining 5 sections
5. Section/layout registration + both componentRegistries (§3.4)
6. Editor smoke: edit all elements, external-link editing on books/socials, palette+variant swap
7. Seed 1 test writer (fictional केशव नारायण 'अरण्य' content from the HTML) → publish → live on `{slug}.lessgo.site`

**GATE A:** published page vs `template-design/WRDirection1Granth.html` side-by-side parity (desktop + 360px mobile) + user approval.

### Phase A2 — pilot ops
Badge on FREE published pages · FREE-plan publish verification · seed 3–5 real writers · collect reactions.

**GATE A2:** ≥3 writers live + community response → decides Phase B.

### Phase B — deferred (separate approval, own spec section later)
`/onboarding/writer/[token]` thin 3-step intake (identity → works/links → socials) · profile-site engine (deterministic assembly + optional AI Hindi polish — NO strategy phase) · persona page entry active · traits fields (`offerKind/conversionAction/siteShape`) written by this route first.

### Out of scope (all phases here)
Hindi generation pipeline · blog injection · bilingual toggle · template picker listing · multi-page · traits refactor of product/service · testimonial-system integration.

## 5. Testing & quality bar

- `registration.test.ts` (lumen precedent) + template dispatch regression suite must stay green
- `npm run build` + tsc + `npm run test:run` green locally BEFORE push to main (no-PR workflow; Vercel auto-deploys)
- Manual (docs/guides/TESTING.md style): editor↔published parity per section · 360px mobile · palette/variant toggles · optional-section drop (no writing, no praise) · 2-book and 8-book shelf · long names (e.g. "केशव नारायण 'अरण्य'") · all outlinks `_blank noopener` · Lighthouse on published page (fonts subset properly; LCP = hero name)
- ⚠️ Dual-renderer trap + published/client boundary memories apply to every block
