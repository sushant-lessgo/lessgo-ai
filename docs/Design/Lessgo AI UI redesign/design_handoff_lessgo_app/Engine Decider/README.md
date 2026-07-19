# Handoff: Engine Decider (Onboarding Entry)

## Overview
The Engine Decider is the routing layer that runs **inside Step 1 (entry)** of Lessgo's onboarding. Today's onboarding assumes a single copy engine — **work** — but every incoming business is actually routed to one of **five** engines. This package covers the screens that take a one-line description of a business and resolve it to an engine, asking the user a question **only when the engine is genuinely undetermined**. When the engine resolves to `work`, the existing work-journey screens (Steps 2–6) take over unchanged.

Core principle from the product spec: **when we know, we don't ask.** The engine is a *revisable belief* — inferred from the one-liner, revised during ingestion, and hard-committed only at the plan gate.

The five engines:
| Engine | Buyer-decision line ("what makes them reach out?") | Status |
|---|---|---|
| **work** | "They see my work and love it." | Live today |
| **trust** | "They trust my experience & track record." | In build |
| **thing** | "They understand what my product does." | In build |
| **place** | "They see my space, menu, or location." | Not built → demand board |
| **quick-yes** | "They already know me — I just need them to act." | Not built → demand board |

## About the Design Files
The file in this bundle (`Lessgo Engine Decider.dc.html`) is a **design reference created in HTML** — a prototype showing intended look and behavior, **not production code to copy directly**. It is an annotated "flow" document: a page-level canvas with an intro block plus six labelled screen mockups (D1–D6), each rendered inside a 1280×840 device frame with explanatory captions around it.

The task is to **recreate these screens in Lessgo's existing codebase** (React/Next.js, per the current-code pointers below) using its established components, styling patterns, and state model. Do **not** ship the annotated HTML; extract the *screen content* (the device-frame interiors) and rebuild each as a real onboarding view. The intro block and D-badges/captions are documentation only.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and component treatments are specified below and in the HTML. Recreate the UI to match, using the codebase's existing libraries where equivalents exist (buttons, cards, the onboarding shell, the "What we understood" rail).

## Relationship to existing code
Per the spec doc (`engineDecider.md`) these screens map onto:
- **Resolver:** `src/modules/brief/classify.ts` (`resolveEngine`, `EntrySignals`, `EntryFacts`, `applyBusinessTypeCorrection`, `LOW_CONFIDENCE_THRESHOLD`).
- **Registry:** `src/modules/businessTypes/config.ts` — needs the new `ambiguous` state (`{ engine-ambiguous, candidate engines, prior }`) alongside the existing committed-engine entries.
- **Serve gate:** `src/modules/brief/serveGate.ts`, `serveMatrix.ts` — the D5 demand-board path.
- **Entry step (one-liner):** `src/app/onboarding/[token]/components/EntryInputStep.tsx`, `src/components/onboarding/journey/JourneyEntryStep.tsx`.
- **Classify schema:** `src/lib/schemas/entryClassify.schema.ts`. Brief confirm: `/api/brief/confirm`.
- Note `BriefSchema.copyEngine` enum is `{thing, trust, work}`; `place`/`quick-yes` can be *resolved* but route to the demand board rather than being written to the brief.

---

## Screens / Views

All screens share a **shell**: a 1280×840 white surface (border `#d7d7dd`, radius 18px), a 58–60px top bar, a 320px left "What we understood" rail, and a `#f7f8fa` main content column with an optional footer nav bar (56px). Screen-specific content lives in the main column.

### Shared: Top bar
- Height 58px (60px on D1 composer), white, bottom border `#eef0f3`, horizontal padding 20–24px, `gap:14px`, items vertically centered.
- Left: Lessgo logo (`assets/lessgo-logo.png`, height 22–23px) · 1px `#e9e9ee` divider · label "New site" (Onest 600 12.5px `#8a8a94`).
- Entry pill (D2–D5): "STEP 01 · ENTRY", JetBrains Mono 600 11px, color `#003E80`, bg `#e6f0ff`, radius 20px, padding 4×10px.
- D1 composer variant: no pill; instead "New site with AI" label + right-aligned "Exit to dashboard" (with `close` icon).
- D6 variant: a 6-dot step tracker centered, dot "1" active (blue circle `#006CFF`, white numeral), rest pending (`#dcdce2` dots, `#eceef2` connectors).
- Right: "Save & exit" (Onest 600 12.5px `#8a8a94`, pointer).

### Shared: "What we understood" rail (320px, left)
- Background `#fafafb`, right border `#f0f0f3`, flex column.
- Header (padding 20/22/14px): eyebrow "WHAT WE UNDERSTOOD" (JetBrains Mono 700 10px, letter-spacing .11em, `#a6a6b0`) + subline "Tap anything to correct it" (Onest 400 11.5px `#b0b0ba`).
- Body: scrollable list of fields, each block padded 11px 0 with a top border `#eef0f3`:
  - Field label: JetBrains Mono 600 10px `#a6a6b0`.
  - Value row: flex, value text (Onest 500–600 12.5–13px, `#191922` for name, `#3a3a44` for others) + trailing `edit` icon (`#c0c0c8`).
  - Pending/streaming fields: `opacity:.5`, value replaced by a striped bar (`repeating-linear-gradient(135deg,#eef0f4 0 8px,#e6e8ee 8px 16px)`, height 9px, radius 5px).
- **New rail element — "HOW YOUR SITE WINS"** (the engine field). This is the key addition:
  - Label "HOW YOUR SITE WINS" (JetBrains Mono 600 10px). Color `#006CFF` with a spinning `progress_activity` icon while resolving; `#a6a6b0` once settled; `#c47d1a` with `help` icon when ambiguous.
  - Engine card: white, radius 12px, 12/13px padding. Border `1.5px solid #cfe0ff` when set, `1.5px dashed #cfe0ff` when confirming, `1.5px solid #f0dcb4` on amber (ambiguous) with bg `#fdf7ec`.
  - Card contents: 34×34 icon chip (radius 9px, bg `#e6f0ff`, Material Symbol filled `#006CFF`) + engine name (Onest 700 13px) + one-line descriptor (Onest 400 10.5px `#8a8a94`). A green `check_circle` (`#16a34a`) trails when confirmed.
  - Below card: "Change how buyers decide" / "Not how buyers decide? Change it" link (Onest 600 11px `#006CFF` with `swap_horiz` icon).
- Footer (varies): either a "Something wrong?" mini chat affordance (white input row with `chat_bubble` icon + "Tell us…" placeholder) or a small note (Onest 400 11px `#a6a6b0`) about the belief being revisable.

### D1 — One line in (entry composer)
- **Purpose:** Capture a single sentence about the business. AI *names the type*; code resolves the engine. The read appears live in the rail.
- **Layout:** Composer column (flex-1, radial bg `radial-gradient(120% 90% at 50% -6%,#eef4ff 0%,#fcfcfd 58%)`, centered) + live-read rail on the **right** (320px, left border).
- **Components (composer, centered, max-width 700px):**
  - Eyebrow pill "Welcome to Lessgo AI" (`rocket_launch` icon, Onest 600 11px `#003E80`, bg `#e6f0ff`, radius 20px).
  - Title "Tell us what you do — in a line." (Onest 800 38px, line-height 1.12, letter-spacing −1.2px, `#191922`, centered, max-width 620px).
  - Subtitle (Onest 400 15px `#7b7b86`, max-width 520px).
  - Input card: white, border `#e2e6ef`, radius 18px, shadow `0 28px 60px -26px rgba(20,20,40,.32)`, padding 18/18/15px. Contains a 2-tab segmented control ("Describe your business" active / "Use my current site"), the typed text (Onest 400 16px, min-height 52px) with a blinking caret (2px×20px `#006CFF`, `lg-pulse` animation), a helper line, and a primary CTA "Continue" (Onest 700 13.5px, white on `#FF6B3D`, radius 11px, shadow `0 10px 22px -9px rgba(255,107,61,.75)`, `arrow_forward` icon).
  - Example rows ("A LINE IS ENOUGH — IT ROUTES ITSELF"): three rows, each a quoted one-liner → `arrow_forward` → engine tag. Tags: THING/TRUST in blue (`#006CFF` on `#eef4ff`); the ambiguous example shows "ASK — SPANS 2" in amber (`#c47d1a` on `#fbf1e0`).
- **Rail (right):** shows WHAT YOU DO, WHERE, then the HOW YOUR SITE WINS card actively resolving (Work engine, "portfolio is the argument"), plus a pending WHAT YOU SELL striped field. Footer note: "The engine is a first read, not a lock — ingestion can still change it."

### D2 — Known & unambiguous → don't ask (~80% of cases)
- **Purpose:** When the business type maps to one dominant engine, resolve by lookup with **zero questions**. Show it, offer one-tap change, proceed.
- **Layout:** Rail (left) with the engine already confirmed (green `check_circle`) + main column with a centered confirmation moment.
- **Components (main, centered, max-width 560px, text-align center):**
  - 74×74 icon tile (radius 20px, bg `#e6f0ff`, `photo_library` filled `#006CFF`, shadow `0 18px 38px -18px rgba(0,108,255,.5)`).
  - Eyebrow "GOT IT — NO QUESTIONS NEEDED" (JetBrains Mono 600 11px `#16a34a`).
  - Heading "You're a photographer — so we'll lead with your work." (Onest 800 30px, line-height 1.14, letter-spacing −.7px).
  - Body copy (Onest 400 14.5px `#7b7b86`, max-width 440px).
  - Change affordance card: white, border `#e6e6ec`, radius 12px — "Not how your buyers decide? **Choose a different way →**" (`swap_horiz` icon).
  - Primary CTA "Show us your work" (Onest 700 14.5px, white on `#006CFF`, radius 12px, shadow `0 12px 26px -8px rgba(0,108,255,.6)`, `arrow_forward`).
  - Micro-note "Auto-continues in a moment — nothing here is final" (Onest 400 11.5px `#b0b0ba`).
- **Example subject:** Kristina Kundius, photographer → work.

### D3 — Almost sure → one-tap confirm
- **Purpose:** A leaning-but-uncertain read is phrased back as the user's own belief. One tap confirms; "something else" opens D4.
- **Layout:** Rail (left; engine shown with dashed border + "confirming now…") + main column with a form-like stack (max-width 600px) and a footer nav bar.
- **Components (main):**
  - Eyebrow "ONE QUICK CHECK" (JetBrains Mono 600 11px `#8a8a94`).
  - Heading "Sounds like people hire you for your experience — is that right?" (Onest 800 28px, line-height 1.16, letter-spacing −.6px).
  - Body (Onest 400 14px `#7b7b86`).
  - **Primary "Yes" card:** white, border `2px solid #006CFF`, radius 16px, padding 20px, shadow `0 18px 38px -20px rgba(0,108,255,.35)`. 52×52 icon tile (radius 13px, bg `#e6f0ff`, `verified`) + title "Yes — that's it" (Onest 700 17px) + subtext + inline "Continue" button (white on `#006CFF`, radius 10px).
  - **Secondary "something else" card:** white, border `#e6e6ec`, radius 16px. 44×44 gray icon tile (`tune`) + "Not quite — it's something else" (Onest 700 15px) + "See all five ways buyers decide" + trailing `chevron_right`.
  - Info tip: bg `#f0f7ff`, border `#d7e6ff`, radius 11px, `lightbulb` icon `#006CFF`, explanation text.
  - Footer: Back link (left) + right-aligned note "A single tap — then straight to your work."
- **Example subject:** Marta Feenstra, leadership coach → trust.

### D4 — Don't know / ambiguous → the buyer-decision question (THE KEY SCREEN)
- **Purpose:** Fires for unknown types *and* ambiguous-known types (e.g. branding studio spans work/trust — the "cirkles" case). Hand the decision to the human by asking **what wins the visitor over** (which *is* the engine, in plain language). Pre-select the prior; show all five options including the two not yet buildable.
- **Layout:** Rail (left; engine shows amber "Could go two ways" WORK/TRUST card) + main column (max-width 720px) with a footer nav bar.
- **Components (main):**
  - Context pill "A STUDIO CAN GO TWO WAYS — YOU TELL US" (JetBrains Mono 600 10.5px `#c47d1a`, bg `#fbf1e0`, radius 20px, `call_split` icon).
  - Heading "When someone lands on your site, what makes them reach out?" (Onest 800 27px, line-height 1.15, letter-spacing −.6px).
  - Subhead (Onest 400 13.5px `#7b7b86`).
  - **Five option rows** (flex column, gap 10px). Each row: 46×46 icon tile (radius 12px) + two-line label (title Onest 700 15.5px `#191922`, subtext Onest 400 12px `#7b7b86`) + engine tag (JetBrains Mono 700 9.5px) + trailing radio (24px circle).
    - **work** — selected state: border `2px solid #006CFF`, radius 14px, shadow `0 16px 34px -20px rgba(0,108,255,.32)`, blue icon tile `#e6f0ff`, blue tag on `#eef4ff`, filled blue radio with `check`. Under it a "best guess" caption (Onest 400 11px `#8a8a94`, `bolt` icon).
    - **trust**, **thing** — unselected: white, border `#e6e6ec`, blue filled icon on `#eef4ff`, gray tag on `#f1f1f5`, empty radio (`2px solid #dcdce2`).
    - **place**, **quick-yes** (not built) — bg `#fbfbfc`, **dashed** border `#dcdce2`, muted icon (`#a6a6b0` on `#f2f3f6`), title `#5b5b66`, subtext "Pick this and we'll set up a call — not built yet" (`#a6a6b0`), tag "PLACE · SOON" / "QUICK-YES · SOON" (`#8a8a94`).
  - Option icons: work `photo_library`, trust `verified`, thing `widgets`, place `storefront`, quick-yes `bolt` (all filled).
  - Footer: Back link + note "Whatever you pick, ingestion can still change our minds together." + primary "Continue with Work" button.
- **Example subject:** Cirkel Studio, branding & design studio → ambiguous (prior = work).

### D5 — Not built yet → honest demand board
- **Purpose:** Picking `place` or `quick-yes` today is an honest hand-off, never mis-served. Say so plainly, offer a human follow-up, log demand.
- **Layout:** Rail (left; engine card neutral, plus a "DEMAND LOGGED · #PLACE" chip in amber) + main column (centered, max-width 560px).
- **Components (main):**
  - 74×74 icon tile (radius 20px, bg `#fdf7ec`, border `#f0dcb4`, `storefront` filled `#c47d1a`).
  - Eyebrow "PLACE — ON THE ROADMAP, NOT LIVE YET" (JetBrains Mono 600 11px `#c47d1a`).
  - Heading "We don't build restaurant sites yet — but we're close." (Onest 800 29px, letter-spacing −.7px).
  - Body (Onest 400 14.5px `#7b7b86`, max-width 450px) ending in "**someone from Lessgo will connect with you**".
  - Capture card: white, border `#e6e6ec`, radius 16px, shadow. Contains a filled email field row (bg `#f7f8fa`, `mail` icon, green `check_circle`) + full-width primary CTA "Keep me posted & call me" (white on `#006CFF`, `notifications_active` icon) + reassurance micro-copy.
  - Escape link: "Actually, my site wins a different way — **go back**" (`swap_horiz` icon).
- **Example subject:** Kanji Ramen, Rotterdam → place.

### D6 — Engine set → revisable, hands off to the journey
- **Purpose:** Close the decider; hand off to the resolved engine's journey (for work = today's screens). Reinforce that the engine stays revisable until the plan gate.
- **Layout:** Rail (left; Work engine set + revisable) + main column (padding 40/44px, flex column, gap 24px, scrollable).
- **Components (main):**
  - Centered header: 66×66 blue icon tile (`photo_library`), eyebrow "ENGINE SET — WORK" (JetBrains Mono 600 11px `#16a34a`), heading "Your site will lead with your work." (Onest 800 28px, letter-spacing −.7px).
  - **Belief-lifecycle card:** white, border `#e6e6ec`, radius 16px, padding 20/22px. Label "THE ENGINE IS A BELIEF, NOT A LOCK" (JetBrains Mono 700 12px `#8a8a94`). Three steps separated by `chevron_right` (`#c8c8d0`):
    1. "Inferred here" — active, bg `#f8faff`, border `#dbe9ff`, blue `edit_note` chip.
    2. "Revised in ingestion" — neutral, bg `#fbfbfc`, border `#ececef`, `sync` chip on `#eef4ff`.
    3. "Committed at the plan gate" — neutral, green `lock` chip on `#e6f5ec`.
    Each step: 30×30 icon chip (radius 8px) + title (Onest 700 12.5px) + caption (Onest 400 11px `#7b7b86`).
  - **Hand-off banner (dark):** bg `#0b1830`, radius 16px, padding 22/24px, white text. 46×46 icon tile (`alt_route` `#5fa0ff` on `rgba(255,255,255,.12)`) + title "Handing off to the Work journey" + caption "Next: Show us your work → a few questions → your plan. These are today's screens, unchanged…" (`#9fb8e0`) + primary "Continue" button (white on `#006CFF`).
- **Example subject:** Kristina Kundius → work.

---

## Interactions & Behavior
- **One-liner submit (D1):** on Continue, run classification. AI returns `EntrySignals` (business-type guess + confidence + tiebreaker); `resolveEngine` produces a provisional engine. Rail's HOW YOU WIN field animates from a spinner to the resolved card.
- **Routing branch (determines which screen shows next):**
  - **Known + unambiguous type** → D2 (show, don't ask). Auto-advance after a short beat; user can override via "Choose a different way".
  - **Almost sure** (leaning read below confidence bar but with a clear prior) → D3 one-tap confirm. "Yes" advances; "something else" opens D4.
  - **Unknown type OR ambiguous-known type** → D4 buyer-decision question. Prior pre-selected.
- **Selecting an option (D4):** work/trust/thing → advance into that engine's journey (D6 hand-off for work). place/quick-yes → route to D5 demand board (do **not** write to `brief.copyEngine`).
- **D5 submit:** capture email, log a demand tag (e.g. `#PLACE`), show confirmed state. Provide a "go back" escape to reselect.
- **Change affordance (rail, all screens):** "Change how buyers decide" reopens the D4 question at any point before the plan gate.
- **Ingestion overturn (D6 promise):** if uploaded evidence contradicts the current engine, re-propose the engine (surface as a rail nudge / re-fire the question — open decision in the spec).
- **Animations:**
  - `lg-pulse` (opacity .55↔1, 1.1s infinite) — typing caret, "finding more…" chips.
  - `lg-spin` (360° rotate, ~1s linear infinite) — `progress_activity` spinners in bar and rail.
  - CTA shadows are static; add subtle hover elevation per codebase button conventions.
- **Hover/active states:** all cards, list rows, chips, and links have `cursor:pointer`; apply the codebase's standard hover treatment (elevation/border tint). Selected option rows use the 2px blue border + filled radio.

## State Management
- `oneLiner: string` — the entry text.
- `entrySignals: { businessTypeGuess, confidence, tiebreaker }` — AI output (never a verdict).
- `resolvedEngine: 'work'|'trust'|'thing'|'place'|'quick-yes' | null` — from `resolveEngine`.
- `engineStatus: 'resolving' | 'known' | 'almost-sure' | 'ambiguous' | 'confirmed'` — drives which screen (D2/D3/D4) renders and the rail card's visual state.
- `engineCommitted: boolean` — false until the plan gate.
- `demandTag?: string` — set on D5 (e.g. `PLACE`).
- Facts/rail model (`EntryFacts`): name, whatYouDo, where, whatYouSell (+ engine). Fields stream in; unresolved fields render the striped placeholder.
- Transitions: `resolving → (known|almost-sure|ambiguous)` after classify; `ambiguous/almost-sure → confirmed` on user pick; `confirmed → committed` at plan gate. Ingestion contradiction can reset `confirmed → ambiguous`.

## Design Tokens
**Colors**
- Canvas bg: `#e7e7ea`
- Surface white: `#fff`; off-white rail `#fafafb`; main column `#f7f8fa`; subtle card `#fbfbfc`
- Text: primary `#191922`, strong `#3a3a44`, body `#5b5b66`, muted `#7b7b86` / `#8a8a94`, faint `#a6a6b0` / `#b0b0ba`, ghost `#c0c0c8` / `#c8c8d0`
- Primary blue: `#006CFF`; dark blue text `#003E80`; blue tint bg `#e6f0ff` / `#eef4ff` / `#f8faff`; blue border `#cfe0ff` / `#dbe9ff`
- Orange (CTA / "the fix" accent): `#FF6B3D`
- Amber (ambiguous / not-yet / demand): text `#c47d1a` / `#9a7b3f`, bg `#fbf1e0` / `#fdf7ec`, border `#f0dcb4`
- Green (success / whatsapp): `#16a34a`, bg `#e6f5ec`; whatsapp `#25d366`
- Dark panel: `#0b1830` (hand-off banner, build screen); on-dark text `#eaf1ff` / `#9fb8e0` / `#5fa0ff`
- Borders: `#d7d7dd` (frame), `#e2e2e8` / `#e6e6ec` / `#eceef2` / `#eef0f3` / `#f0f0f3` (dividers)
- Striped placeholder: `repeating-linear-gradient(135deg,#eef0f4 0 8–11px,#e6e8ee …)`

**Typography**
- Families: **Onest** (400/500/600/700/800) for UI text; **JetBrains Mono** (400/500/600) for eyebrows, labels, tags, step numbers; **Material Symbols Rounded** for icons (class `.ms`, `font-variation-settings:'FILL' 0|1`).
- Scale seen: display 38–40px/800; H2 27–30px/800 (letter-spacing −.6 to −.7px); card title 15.5–17px/700; body 13.5–15px/400; label 10–12.5px; mono eyebrow 10–11px (letter-spacing .06–.12em).

**Radii:** 5–6px (tags), 8–9px (chips/inputs), 10–14px (cards/buttons), 16–20px (feature cards/tiles), 18px (frame).

**Shadows:**
- Frame: `0 40px 90px -34px rgba(20,20,40,.4)`
- Feature card: `0 16px–18px 34px–40px -18px–-24px rgba(20,20,40,.3)` / blue `rgba(0,108,255,.32–.5)`
- Primary CTA (blue): `0 10px–12px 22px–26px -8px rgba(0,108,255,.6)`; orange CTA: `0 10px 22px -9px rgba(255,107,61,.75)`

**Spacing:** section padding 52px 56px; frame internal paddings 20–44px; common gaps 6/8/10/12/14/22/24px.

## Assets
- **Logo:** `assets/lessgo-logo.png` (used in every top bar; height 22–23px). Use the existing brand logo asset in the codebase.
- **Icons:** Google **Material Symbols Rounded** (loaded via Google Fonts). Icon names used: `rocket_launch, edit_note, link, arrow_forward, arrow_back, close, swap_horiz, chevron_right, check, check_circle, help, call_split, photo_library, verified, widgets, storefront, bolt, tune, lightbulb, mail, notifications_active, progress_activity, sync, lock, edit_note, alt_route, edit, chat_bubble, sell, translate, workspace_premium, home`. Map to the codebase's existing icon set where possible.
- **Fonts:** Onest + JetBrains Mono via Google Fonts (or self-hosted equivalents).
- No raster imagery in these screens — image areas in the broader flow use striped placeholders.

## Files
- `Lessgo Engine Decider.dc.html` — the annotated design reference (intro + D1–D6), included in this bundle.
- Related existing prototype (context, not in this bundle): `Lessgo Onboarding Flow.dc.html` — the work-journey Steps 1–6 that D6 hands off to.
- Spec source: `uploads/engineDecider.md` — the product decision doc behind these screens (D1–D4 decisions, registry `ambiguous` state, serve gate).
