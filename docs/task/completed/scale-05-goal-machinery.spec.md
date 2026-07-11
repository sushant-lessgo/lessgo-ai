# scale-05 — goal machinery: intents wired to copy, forms, mechanisms

Source: scalePlan §6 (full spec), D16, §11.6. Depends: scale-04. Closes the "goal is a dead wire" gap (#8/#28) + rung-B gaps blocking EXISTING customers: follow-social (4 writers), store-badges (Kathaworld), book-me (Prasenjit, photographers).

## Goal
The picked goal shapes the page: copy emphasis, CTA behavior, auto-seeded form. Mechanisms built once in the click system, all templates benefit.

## Scope IN
1. **Goal slot collects the parameter** (wizard, per intent): form intents ⇒ nothing extra (form auto-seeds) · WhatsApp/call ⇒ number · redirect intents ⇒ destination URL (store link, Amazon, Razorpay, Calendly) · subscribe/follow ⇒ platform links · RSVP ⇒ link+date. Lands in `Brief.goal.param`; GOAL_REF (spec 04) resolves from it.
2. **Intent → copy**: per-intent guidance injected into strategy+copy prompts per engine (extends today's `getGoalCtaGuidance`, `service/copyPrompt.ts:73`) — CTA label/subtext ("Start free trial" · "7 days free, no credit card"), objection emphasis (trial terms / MOQ), section emphasis.
3. **Mechanism machinery** (M-behaviors as Destination-producing features, once each):
   - M2 WhatsApp: deep-link + **deterministic prefill from Brief slots** — "Hi {businessName}, I found your website — interested in {offer}" — NO AI (§11.6), editable in editor.
   - M3 store-badges: play/app-store badge block behavior (Kathaworld class).
   - M4 follow-social: CTA to social Destination + follow-strip rendering from socialProfiles (writers class).
   - M1 form: **auto-seed from `TEMPLATES_BY_GOAL`** (`src/modules/audience/service/formTemplates.ts`) keyed by INTENT — form created + placed + wired to primary at generation; kills the manual FormBuilder step for the default case (FormBuilder remains the editor).
4. **Unhide + extend intent options**: today product shows 6, service 3-of-6 (inventory #7). Wizard shows **3–4 likely intents from the businessType entry** (`likelyIntents`, scale-01), AI pre-selects from scrape guess; full list behind "other".
5. Form templates: extend `TEMPLATES_BY_GOAL` from 3 goals to all M1 intents (enquiry, quote, book-call, book-me, enroll, apply, lead-magnet, waitlist, demo, RSVP).

## Scope OUT
Place-engine intents' machinery (order/reserve — enum exists from scale-01, machinery P3) · payment/donate beyond plain external link · secondary-CTA defaults (D14: none).

## Acceptance
Writer fixture: goal follow-social ⇒ hero primary = Instagram Destination, follow strip renders, beacon tags conversions. Kathaworld fixture: download-app ⇒ store badges render both stores. SaaS: free-trial ⇒ CTA copy carries no-CC subtext, redirect out. Consultant: book-call ⇒ form auto-seeded+placed+wired at generation, submission → FormSubmission + lead email. WhatsApp goal ⇒ prefilled message exact template, no AI call. All dual-renderer parity green.

## Open questions
1. Follow-strip: new shared block or footer-social promotion per template? (lean shared block, capability `store-badges`-style)
