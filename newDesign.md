# newDesign.md — Stream A: Design System Overhaul

Lift the design-system ceiling. Addresses "plain/boring/not pretty" feedback. Universal — benefits all future generations regardless of business type.

**Scope:** tokens, visual primitives, UIBlock retrofit (dual renderer), generation prompt updates, lint infra.
**Out of scope:** business-type fork, new vertical UIBlocks, preset bundles, image pipeline (Stream B).

---

## 1. Problem

v3 vibes currently emit only `fontHeadline / fontBody / accentEnergy / toneProfile` (verified `vibeDesignTokens.ts`). Structural decisions — spacing, radius, density, elevation, text tones, display scale, accent discipline — baked into UIBlock JSX. Consequence: every vibe = same shape in different colors.

Evidence: `page-1776101655875.lessgo.ai_.png` — copy 7/10, design 4/10. Ceiling is the engine, not one-off bugs. (n=1 — need 2-3 more data points before full 8-12 week commit; mitigated by compressed slice below.)

---

## 2. Architecture constraints (read first)

**Dual renderer — non-negotiable.**
- Editor: `LandingPageRenderer` — CSS variables + Zustand store, client-side, hooks
- Published: `LandingPagePublishedRenderer` — props-only, inline styles, server-rendered, no hooks
- 96 UIBlock files: 48 `.tsx` (editor) + 48 `.published.tsx` (published)
- **Every token must land in both mechanics.** CSS var for editor; inline style resolution for published.

**Tailwind JIT pitfall.**
- JIT doesn't compile `rounded-[var(--radius-card)]` reliably
- Strategy: pre-declared `@layer components` utilities (e.g., `.card-radius`) that resolve to CSS vars at runtime, plus inline-style fallback for published renderer

**Legacy published pages.**
- Stored as frozen blob HTML (Phase 2 static export from schema)
- Do NOT auto-update on renderer change. Only re-publish regenerates.
- Requires user comms plan (email beta users: "re-publish to refresh").

---

## 3. Principles

1. **Vibe = full design language.** Controls spacing, radius, density, elevation, display scale, accent discipline — not only color+font.
2. **Restraint > flourish.** Single accent, ≥85% neutral. Confidence = minimalism + typographic commitment.
3. **Hero carries 80%.** Display scale + commitment invested first.
4. **Universal lifts > vibe-specific features.**
5. **Tokens consumed, not referenced.** UIBlocks read tokens; zero hardcoded `rounded-xl`, `py-16`, `text-gray-600`. Lint-enforced.
6. **Both renderers or neither.** No token ships editor-only.

---

## 4. Token Expansion (P0)

### 4.1 Display scale

| Token | Desktop | Mobile | Line-height | Tracking |
|---|---|---|---|---|
| `type.d1` | 120px | 56px | 0.94 | -0.03em |
| `type.d2` | 96px | 52px | 0.94 | -0.025em |
| `type.d3` | 72px | 44px | 1.00 | -0.02em |
| `type.d4` | 56px | 36px | 1.10 | -0.015em |

Per-vibe hero default. Not universal d1 — Calm Minimal stays d2.

### 4.2 Text tone ladder

| Token | Light surface | Dark surface |
|---|---|---|
| `fg.1` | ink | bone |
| `fg.2` | ~60% mix w/ surface | ~60% mix w/ surface |
| `fg.3` | ~40% mix w/ surface | ~40% mix w/ surface |

**Values: OKLCH build-time mix, not hand-tuned.** 5 vibes × 3 levels × 2 surfaces = 30 hand-tuned values = drift disaster.

### 4.3 Accent discipline

- One `accent` token per vibe
- Rule: ≥85% neutral in any composition
- No raw semantic colors in UIBlocks — checkmarks, stars, highlight badges route through `accent` or `fg.2`
- Lint-enforced (§7)

### 4.4 Radius axis

Subsumes existing `buttonShape.ts` — delete separate config.

| Philosophy | `radius.card` | `radius.button` | `radius.image` |
|---|---|---|---|
| sharp | 0 | 0 | 2 |
| soft | 12 | 8 | 8 |
| pill | 24 | 9999 | 16 |

Per-vibe default: Bold Energy=sharp, Dark Tech=soft, Light Trust=soft, Calm Minimal=soft, Warm Friendly=pill.

### 4.5 Density axis

Desktop + mobile both required.

| Density | Section py (D/M) | Card p (D/M) | Gap (D/M) |
|---|---|---|---|
| compact | 48 / 32 | 16 / 16 | 16 / 12 |
| standard | 80 / 48 | 24 / 20 | 24 / 16 |
| spacious | 128 / 64 | 32 / 24 | 32 / 20 |

Per-vibe default: Bold Energy=compact, Dark Tech=standard, Light Trust=standard, Warm Friendly=standard, Calm Minimal=spacious.

### 4.6 Elevation

One representation — concept tokens, resolved per renderer.

| Token | shadow | subtle | hairline |
|---|---|---|---|
| `elevation.card` | strong box-shadow | light box-shadow | 1px top rule |
| `elevation.button` | strong | medium | none |
| `elevation.heroImage` | strong | medium | none |

Per-vibe: Dark Tech + Bold Energy → shadow; Light Trust + Warm Friendly → subtle; Calm Minimal → hairline.

### 4.7 Mono font slot

| Vibe | Mono | Eyebrow fallback |
|---|---|---|
| Dark Tech | JetBrains Mono | mono |
| Light Trust | IBM Plex Mono | mono |
| Warm Friendly | — | sans sm uppercase tracked (no mono) |
| Bold Energy | JetBrains Mono | mono |
| Calm Minimal | IBM Plex Mono | mono |

### 4.8 Semantic text roles

| Role | Typography | Example |
|---|---|---|
| `eyebrow` | mono sm uppercase tracked (or sans fallback per §4.7) | "01 — What we do" |
| `lede` | sans xl, fg.1 | hero tagline |
| `body` | sans md, fg.1 | paragraph |
| `quote` | serif lg italic, or sans lg | pullquote |
| `meta` | mono sm, fg.3 | captions, timestamps |

---

## 5. Visual Richness (P1)

### 5.1 Decorative background layer

Hand-crafted SVG per vibe (v1). Generative = rabbit hole, deferred.

| Vibe | v1 SVG treatments |
|---|---|
| Dark Tech | gradient mesh, grid pattern |
| Light Trust | soft blur blob |
| Warm Friendly | organic blob + grain |
| Bold Energy | hard gradient + color bloom |
| Calm Minimal | offset hairline rule |

Component: `<SectionBackground variant={...} />` absolute-positioned. Must work in both renderers (props-only for published).

### 5.2 Integrated scroll-aware header

- Header = overlay on Hero (absolute position)
- Scroll >80px → solid bg + hairline bottom
- Nav color adapts: **vibe metadata flag** (`heroSurfaceLuminance: 'dark' | 'light'`), not runtime compute — avoids flicker
- Hero UIBlocks add top padding = header height

### 5.3 Hero commitment

- Min-height 85vh desktop
- Headline binds to d1 or d2 per vibe
- Remove forced border + shadow on hero image

---

## 6. Generation pipeline updates (P0 — its own sub-project)

Rendering tokens are useless if generation emits old content shapes.

### 6.1 Strategy prompt (`promptsV3.ts`)
Add output: `headlineIntent: 'committed' | 'measured'`, `decorationIntent: 'rich' | 'minimal'`, `copyVoice` per-type. Consumed by copy prompt + UIBlock selection.

### 6.2 Copy prompt (`copyPromptV3.ts`)
Emit structured output w/ semantic roles:
```json
{
  "hero": {
    "eyebrow": "01 — Invoicing",
    "headline": "Get paid. Faster.",
    "lede": "Stop chasing. Start billing."
  }
}
```
Current flat-string headline insufficient. Prompt rewrite required — not a one-line change.

### 6.3 Element schema (`layoutElementSchema.ts`)
Add role types: `eyebrow`, `lede`, `quote`, `meta`. Components read role → typography binding.

### 6.4 Voice guidance
"Short sentences. Fragments fine. Rhythm matters." per design.md. Baked into copy prompt per vibe.

---

## 7. Lint infra

- **CI check** (fail build) + optional pre-commit
- Banned in UIBlock `.tsx` / `.published.tsx`: raw `rounded-*` (except `rounded-full` for avatars — whitelisted), `py-*`, `px-*`, `shadow-*`, `text-gray-*`, color hex, `text-green-*`, `text-yellow-*`
- Enforces token-only consumption post-retrofit

---

## 8. Vibe redefinition (5 vibes × full bundles)

| Vibe | Display | Density | Radius | Elevation | Mono | Decoration | Hero luminance |
|---|---|---|---|---|---|---|---|
| Dark Tech | d1 | standard | soft | shadow | yes | grid+mesh | dark |
| Light Trust | d2 | standard | soft | subtle | yes | blur blob | light |
| Warm Friendly | d2 | standard | pill | subtle | no | organic+grain | light |
| Bold Energy | d1 | compact | sharp | shadow | yes | hard gradient | varies |
| Calm Minimal | d2 | spacious | soft | hairline | yes | offset rule | light |

Editorial vibe — deferred to Stream B preset bundles (design.md tokens).

---

## 9. Retrofit strategy — 96 files

**Phase 1 — plumbing (both renderers)**
- CSS vars for editor
- Inline-style bridge for published (tokens → flat style object via resolver)
- No visual change

**Phase 2 — high-traffic first**
- Hero (4) + `.published.tsx` (4) = 8 files covering ~25% of rendered impressions
- Behind `NEXT_PUBLIC_NEW_DESIGN` **kill switch** (not A/B — beta volume too small)

**Phase 3 — expand after checkpoint (§10)**
- CTA + Features + Pricing + 1 vibe tuned end-to-end → ship to beta → measure → fund remainder if signal

---

## 10. Rollout — 3-week compressed slice, then checkpoint

Full 8-12 week plan without proof is PMF-off-ramp. Compress to testable slice.

| Week | Deliverable (both renderers always) |
|---|---|
| 1 | Token infra: CSS vars + inline-style bridge; density/radius/elevation/display/fg tokens defined; lint rule in CI; buttonShape subsumed |
| 2 | Hero retrofit (4 editor + 4 published) + display scale wired + generation prompt updated to emit eyebrow/lede/headlineIntent |
| 3 | Dark Tech vibe fully tuned end-to-end (one complete vibe in all high-traffic UIBlocks, generation + render) |
| **Checkpoint** | **Ship to beta. Measure. If signal → fund remaining 5-9 weeks for CTA/Features/Pricing + long tail + 4 remaining vibes + decorative layer + header overlay. If not → kill.** |

Dark Tech first: highest visual leverage, existing user base skews tech.

---

## 11. Success criteria

**Quant (one signal, pre-committed):**
- Share-rate lift ≥20% on Dark Tech published pages (new design vs old), OR
- Published page edit-rate drop ≥30% (users less motivated to fix bad design)

Pick one before W1.

**Qual secondary:**
- 3+ user quotes containing "doesn't look templated" / "looks designed" / equivalent

**Not criteria:**
- Subjective design score (unreliable)
- Time on page (noisy, confounded)

---

## 12. User comms (legacy pages)

- Currently-published pages stay at 4/10 — frozen blob HTML, no auto-update
- Email beta users at ship: "Re-publish to refresh design" + explainer
- Dashboard banner for unpublished drafts: "New design available"
- Don't silently regenerate — respect user consent

---

## 13. Explicitly out of scope (Stream B)

- Business-type fork (SaaS/Agency/Coach/Local)
- New vertical UIBlocks (FullBleedHero, GalleryGrid, PhotoLedFounder, StatsStrip)
- Image pipeline (user upload, AI-gen)
- Editorial vibe / preset bundles
- Copy voice changes beyond semantic role emission

---

## 14. Open questions

1. Share-rate OR edit-rate as quant signal — pick one before W1
2. Dark Tech as checkpoint vibe, or Light Trust (broader appeal)?
3. Published-renderer token resolver — build-time compile or runtime inline-style object?
4. Eyebrow content — copy prompt emits numbered ("01 —") or freeform?
5. Old UIBlocks during retrofit — version-lock snapshot or accept regression on edit?
6. Beta comms timing — email at W3 ship or wait for checkpoint decision?
7. Lint rule strictness — hard fail CI from W1 or warn-only for 1 sprint?
8. Accent discipline retrofit — include in W2 Hero or defer to post-checkpoint?
9. Tailwind `@layer components` utilities pre-declared where — single file or per-token?
10. If checkpoint signal ambiguous (modest lift) — fund partial or kill?
