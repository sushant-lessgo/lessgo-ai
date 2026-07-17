# UI Redesign — track plan

Created: 2026-07-15. Trigger: designer handoff landed at
`docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/` (4 surfaces: Onboarding,
Editor, Dashboard, Auth — see its `README.md` for tokens + screen index).
This doc formally **lifts the productQueue "UI-reimagine hold"** (2026-07-14) — the
reimagine direction has landed.

## What this track owns (and doesn't)

**The rule: ownership follows functionality; design is an input, never an owner.**

Every handoff screen gets exactly ONE kind:

| Kind | Meaning | Owner | Spec lives |
|---|---|---|---|
| **Reskin** | functionality exists, look changes | THIS track | `docs/task/*-redesign.spec.md` |
| **First-UI** | backend exists, no UI ever built | THIS track | same |
| **New-behavior** | functionality doesn't exist | its behavior track (workEndtoEnd / toolbarPlan) | that track's spec, citing the handoff screen as design |

Never two specs per screen. New-behavior screens are built ONCE, directly in the new
design — never "build ugly then reskin."

Related docs:
- `docs/tracks/workEndtoEnd.md` — work-vertical behavior (journey, promises). Handoff
  Onboarding file = its steps 1–7 designed.
- `docs/tracks/toolbarPlan.md` — toolbar action contract. Handoff t2/t4/t5 = its visual skin.
- `docs/tracks/uiRequirements.md` — the designer brief. **SUPERSEDED by the handoff**;
  kept for reference only.
- Handoff folder — read-only visual source of truth; never edited; specs point into it
  by badge ID (`t7`, `TURN 6`, `STEP 03`).

## Screen triage (the mapping table)

| Handoff screen | Kind | Owner / spec | Notes |
|---|---|---|---|
| Auth (1b) | Reskin | this track → `auth-redesign.spec.md` | Clerk brand wrap, founder framing. Light tier |
| Dashboard projects grid + card menu (TURN 8) | Reskin + gaps | this track → `dashboard-redesign.spec.md` | absorbs held `dashboard-lifecycle.spec.md` (unpublish/delete/rename/dup — backend gates survive as specced) |
| Project workspace IA (TURN 3–4) | Reskin | `dashboard-redesign.spec.md` | site = a place; re-routes existing analytics/forms/blog surfaces |
| Billing/plan/credits (TURN 6a) | **First-UI** | `dashboard-redesign.spec.md` | pricing-v2 backend shipped, zero UI; absorbs held `plan-credits-surface.spec.md` |
| Domains (TURN 6b), Leads (5b), Blog composer (5a) | Reskin | `dashboard-redesign.spec.md` | |
| Profile/account (TURN 7), notifications panel (8b) | Reskin / new-behavior split | profile = reskin (this track); notifications = backlog | |
| Sequences screens (3c) | First-UI, **parked** | waits for email-sequences un-hold | built dark + merge HELD; don't spec UI until un-held |
| Editor shell/chrome (t1) | Reskin | this track → `editor-shell-redesign.spec.md` | absorbs held `editor-chrome.spec.md`; coordinate w/ editor track #0 |
| Design menu (t14), SEO/settings (t16/t18) | Reskin | `editor-shell-redesign.spec.md` | |
| Publish flow (t17) | Reskin | `editor-shell-redesign.spec.md` | absorbs held `publish-ux.spec.md` |
| Toolbars (t2), link picker (t4), manage-items (t5) | New-behavior | **toolbarPlan** | contract closed 2026-07-14; `selection-highlight-labels.spec.md` in flight as precursor |
| Media library + storage manager (t7/t8) | New-behavior | **t7 picker SPECCED** (`media-library-picker.spec.md`) — new `MediaAsset` model + picker (Upload/Stock) + image pipeline, wired into main Replace + **de-risks work-onboarding E2 ingestion**; wire-not-rip (stragglers fast-follow); **t8 storage manager (folders/usage/replace-everywhere) DEFERRED**; Unsplash + From-CMS deferred | image-pipeline adjacency; distinct from work-library board (asset picker vs content groups) |
| CMS boards (t12/t19/t22) | New-behavior | **work vertical** | collections code exists (scale-10); board = missing "part 1" per workEndtoEnd §8a; later fixes Naayom products free |
| Onboarding (STEP 01–06) | New-behavior | **work vertical phase E** → `work-onboarding.spec.md` (unwritten) | behavior from workEndtoEnd steps 1–7; visuals from handoff Onboarding file |
| Add page (t11) | Split | modal restyle → `editor-shell-redesign`; template page-set logic → work vertical (skeleton) | |
| Version history (t21), review center (t10), copy eval (t15), setup popup (t9), Ask AI (t20) | New-behavior, **backlog** | `productBacklog.md` | t20 marked POST-BETA by designer |

## Execution lanes (parallel-safe)

**Lane 1 — Reskin lane (this track).** Sequential, each = own /discuss → spec → /feature:
1. `ui-foundation.spec.md` — tokens (Onest, JetBrains Mono, Material Symbols Rounded,
   color/radius/shadow table from handoff README) + shared primitives (buttons, inputs,
   cards, badges, modal shell). **Merges before any other redesign spec starts.**
2. `auth-redesign.spec.md`
3. `dashboard-redesign.spec.md` (incl. billing first-UI)
4. `editor-shell-redesign.spec.md`

**Lane 2 — Work vertical lane** (founder's current focus):
D gate (work-skeleton verification) → E `work-onboarding.spec.md` → work-library/CMS
boards. All specs under workEndtoEnd, visuals cited from handoff.

**Lane 3 — Toolbar lane:**
selection-highlight-labels (in flight) → shell migration per toolbarPlan's own
sequencing; Design ▾ + rich toolbars unblock after skeleton D merges.

**Cross-lane rules:**
- Lane 1 never touches editor selection/store internals (Lane 3 turf) or template
  blocks/skeleton (Lane 2 turf).
- **Designs are canonical as-delivered** (founder pruned all alternate explorations
  2026-07-15; one desired design per screen). Build what's in the file — no variant
  picking step. Leftover a/b/c badge IDs are just anchors, not choices.
- New-behavior specs MUST cite their handoff badge IDs so nothing gets designed twice.

## Retirements (effective this doc)

- Held app-UI table in `productQueue.md`: `dashboard-lifecycle.spec.md`,
  `plan-credits-surface.spec.md`, `publish-ux.spec.md`, `editor-chrome.spec.md` —
  absorbed per triage table above; specs stay on disk as requirements input for the
  absorbing redesign specs.
- `docs/tracks/uiRequirements.md` — superseded (brief delivered).

## Status

| Item | Status |
|---|---|
| ui-foundation | specced + `/feature` STARTED (feature/ui-foundation) 2026-07-16; font-license gate resolved into spec |
| auth-redesign | specced (`auth-redesign.spec.md`) — light tier, Clerk `appearance` wrap, copy locked; hold /feature until ui-foundation merges |
| dashboard-redesign | **SPLIT by risk** (see below); S1 specced (`dashboard-workspace-ia.spec.md`) |
| editor-shell-redesign | specced (`editor-shell-redesign.spec.md`) — full tier; "Command Bar"=top-bar reskin (not Ctrl+K palette); full skin + grey-out; presentation-only, internals untouched; absorbs held editor-chrome + publish-ux |

### Dashboard redesign — risk-cut split (2026-07-16)
Handoff `Lessgo Dashboard.dc.html` (rev 2026-07-16) is richer than triage implied: adaptive
home shell (1a–1c), cross-site All Analytics/All Leads rollups, leads-as-inbox + AI reply,
notifications panel, Grow hub (= held social/email/outreach tracks). Cut by **risk/tier**, not
dependency, so cosmetic work stays light/standard and risky backend gets concentrated review:

| Slice | Scope | Tier | Status |
|---|---|---|---|
| S1 `dashboard-workspace-ia` | nav shell (both levels) + grid + ••• shell (destructive greyed) + token-spined URL restructure re-homing existing per-project surfaces as-is + basic Overview + empty state | full (blast radius + authz on moved routes) | **MERGED** |
| S2 `dashboard-lifecycle-actions` | wire S1's greyed ••• → rename/dup/delete + add unpublish; take-down reuses publish cleanup (KV+blob atomic); **custom-domain attached = BLOCK teardown (guard, no auto-detach)**; delete=any w/ explicit confirm, published cascades take-down; all via assertProjectOwner. Supersedes held `dashboard-lifecycle.spec.md` | full (publish/KV/DB + custom-domain) | specced |
| S3 `billing-beta` | **LEAN BETA** monetization surface: plan+credit widget/counter, lean Billing&plan view, Upgrade/Top-up CTAs→Stripe Checkout, Manage-billing→Stripe portal, costs-at-action, **gating message** (block→upgrade). Absorbs+supersedes held `plan-credits-surface`. Config-driven (planManager/creditSystem = truth, handoff 2g = visuals only). **Full 2g console (payment method/invoices/usage meters/change-plan cards) DEFERRED post-beta.** | full (Stripe/credits + cross-surface) | specced |
| S4 rollups + leads inbox | cross-site All Analytics + All Leads inbox + AI reply-draft | new-behavior | pending |
| later | Grow hub (**GATED** — respect social/email/outreach kill-switches; social-posts has none), notifications panel, profile/account reskin, blog first-run/AI-write, Overview KPIs, interior reskins | mixed | pending |

Locked decisions: URL restructure = real + token-spined (token = routing key NOT authz →
keep `assertProjectOwner` on every moved route); S1 grid ships ••• with destructive greyed;
Grow UI approved to build but must not un-hold ungated paid features.
