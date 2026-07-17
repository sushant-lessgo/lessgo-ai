# Big-batch pre-push QA checklist

**Strategy (founder, 2026-07-17):** no customer is waiting → build everything, QA once properly, push once. This doc is the **master QA gate** for the accumulated unpushed batch so nothing is missed. Living doc — orchestrator appends as sessions surface risks. Local `main` is **~132 commits ahead of origin** (origin/main = current live prod).

## ⚠️ Ground rules for the QA pass
1. **A preview/staging deploy is MANDATORY.** A whole class of surfaces does **not** run on `localhost` and green local tests say nothing about them (§A). QA that skips a deployed preview will ship infra bugs straight to prod on the one push.
2. **Behavioral, not trust-the-green.** This batch has documented "green-but-false" cases (inert `*.test.ts` type assertions — `tsconfig.json:27` excludes tests; cross-feature rewrites with no behavioral test). Exercise the flow, don't trust the unit pass.
3. **Preview first → verify §A → then prod push** → deploy-watcher → prod smoke → bulk worktree cleanup.

---

## A. Prod-only surfaces — REQUIRE a preview deploy (cannot test locally)
- [ ] **Publish path** — publish a page → `/p/[slug]` serves (blob + KV), ISR, blob-proxy edge route. Verify `published.css` + `work.v1.js` embed on a **real** published page.
- [ ] **publish-trust changes on real publish** — M3 honest failure (failed export returns 500, not false 200); M4 `<head>` escaping + URL-scheme gate (no `javascript:` og:image, no script injection via slug/fields).
- [ ] **Custom domains** — ownership → DNS → SSL → live routing via KV/middleware.
- [ ] **Stripe / billing-beta** — checkout, portal, top-up, **webhooks** (plan/credit updates), credit gating (block→upgrade), "what costs what". *(billing-beta MERGED `c7e0455a` — surface built, none of this exercised locally.)*
- [ ] **billing-correctness live smoke (owed, never run)** — a **funded** generation decrements against a live provider; 0-credit user blocked pre-spend; failed gen not charged.
- [ ] **Resend emails** — lead-notification fires; blog-post notification. *(lead-reply is copy-to-clipboard, no send.)*
- [ ] **Edge middleware** — custom-domain resolution; the STEP-06 reveal iframe (`X-Frame-Options` SAMEORIGIN on the framed route, DENY elsewhere).

## B. Cross-feature silent-regression risks — behavioral verification required
- [x] **🔴 Regen path — NOW COVERED by `toolbar-beta-followup` (merged).** It shipped a **load-bearing e2e that drives Regen through the toolbar** for element (text) + section regen against regen-modernization's rewritten routes. Still worth one live eyeball on the preview deploy, but the behavioral gap is closed by a test.
- [ ] **secrets-forms M8** — a real form submit attributes ownership server-side (forged/omitted client `userId` cannot change whose integrations/emails fire).
- [ ] **work-story-facts-resolve** — a live **work story-interview** submit succeeds (was 400 `brief.facts.work is required`); About regenerates.
- [ ] **Generation + parity regression** — `parity.spec` / `generation.spec` NOT re-run since some merges (~12min); run on final main.

## C. Founder-taste / sign-off gates (the big-bang owed list)
- [ ] **editor-shell-redesign QA + 3 sign-offs** — nobody has clicked phases 4–8 live: settings rows→right modal (esp. Social & sharing), app menu→Back to dashboard, undo/redo, Regen Copy toast + locale lock, mobile overlay, theme swap + Browse-all-styles, SEO save + noindex, publish e2e, Reset. Sign-offs: creation-entries-moved, `smartphone`→`phone` glyph, ThemePopover.
- [ ] **blog-composer GATE A** — manual publish/unpublish + visual sign-off + the hero-image deviation call.
- [ ] **content-baseline-split Deploy B** — its own two-deploy gate (pre-B naayom row dump → bake signal).
- [ ] **toolbar** — dark t2 pill, 5 greyed placeholders + why-tooltips, t5 social panel, submit-path smoke on a **reordered** form (reorder proven to store, not through publish). (Ask-AI slot now removed by toolbar-beta-followup.) Also: LinkPicker now **replaces** Button Settings' destination — verify a **goal-following CTA still follows its goal** post-consolidation.
- [ ] **E3 work-onboarding (STEP 01→03 walk)** — a work project sees only real gaps (≤5 questions, taps not typing), rail updates, required price+language enforced, new-vs-established branch captured. "Never ask twice" actually holds.
- [ ] **dashboard-lead-reply draft quality** — on a REAL lead, the AI draft is on-brand (grounded in `Project.brief`) and worth sending with light edits; copy-to-clipboard works; only shows for leads with a message; 1 credit charged on success.
- [ ] **E2 (when it merges)** — pilots on `atelier2` only, merges ZERO prod-reachable behavior (D7b); real reveal QA comes with the atelier-cutover, not here.

## D. Toolbar-found 🔴 defects — fix or consciously accept before push
- [ ] **Published HTML never sanitized** — `sanitizeHtmlContent` imported (`publish/route.ts:9`) never called; whole sanitize layer dead. (Security. "Not free" — `STRICT_PROFILE` lacks `<a>`/`href`.)
- [ ] **`GlobalButtonConfigModal` mounted twice** (`EditLayout.tsx:223` + `GlobalModals.tsx:99`) — Radix cross-aria-hides → screen readers get no dialog + pointer interception. (A11y.)
- [ ] **`convertCTAToForm` live crash** (`uiActions.ts:489`, via `MainContent.tsx:320`) — writes phantom `state.forms.formBuilder.visible` → TypeError. (Phase 2 fixed the dead sibling, left this live one.)
- [ ] Flake — `e2e/link-picker.spec.ts:150` (combined runs).

## E. Standard re-green on final main (pre-push hook parity)
- [ ] `tsc` 0 · `test:run` green · `npm run build` · `lint` 0 errors (known flake: `i18nHonesty` 5s timeout — rerun isolated).

## F. Deploy mechanics
- [ ] Preview deploy → walk §A/§B on it.
- [ ] Founder pushes `origin main` from primary station.
- [ ] `deploy-watcher` → READY.
- [ ] Prod smoke (browser-UA GET/HEAD; prod-DB reads DENIED by policy).
- [ ] **Bulk worktree cleanup** of the whole merged set once deploy is green.

---
*Sources: orchestrator.md Founder pile, toolbar/publish-trust/billing-correctness/secrets audits + mailboxes. Append new cross-feature risks here as sessions surface them.*
