# dashboard-lifecycle — spec

> Source: `docs/reports/app-ui-ux-assessment.md` §1.2, §3 P0.2/P0.6/P0.8, P1, P2. Contains beta blockers.

## Problem / why
The dashboard leaks internal state and offers no project lifecycle. Every card shows an `owner: (orphan)` debug badge (admin-all single-tenant shortcut). "Published at /p/slug" is stale — live URL is `slug.lessgo.site`, so users copy the wrong link mentally. No rename / delete / duplicate → draft clutter is permanent (~35 projects, a dozen junk "New Project" drafts, flat unbounded list). Critically, **a mispublish is permanent — no unpublish/take-down path exists.**

## Goal
The dashboard shows only the user's own projects with correct live URLs, and users can manage their project lifecycle — rename, delete, and take a published page down.

## Decision (from discuss)
Unpublish = **real user-facing feature** (not admin-only tool).

## Scope IN
- Remove `owner: (orphan)` badge; dashboard shows own-projects only (kill admin-all view for normal users).
- "Published at" label → real subdomain URL (`slug.lessgo.site`), not `/p/slug`.
- Project **delete** (at minimum drafts; ideally any project with confirm).
- **Unpublish / take-down**: user removes their own published page → `publishState` back to draft, KV routes + blob cleaned up.
- Project **rename**.
- P1/P2 (fold if cheap, else defer): duplicate; search/filter/pagination for long lists; auto-name drafts from one-liner (kill "New Project" ×12).

## Scope OUT (non-goals)
- Billing/credits surface on dashboard (owned by pricing-v2 in-app surface).
- Analytics/forms/testimonials screens (separate, already decent).
- Custom-domain teardown UX beyond what unpublish needs.

## Constraints
- Own-projects filter must use the real ownership assertion (`assertProjectOwner`), not the admin-all shortcut — this is a known before-customer-2 item.
- Unpublish touches the publish pipeline: `publishState` machine (`draft → publishing → published | failed`), Vercel Blob (`pages/{pageId}/{version}/index.html`), KV routes — teardown must be atomic and match publish's cleanup path.
- Delete of a *published* project must also unpublish (no orphaned live pages / KV routes).

## References
- `src/components/dashboard/` — cards + list.
- `src/lib/admin.ts` `requireAdmin()`; `assertProjectOwner` (token-edit authz fix pattern).
- `/api/publish` + `publishState` machine; `src/lib/routing/kvRoutes.ts`; blob-proxy.
- `docs/architecture/publishArch.md`.
- Report §1.2.

## Open exploration questions
- Where does the dashboard query projects, and where does the admin-all / orphan-owner path live?
- Is there any existing take-down/unpublish code (memory says none)? What does publish's failure-cleanup do that unpublish can reuse?
- Where is the live URL string built for the "Published at" label?
- How are drafts named on creation (source of "New Project")?

## Candidate human gates
- Unpublish / take-down (irreversible on live pages — KV + blob teardown).
- Delete project (data loss — confirm scope: drafts only vs any).
- Own-projects access-control change (authz — plan-mode per project rule).

## Acceptance criteria
- [ ] No `owner: (orphan)` badge; a non-admin user sees only their own projects.
- [ ] "Published at" shows the real `slug.lessgo.site` URL.
- [ ] User can delete a project (with confirm); deleting a published one also takes it down.
- [ ] User can unpublish a live page → it stops serving (KV + blob cleaned, `publishState` = draft), re-publish works.
- [ ] User can rename a project.

## Pilot / smallest slice
Slice 1 (blockers): own-projects filter + orphan badge removal + real URL + delete + unpublish. Gate: a mispublished page can be taken down and the dashboard shows only my projects. Slice 2 (P1/P2): rename/duplicate/search/pagination/auto-name.
