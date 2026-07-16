# Handoff: Lessgo.ai — App UI Redesign

## Overview
Lessgo.ai is an AI website builder: a user describes their business in one sentence and the product generates, then lets them edit, a full multi-page site. This bundle contains high-fidelity design references for **four core surfaces** of the product:

1. **Onboarding Flow** — the "one line → live site" new-site journey (6 steps)
2. **Editor Redesign** — the in-app page/site editor (command bar, toolbar, media, CMS, publish, settings, AI — 20+ screens)
3. **Dashboard** — the signed-in workspace: projects list, opened-project workspace, action screens, account/billing/domains, profile menu, notifications
4. **Auth** — sign up / sign in (founding-member framing)

The signed-out marketing landing page is **out of scope** for this handoff and intentionally excluded.

---

## About the Design Files
The `.dc.html` files in this bundle are **design references built in HTML** — prototypes that show the intended look, layout, copy, and behavior. **They are not production code to copy directly.** They use a lightweight in-house component runtime (`support.js`) and are structured as annotated "option canvases" (multiple design explorations laid out side by side per screen).

**The task is to recreate these designs in the target codebase's environment** (React/Next, Vue, etc.) using its existing component library, styling system, routing, and state patterns. If no frontend environment exists yet, pick the most appropriate framework and implement there. Do not ship the HTML as-is and do not port the `support.js`/`.dc.html` runtime — read the markup for exact structure, spacing, color, type, and copy, then rebuild with real components.

### How to read a `.dc.html` file
- Each file opens directly in a browser (double-click, or serve the folder) — useful for seeing the real thing.
- Content lives between `<x-dc>` and `</x-dc>`. It is plain inline-styled HTML.
- Where you see a full-window mock, it is drawn at a fixed size (e.g. `1280×840` or `1240×840`) inside a rounded card — that framing is presentational; the real app screen is full-viewport.

---

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, shadows, icons, and copy are final and should be matched closely. Recreate pixel-close using the codebase's own primitives. The one exception: placeholder imagery (see Assets) is intentionally a striped gray box — replace with real image handling.

---

## Design System / Tokens

All four surfaces share one system. Reproduce these as tokens/variables in the target codebase.

### Typography
- **Onest** — primary UI + display font. Weights used: 400, 500, 600, 700, 800.
- **JetBrains Mono** — labels, badges, code, small caps eyebrows (`letter-spacing` ~0.08–0.12em when used as an eyebrow). Weights 400–600.
- **Material Symbols Rounded** — all icons. Loaded as a variable icon font; filled state via `font-variation-settings:'FILL' 1`. Icon names appear as the element text (e.g. `arrow_forward`, `mail`, `lock`, `auto_awesome`, `push_pin`, `perm_media`, `tune`). Sizes typically 17–22px.
- **Caveat** — used only in Auth for a handwritten accent (optional).
- Display headings: weight 800, tight letter-spacing (−0.3 to −1.2px), line-height ~1.1–1.2.
- Body: weight 400, line-height 1.5–1.7.

### Color
| Role | Hex |
|---|---|
| Primary accent (brand blue) | `#006CFF` |
| Blue hover / pressed | `#0056d6` |
| Deep blue (text on blue tint) | `#003E80` |
| Blue tint surface | `#e6f0ff` |
| Accent orange / coral (AI, "magic moment", primary CTA in-app) | `#FF6B3D` (also `#FF814A`) |
| Text primary | `#191922` |
| Text secondary / muted | `#7b7b86` |
| Text tertiary / placeholder | `#a6a6b0`, `#b0b0ba` |
| Body dark (labels/emphasis) | `#3a3a44`, `#5a6472`, `#5b5b66` |
| Success green | `#16a34a` (bg `#e6f5ec`) |
| Danger red | `#d1483a` (bg `#fef2f2`) |
| Canvas / desktop bg (annotation canvas) | `#e7e7ea` |
| App content bg | `#f7f8fa` |
| Surface / card | `#ffffff` |
| Border (default) | `#ececf1` |
| Border (inputs) | `#e2e4ea`, `#e2e6ef` |
| Border (strong / card frame) | `#d7d7dd` |
| Divider (subtle) | `#eef0f3`, `#f2f2f5`, `#f4f4f7` |

Links: default `#006CFF`, hover `#0056d6`, no underline.

### Radius
- Inputs / small controls: 9–12px
- Cards / panels: 14–16px
- Large modals & full-window frames: 18–20px
- Pills / status chips: 20px
- Small badges: 5–6px

### Shadow
- Card: `0 2px 10px -6px rgba(20,20,40,.2)`
- Modal / floating panel: `0 40px 90px -34px rgba(20,20,40,.4)` (also `0 30px 66px -22px rgba(20,20,40,.4)`)
- Primary blue button: `0 14px 28px -12px rgba(0,108,255,.75)`
- Orange CTA: `0 10px 22px -...` coral-tinted

### Placeholder imagery pattern
Every "image goes here" region uses a diagonal stripe:
`repeating-linear-gradient(135deg,#eef0f4 0 11px,#e6e8ee 11px 22px)`
Replace these with real image components / upload slots in production.

### Recurring badge styles
- Beta/annotation turn badge: dark `#191922` bg, white text, mono font.
- **POST-BETA** tag: bg `#f1e6d8`, text `#9a6a1f`, border `#ecdcc2`, pill.
- **MAGIC MOMENT** tag: bg `#FF6B3D`, white text.
- Active nav item: text `#003E80` on `#e6f0ff`.
- "Saved" status: green dot + muted text.

---

## Screens / Views

> Numbers below are the annotation badge IDs in each file, so you can jump to the exact mock.

### File: `Lessgo Onboarding Flow.dc.html`
The new-site journey, anchored to a sample persona (Kristina Kundius, a wedding/portrait photographer). Every step carries a persistent **"What we understood"** rail that fills in as the product learns about the user. Full-window mocks at 1280×840 inside a minimal composer chrome (logo + "New site", no dashboard sidebar).
- **STEP 01 — One line in.** Single large prompt input; user types one sentence describing their business. Minimal chrome to keep focus on the input.
- **STEP 02 — Show us your work** *(MAGIC MOMENT)*. Upload / connect existing material (photos, social, existing site) so the AI has real content to work from.
- **STEP 03 — A few questions only you can answer.** Short, targeted question set the AI can't infer (tone, primary goal/CTA, specifics).
- **STEP 04 — Show the plan — before building.** Present the proposed site structure (pages + sections) for confirmation before generation. Builds trust; user edits the plan.
- **STEP 05 — We write and build it.** Progress/building state while the AI generates copy and assembles pages.
- **STEP 06 — The reveal** *(MAGIC MOMENT)*. The finished site revealed; hand-off into the editor / dashboard.

### File: `Lessgo Editor Redesign.dc.html`
The in-app editor. Direction: a **Command Bar**–led editor in brand colors, with a floating curated toolbar (no raw/freeform styling — the product opinionatedly curates actions). Some screens are tagged **POST-BETA** (not in first release). Screen index (`t#`):
- **t1 — Reimagined Lessgo editor.** The main editor shell: top bar (logo = app menu back to dashboard), canvas, command bar direction, brand colors.
- **t2 — Toolbar standard.** One floating toolbar shell with the curated action set (beta essentials).
- **t4 — "Link to" picker.** Shared link picker (segmented type control, new-tab switch). Opens from Button/CTA, text link, and menu items.
- **t5 — "Manage items" list editor.** One reorder/edit/add/remove shell reused for Menu, Social, Footer, Form fields.
- **t6 — Standard color picker** *(POST-BETA)*.
- **t7 — Standard media / "Replace" picker.** One media library; picker + storage manager are two surfaces of it. Unsplash + Pexels unified under a "Stock" tab.
- **t8 — Full-screen storage manager.** The library's "organize" surface: folders, multi-select, usage indicators, replace-everywhere.
- **t9 — First-run setup popup.** Shown right after generation; what the "Setup · N left" badge opens.
- **t10 — Review center.** Flags unfinished content (sample numbers, un-edited AI copy, placeholders). Advisory — never blocks publish.
- **t11 — "Add page".** Pick from the template's available pages (no blank canvas); general or CMS-driven.
- **t12 — New CMS collection.** Name it, pick a preset, define fields → produces a listing page + a page per item.
- **t13 — "Add section".** The template's master list of sections available for the page; opened from the rail's `+`.
- **t14 — Design menu & template experience.** Swap template, choose variant, choose accent; no raw color editing; preview with the user's own content.
- **t15 — Copy evaluation.** Score + concrete guidance to reach 10; a coaching lens beside Review.
- **t16 — Site settings.** SEO, languages, domain; global + per-page SEO. Opened from the top-bar Settings menu.
- **t17 — Publish flow.** Confirm → publishing → live. Soft Review nudge, never a hard block.
- **t18 — Per-page SEO.** From a page's ⋯ menu → Page settings → SEO tab; overrides site defaults.
- **t19 — CMS item editor.** Edit one collection item; fields come from the collection schema (t12).
- **t20 — Ask Lessgo AI** *(POST-BETA)*. Full AI chat panel.
- **t21 — Version history & restore.** Every publish + autosave listed; restoring is non-destructive.
- **t22 — Photographer portfolio (Projects collection).** Example CMS-driven build; image fields point into the Media library.

### File: `Lessgo Dashboard.dc.html`
The signed-in workspace. Persistent left workspace sidebar (logo, primary CTA, Workspace nav) that never changes; opening a site drops the user into a distinct **project workspace** with its own top bar/breadcrumb (sample project: "Peak Fitness Studio", peakfit.co). Screens (`TURN #` / variant):
- **TURN 3 (3a–3e) — Project workspace surfaces.** Opened-project screens: workspace sidebar + CTA, "connect a domain" empty state, sequences/automation, action panels.
- **TURN 4 (4a–4c) — Open a project.** Opening a site = a place, not a switcher. Includes an "Add a blog to [project]" empty/entry state.
- **TURN 5 (5a–5c) — Action screens after a click.** Destinations from dashboard CTAs: Blog → "Write a post with AI" composer + generated article view; Leads table (all sites); "Request a review" modal.
- **TURN 6 (6a–6b) — Account.** Billing & plan (current plan, payment method, next charge, change-plan cards, invoices) and Domains. Team removed from sidebar.
- **TURN 7 (7a–7b) — Profile.** Avatar (sidebar bottom / top-right) opens a quick account menu; "Account settings" opens the full settings page (left settings nav: Profile, …).
- **TURN 8 (8a–8b) — Projects page.** Projects grid with a per-card context menu (rename, duplicate, delete…) and a notifications panel.

### File: `Lessgo Auth.dc.html`
- **1b — Sign up / sign in (Founder commitment).** Two-column 1140×724 card. Left: signup form — Google SSO button, email + password fields, "Claim my seat" primary CTA, Terms/Privacy, "Already have an account? Log in". Right: full-bleed founder photo (drop-in image slot) with dark scrim, "invite-only · founding cohort" chip, a personal promise, and founder attribution (Sushant Jain, Founder & CEO). Framing: invite-only, founding-member access.

---

## Interactions & Behavior
- **Hover states** are defined throughout via `style-hover` (e.g. buttons lighten/darken, list rows get a tinted bg like `#f7f8fa` or `#fef2f2` for destructive). Match these.
- **Focus states**: inputs use `style-focus-within` — border turns `#006CFF` and bg goes to white on focus.
- **Navigation**: logo in the editor top bar = app menu back to dashboard. Opening a project navigates into a project-scoped workspace (distinct route, own top bar), not a modal switch.
- **Publish** (editor t17): confirm → publishing (progress) → live. Review nudges are advisory and never block.
- **Review & Copy evaluation** (t10, t15) are advisory scoring surfaces — surface guidance, don't gate actions.
- **CMS** (t12/t19/t22): defining a collection generates a listing page + one page per item; the item editor's fields are the collection schema.
- **Restore** (t21) is non-destructive.
- **Onboarding** is a linear 6-step flow with a persistent, progressively-filled "What we understood" summary rail.
- **Card context menu** (dashboard t8): rename, duplicate, delete, etc.

## State Management (to design in the target app)
- Auth/session (signed-in vs out), current workspace, current project.
- Onboarding: step index (1–6), the user's one-line prompt, uploaded/connected assets, question answers, the proposed plan, generation progress, generated result.
- Editor: current page, selected element, toolbar state, open panel (media / link / design / settings / review / AI chat / version history), setup-checklist remaining count, save/publish status, autosave + version list.
- CMS: collections and their schemas, items per collection.
- Dashboard: projects list, per-project stats, leads, notifications, account/billing/plan/domains.

## Responsive behavior
These mocks are desktop-first (fixed-width window frames). Confirm responsive/mobile requirements with the design owner; they are not specified here.

---

## Assets
- `assets/lessgo-logo.png` — the Lessgo.ai wordmark logo, used in every surface. Included in this bundle.
- **Fonts** (load via Google Fonts or self-host): Onest, JetBrains Mono, Material Symbols Rounded, Caveat.
- **Image placeholders**: all photo/media regions are striped-gray placeholders (see token above). Replace with the codebase's real image/upload components. The Auth founder photo uses a drag-drop image slot in the prototype — in production this is a static founder photo.
- No other bespoke image assets; all icons are Material Symbols (icon font), not image files.

---

## Files in this bundle
- `Lessgo Onboarding Flow.dc.html`
- `Lessgo Editor Redesign.dc.html`
- `Lessgo Dashboard.dc.html`
- `Lessgo Auth.dc.html`
- `assets/lessgo-logo.png`
- `support.js`, `image-slot.js` — the prototype runtime, included **only so the HTML files render when opened in a browser**. Do not port these; they are not part of the product.

> Excluded by request: the signed-out marketing landing page (and its "copy" duplicate) — still work-in-progress, not part of this handoff.
