# publish-ux — spec

> Source: `docs/reports/app-ui-ux-assessment.md` §1.6, §3 P0.3, P1. Contains a beta blocker.

## Problem / why
The publish flow renders true-to-live and is fast, but its defaults sabotage first-time users:
- **Publish modal defaults are throwaway**: slug `page-1783851507192`, title "Untitled Page" — the app knows the product name from onboarding and uses neither. Most users publish these straight to their public URL + SEO title.
- "Enable analytics tracking" **unchecked by default** — most users want it, and this modal is the only place they'll ever see the option.
- Custom Domain button **disabled with no tooltip/explanation** — user can't tell if it's a plan gate or publish-first.
- **No publish preflight** — nothing warns about dead CTA links, missing meta description, or placeholder content before going live.

## Goal
Publishing produces sensible public defaults (a real slug + title from the business), analytics on by default, a clear reason when custom-domain is unavailable, and a preflight that catches obvious "don't ship this" problems.

## Scope IN
- Publish modal: default slug + title derived from project/business name (from onboarding), not `page-<ts>` / "Untitled Page".
- Analytics tracking checkbox default **ON**.
- Custom Domain disabled state: explain why (plan gate vs publish-first) via tooltip/inline text.
- Publish preflight warnings: dead CTA links, missing meta description, known placeholder content — surfaced (non-blocking warn) before publish.

## Scope OUT (non-goals)
- The actual content-hygiene fixes (footer year, empty columns, dead links, HTML-in-meta) — owned by `published-output-hygiene`. Preflight here only *detects/warns*; the fixes live there.
- Custom-domain full flow (verification/DNS/SSL) — out of scope.
- Pricing/plan gating logic itself (pricing-v2) — this only *explains* the gated state.

## Constraints
- Default slug must still pass uniqueness (`/api/checkSlug`) — derive-then-dedupe.
- Preflight is advisory (warn, not block) for beta — don't trap users who intend dead CTAs.
- Cross-reference `published-output-hygiene` so preflight checks and the fixes stay in sync.

## References
- `/api/publish`, `/api/checkSlug`; publish modal component; `/preview/[token]` sticky bar.
- `docs/architecture/publishArch.md`.
- Report §1.6.

## Open exploration questions
- Where is the publish modal, and where do the default slug/title come from?
- Where is the analytics-enable default set?
- What gates the Custom Domain button (plan vs publish state)?
- What signals are available at publish time to build preflight (CTA link presence, meta description, placeholder markers)?

## Candidate human gates
- None hard (publish itself is user-initiated). Confirm default-analytics-ON is acceptable privacy-wise for beta.

## Acceptance criteria
- [ ] Publish modal pre-fills slug + title from the business name (deduped for uniqueness), not `page-<ts>` / "Untitled Page".
- [ ] Analytics checkbox defaults ON.
- [ ] Disabled Custom Domain button shows a reason.
- [ ] Preflight warns on dead CTA links / missing meta / placeholder content before publish (advisory).

## Pilot / smallest slice
Slice 1 (blocker): real default slug + title + analytics-ON. Slice 2: custom-domain explainer + preflight. Gate: a user who clicks straight through publish gets a business-named URL/title and analytics on.
