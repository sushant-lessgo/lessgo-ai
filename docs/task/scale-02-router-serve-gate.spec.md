# scale-02 — one entry, router, confirm card, serve gate, demand capture

Source: scalePlan §3 steps 1–4, §7, D5/D8/D17, §11.1/9/10/11. Depends: scale-01.

## Goal
One universal entry; AI classifies into a Brief draft; user confirms; gate serves or captures. Replaces persona gate + pilot allowlist + waitlist.

## Scope IN
1. **Entry** `/onboarding/[token]`: one-liner OR URL. (Social-link entry: accept URL, treat as URL — no special handling yet.)
2. **Classify** — extend the existing understand/scrape call (`/api/v2/understand`, `/api/v2/scrape-website`), do NOT add a second AI call. Cheap model (§11.1). Output → Brief draft: businessType guess + confidence, category, goal guess (intent from vocabulary incl. place intents), structure default, designStyleHint, extracted facts/proof/socials.
   **Engine selection rule (§2): businessType in List 1 ⇒ `copyEngine = entry.copyEngine` (lookup, zero AI). Unknown type ⇒ AI tiebreaker ladder** (expertise→trust · portfolio-is-proof→work · browsing-place→place · offer-already-understood→quick-yes · else thing) **+ lead tagged rung-A**.
3. **Page 2 — Brief playback** in user language ("A page for your photography portfolio that gets visitors to WhatsApp you"). 1-tap confirm · correct via user-language chooser · low confidence ⇒ chooser upfront. Never expose internal terms (archetype/engine).
4. **Serve gate — AFTER confirmation, on confirmed Brief** (D17): `fit()` from scale-01. SERVE ⇒ route into today's wizard for that path (**bridge**: map Brief → existing audienceType/templateId/store prefills; product/service wizards untouched until spec 06). MANUAL-ONBOARD ⇒ capture screen.
5. **MANUAL-ONBOARD** (§7): same screen for no-coverage AND out-of-ICP (internal tag differs). Copy: "Not automated yet — someone from Lessgo AI will connect with you shortly." Email required, phone optional. Fast-track button ("Need it sooner?") ⇒ `fasttrack=true` + message upgrades to "Sushant will connect with you shortly to personalize." (§11.11)
6. **DemandLead model** (prisma): `{ input, briefDraft Json, missing (rungA-E|out-of-icp + capability/engine key), email, phone?, fasttrack, status new|contacted|converted|declined, createdAt }`. Founder notify via existing Resend lead-email pattern (env-gated). **Admin demand board** page under `src/app/admin/`: leads grouped by businessType/engine + missing capability, counts ranked, fasttrack pinned.
7. **Kill/bypass**: `/api/start` persona gate + `PILOT_SERVICE_PERSONAS` + `/onboarding/waitlist` + `/onboarding/persona` → replaced; old routes redirect. Coverage at launch = today's full set: meridian+vestria+hearth/lex/surge (§11.9); granth serveable when writer entry lands (spec 06).
8. Clerk-gated (beta-private, §11.10). Anonymous entry = post-site-20, out of scope.

## Scope OUT
Wizard changes (06) · structure/copy changes (07) · click system (04) · convert-loop resume-link automation (manual email by founder is fine v1).

## Acceptance
Real inputs: "growth agency for SaaS" ⇒ trust via lookup, confirm card, SERVE → service wizard prefilled (surge shortlisted). "photographer in Pune" ⇒ work, gate ⇒ MANUAL-ONBOARD, DemandLead logged missing=gallery(rung C), founder email fires, fast-track upgrades message. "online store with checkout" ⇒ out-of-icp tag, same screen. Misclassified input corrected on page 2 in 1 tap, gate runs on corrected Brief. Existing product/service flows still green e2e.

## Open questions
1. Confirm-card correction chooser: how many user-language cards (5 engines × phrasing) — copywriting task, founder reviews before launch.
2. Resume-link for converted leads: magic link back into funnel — v1 manual or build now? (lean manual)
