# Manual Test Checklist — pre-launch (Hearth + Lex + Meridian)

Covers what the automated suite **can't**: visual correctness, real-LLM quality,
editor interactions, human judgment. Skip P4 cosmetics (pre-PMF). For the
automated layers, see `e2e/README.md` + `npm run test:run`.

## Setup
Run the **real** app (not mock) so you test actual generation:
```bash
npm run dev      # NO NEXT_PUBLIC_USE_MOCK_GPT — real LLM, costs credits (the point)
```

**Entry points per template:**
- **Meridian (product):** persona = *SaaS founder* / *indie maker* → `/onboarding/product`
- **Hearth (service):** persona = *agency* / *consultant* / *coach* → `/onboarding/service`
- **Lex:** select via the template/palette picker (StyleStep / ServiceThemePopover).
  If the picker doesn't expose Lex yet → **launch blocker, flag it.** For visual-only
  checks, dev override: `?templateId=lex&paletteId=counsel` on an existing service project.

---

## P0 — must pass (the money paths)

### 1. Real generation produces a good page  *(biggest untested gap)*
For **each** of Meridian / Hearth / Lex, run onboarding end-to-end with real inputs:
- [ ] Generates without error/timeout; no blank or half-empty sections
- [ ] Copy is coherent + on-topic (not hallucinated, not placeholder-y)
- [ ] No fabricated stats / testimonials / prices
- [ ] Section order fits the awareness + goal
- [ ] **Run each persona 2–3×** — generation is non-deterministic; hunt for the occasional broken output

### 2. Published page == editor  *(dual-renderer divergence = #1 architectural trap)*
- [ ] Edit a headline, CTA, image, price → **Publish** → open `/p/<slug>` → edit shows
- [ ] Published styling matches editor (fonts, colors, spacing, surfaces) — all 3 templates
- [ ] Regression of the 2 fixed bugs: (a) open **Preview in a fresh tab** → loads, not "Preview Not Available"; (b) published **Meridian** page with footer renders (no 500)

### 3. Save / publish data integrity
- [ ] Edit → autosave → reload `/edit/<token>` → edits persisted
- [ ] Re-publish to the **same** slug → updates (no dupe, no data loss)
- [ ] Form submission on a published page lands in `/dashboard/forms/<slug>`

---

## P1 — should pass

### 4. Editor interactions
- [ ] Inline text edit + formatting toolbar (size / color / align)
- [ ] Image upload / replace / stock search
- [ ] **CTA config** — set a link CTA *and* a form-modal CTA; both work on the published page
- [ ] Section / element toolbars: add, reorder, delete
- [ ] Editor doesn't clobber loaded content on mount

### 5. Template / palette / variant picker  *(3-tier model)*
- [ ] Picker shows only the selected template's palettes (no cross-template leakage)
- [ ] Switching palette/variant re-renders instantly — does **not** re-generate copy
- [ ] Choice persists after save + reload; **published** page reflects it (`data-palette` / `data-variant`)

### 6. Failure / edge cases
- [ ] Out of credits → graceful screen (no crash)
- [ ] Generation failure → retry path works
- [ ] Invalid / taken slug on publish → clear error

---

## P2 — nice to have
- [ ] **Cross-browser:** Chrome (primary) + one Safari pass on a published page
- [ ] **Mobile:** device toggle in editor + one real-phone load per template
- [ ] **Known divergences are intentional, not broken** (per `phase11aArchitectureGaps.md`):
      Lex hero has no image + non-numeric ledger; Lex services use `§`-index not icons;
      variants read subtler than the HTML demo

---

## Don't re-test (automation owns these)
No-crash render of all 3 templates · block dispatch · save-payload validation ·
generation *shape* (mock) · publish → `/p/[slug]` happy path (all 3 templates).

**Short on time?** Do P0 #1 (real generation quality, several runs each) and
P0 #2 (published == editor). Those are the only things your eyes must sign off,
and they map directly to the two launch fears: broken/empty page; published renders wrong.
