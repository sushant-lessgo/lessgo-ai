# RCA — why the expensive pipelines still shipped basic QA bugs (2026-07-18)

**Question (founder):** we spend a lot of tokens + time on detailed /feature pipelines (scout → plan → plan-review → implement → impl-review, with loops) — so why did the first QA pass surface *basic* defects (overflowing photos, cut text, wrong brand name, a kill-switch left off)?

**TL;DR:** The pipeline is optimized to produce **code correctness** (it compiles, types hold, logic is asserted, architecture is sound) — and it delivered that. But **~80% of the QA findings are NOT code-correctness defects.** They're rendered pixels, copy/brand, runtime config, UX judgment, and cross-feature flow — **five dimensions that no stage of the pipeline ever observes.** We spent review tokens hardening the ~20% dimension (code), and even there the project's own retro found the reviews mostly catch typos. The disappointment is real; the good news is the bugs are shallow (cheap to fix) because the *architecture* the tokens bought is sound.

---

## 1. Evidence — the finding distribution (18 July QA, `docs/qaTest/bugs18July.md`)

| Class | ~Count | Examples | Any pipeline gate see it? |
|---|---|---|---|
| Visual / CSS / asset | 5 | photo overflow, "C" half-cut, logo tiny+white-bg, center too small | ❌ nothing renders a pixel |
| Copy / brand | 3 | "Lessgo"→"Lessgo AI" (documented rule), "New site with AI" | ❌ no copy/brand check |
| Config / env / data | 5 | "site building switched off" (flag OFF in QA env), Git-vs-Google SSO, plan shows wrong tier, pricing numbers | ❌ builds code, never provisions runtime |
| UX / product judgment | 6 | 2 confusing action buttons (×2), greyed MERGE, presumptuous "Mid-range" rail, dead "something wrong?", no page remove/reorder | ❌ needs a human using it |
| Functional / logic | 5 | input box disabled, photos→wrong "what you sell" rail (×2), **photos vanish on "Looks right" (data loss)**, charge not in rail | ⚠️ only if a REAL app is driven; jsdom units don't |
| Cross-feature integration | 2 | double-onboarding (old wizard input → journey re-asks the same thing) | ❌ per-feature pipelines never walk the seam |

**Only ~1 in 5 findings is the kind of code-logic bug the pipeline could theoretically catch** — and most of *those* need a running app + real interaction (photos vanishing, input disabled) that the jsdom unit gate doesn't exercise.

---

## 2. Root causes

**RC1 — No agent ever renders or looks at the page.** The full pipeline (implementer + reviewers) reads and reasons about *code*. The gates (`tsc` / `vitest` / `lint` / `build`) verify types, asserted logic, and compilation. **None open a browser and look.** Every visual defect (overflow, cut text, logo, sizing, button confusion) is invisible to a text-only pipeline by construction. The tooling to look EXISTS (`/manual-test`, `claude-in-chrome`, `/verify`, `/run`) — it's just not wired as a pipeline gate; it lives in a manual checklist run at the END (now).

**RC2 — "All green" is a correctness proxy mistaken for a quality proxy.** Green means "it typechecks and the asserted logic holds," not "it works and looks right." The project already documents that even the tests that exist are often inert (`memory/project_inert_test_assertions`: "4 patterns that sit GREEN while false"; dashboard-lifecycle's "e2e-gate-was-theatre" lesson; the deploy-qa-checklist's own ground rule "Behavioral, not trust-the-green"). We over-trusted green.

**RC3 — Specs encode WHAT to build, not WHAT GOOD LOOKS LIKE.** The pipeline faithfully builds to spec. Specs carry functional requirements but not visual acceptance (asset, sizing, no-overflow), brand rules, or UX invariants (one primary CTA). So the implementer had no target and the reviewer no criteria for these. Poster child: **"Lessgo" vs "Lessgo AI" is a documented founder rule in memory** (`product_name_lessgo_ai`) yet shipped wrong — the knowledge existed, the pipeline had no hook to enforce it.

**RC4 — Runtime config/environment is entirely outside the pipeline.** "Site building is switched off for this account" (a kill-switch/flag never turned on in the QA env), Git-vs-Google SSO (Clerk config), plan/pricing display (data/config) — none are code. The pipeline builds code; it never provisions or verifies the runtime. These surfaced now because the QA preview is the **first time the code ran in a real environment** — exactly what `deploy-qa-checklist.md §A` predicted ("prod-only surfaces cannot be tested locally").

**RC5 — Per-feature pipelines are blind to cross-feature seams.** The double-onboarding bug (old wizard input → journey re-asks) is an *integration* defect between two separately-built features. Each passed its own pipeline; the seam between them was never walked end-to-end. `engineDecider.md` (the fix) was **agreed but not built**. Nobody owned the end-to-end new-user journey until this QA.

**RC6 — Scope gaps look like bugs.** "How do I remove/reorder pages?" (missing capability), "something wrong?" does nothing (shipped placeholder), presumptuous rail (product judgment) — the pipeline faithfully shipped an incomplete or placeholder spec. It builds what the spec says; it doesn't ask "is this actually usable?" That only surfaces when a human uses it.

**RC7 — First human look happened at commit ~252, not per-feature.** "Build everything, QA once" meant no feature got an eyes-on pass while it was fresh. ~30 features' worth of small visual/UX defects accumulated silently and surfaced in one overwhelming batch. The batch strategy is correct for the *push*; it was wrong for *first human look*. Early detection is orders of magnitude cheaper than finding 40 issues at once — and the *volume* is a big part of why this feels disappointing.

---

## 3. The uncomfortable part: the retro already predicted this

The `/discuss` tier guidance already records (2026-07-14 retro): *"across ~10 phase reviews, loop-1 ship rate ≈100% on light/standard work — reviews caught typos while real bugs were caught by browser QA, the lint hook, and prod checks. Reviews earn their tokens on risky surfaces."* We had the finding and kept paying for full review loops on UI-shaped work anyway. **The token spend went to the dimension that wasn't where the risk was.**

## 4. What the tokens DID buy (fair calibration)

This is not a catastrophic failure. The pipeline produced **architecturally sound, type-safe, logically-asserted code** — that's why almost every finding is *shallow*: a copy string, a CSS overflow, an asset swap, a flag to flip, a routing target, a placeholder to hide. **None are "the architecture is wrong" or "the data model is broken."** Remediation is cheap (one `/bugfix` round handles most). The pipeline hardened the expensive-to-fix layer and left the cheap-to-fix surface unpolished — which is the *opposite* of a disaster, just mis-weighted effort.

---

## 5. Fixes (prioritized)

**F1 — Put "eyes on the rendered page" INSIDE the pipeline, per feature.** For any UI-touching feature, a mandatory browser-render pass (screenshot + drive the real flow via `claude-in-chrome`/`/verify`) before it's called done. "Did anyone actually look at it?" becomes a gate, not a final-QA afterthought. *This alone kills the visual + most UX findings.*

**F2 — Rebalance the token budget by risk dimension.** The retro says loop-1 ship ≈100% and reviews catch typos on light/standard work. **Cut the plan-review/impl-review loops to a single pass on UI-shaped work; redirect that budget to F1 (render + real-flow verification).** Keep the full loops only on the risky surfaces where they earn their keep (auth/publish/store/middleware/billing). Tier by *where the risk actually is*, not by effort-to-build.

**F3 — Encode "what good looks like" into every spec + auto-inject known rules.** Extend the spec template with: visual acceptance (assets, sizing, no-overflow, responsive), brand/copy rules, UX invariants (one primary CTA). Auto-pull the founder's documented rules from memory into every UI spec (`product_name_lessgo_ai`, form-CTA pattern, greyed-placeholder pattern). Implementer builds TO it; reviewer checks AGAINST it.

**F4 — Cheap mechanizable lints for documented rules.** "Lessgo" not followed by "AI" is a grep — a pre-commit/CI check would've caught that finding for free. Add a small brand/copy lint; extend as rules accrue.

**F5 — Make runtime config an explicit per-feature gate.** Any feature touching a flag/SSO/plan/pricing/env ships a config checklist: which env vars, which Clerk/Stripe/data setup, verified in the target environment. "Site building switched off" was a checklist item, not a code fix.

**F6 — Own the end-to-end journey, not just features.** A scripted "new user does X across feature boundaries" walk BEFORE the big QA, run whenever a seam feature lands. Prioritize building `engineDecider.md` — the double-onboarding is its poster child.

**F7 — Insert a 5-minute per-feature glance even under batch strategy.** Keep "QA once, push once" for the *deploy*, but add a cheap render-glance (agent screenshot or 5-min founder look) when each feature is fresh. Don't let 30 features' polish debt pile to commit 252.

---

## 6. Immediate actions (this cycle)

1. **Fold F1 + F3 + F5 into the current `/bugfix` round's DoD** — each fix must be render-verified + config-verified before it's called done (don't repeat the miss while fixing it).
2. **Add F4's brand-name lint now** — it's a 15-minute win and enforces a standing rule.
3. **Amend `/feature` + the spec template with F1–F3** so the *next* cycle (the `next` branch: editor-route-consolidation + future) doesn't reproduce this. ← highest leverage.
4. **Re-scope the pipeline tiers per F2** — record in the feature `SKILL.md` Rules.
5. **Queue `engineDecider.md` for /discuss** (F6) — the double-onboarding is a top QA complaint and it's a cross-feature seam nothing else will catch.

**Bottom line for the founder:** the pipeline didn't fail at what it measures — it measured the wrong things for UI work. The bugs are cheap; the process fix (put eyes + config + brand-rules into the loop, and move review tokens from code-correctness to render-verification on UI work) is where the real value is, and it makes the *next* cycle much cleaner.
