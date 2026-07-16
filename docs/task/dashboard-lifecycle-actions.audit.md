# dashboard-lifecycle-actions — implementation audit

## Phase 1 — Dashboard plumbing: providers + URL helper

**Files changed**

- `src/lib/publishedUrl.ts` (new)
- `src/components/dashboard/ProjectGridCard.tsx`
- `src/components/dashboard/ProjectCardMenu.tsx`
- `src/app/dashboard/layout.tsx`
- `docs/task/dashboard-lifecycle-actions.audit.md` (new — this file)

### What changed, per file

**`src/lib/publishedUrl.ts` (new)** — DD8. Plain module, no `'use client'`, no DOM/hooks;
imported from both a client component (`ProjectCardMenu`) and a component reachable from the
server tree. Exports `publishedHost(slug)` → `{slug}.lessgo.site` and
`publishedUrl(slug, path = '/')` → `https://{slug}.lessgo.site{path}` (path normalised to a
leading slash).

**`src/components/dashboard/ProjectGridCard.tsx`** — the card sub-line `domain` label (was
`lessgo.ai/p/${project.slug}`, the internal SSR path) now uses `publishedHost(project.slug)`.
Draft/no-slug still renders the em-dash. No other change.

**`src/components/dashboard/ProjectCardMenu.tsx`** — "Visit site" now opens
`publishedUrl(project.slug)` instead of `/p/${project.slug}`. PostHog `project_preview_clicked`
untouched: same single call site, same properties, still fires before the guard. Menu item
disabled states untouched (un-greying is phase 5/6). `@/components/ui/dropdown-menu` NOT edited.

**`src/app/dashboard/layout.tsx`** — DD6. The layout existed (S1 shell), so no thin client
wrapper was needed. `<ToastProvider>` wraps the `.app-chrome` shell; `<DialogHost />` mounts
inside `.app-chrome` as a sibling of the `<main>` scroll container. Layout stays a server
component (both imports are `'use client'`; Next inserts the boundary). Comment block records
why the mount is load-bearing (silent `window.confirm` fallback without it).

### Decisions

1. **ToastProvider source = `@/components/ui/toast`, NOT the edit-page-local one.** The task
   pointed at `src/app/edit/[token]/page.tsx:8-9` as the mount *pattern*, and that page imports
   `./components/ui/ToastProvider`. Two providers exist and `src/components/ui/README.md:122` +
   `toast.tsx:16-18` both explicitly rule "do not import" the edit-page-local one from outside
   the editor. Took the app-chrome provider (`@/components/ui/toast`) — the ui-foundation one,
   app-* tokened, built for this shell. In-scope ambiguity, conservative pick; no file outside
   the list touched either way. **Consumers in later phases must use its `useToast()` hook API
   (`toast(msg, { variant })`), not the editor's global `showToast()` singleton.**
2. **`publishedHost` delegates to the existing `publishedSubdomainHost` (`@/lib/domains/hosts`)**
   rather than re-hard-coding `lessgo.site`. Single source of truth, and it keeps the
   `LESSGO_PUBLISH_HOST` env override honoured. DD8's stated output shape is unchanged.
   `hosts.ts` is imported only, never edited.
3. **Added `'noopener'` to the `window.open` in "Visit site."** It is now a cross-origin open
   (`lessgo.site` from the app host), where it previously was same-origin — the opened tab would
   otherwise get a live `window.opener` handle back into the dashboard. One-word hardening at a
   line the phase already required changing.

### Deviations from the plan

- None on scope. Decision 1 is a plan-vs-codebase-ruling reconciliation (recorded above);
  decisions 2 and 3 are implementation choices within the phase's files.
- DD5 honoured: `ConfirmDialog.tsx` NOT restyled, not touched at all.
- DD8's deferred literals (`SlugModal.tsx:39,:119`, `domain/LiveStep.tsx:64`) left alone.
  Note for phase 7's follow-up list: they live at `src/components/SlugModal.tsx` and
  `src/components/domain/LiveStep.tsx` — **not** under `src/components/dashboard/`.

### Surprises

- Fresh-worktree tsc false positive behaved exactly as the plan warned: one `npm run build`
  generated `next-env.d.ts` and tsc went clean. Not "fixed", no asset added.
- The plan's assumption "`src/app/dashboard/layout.tsx` exists (S1 shell)" holds — it is a
  server component doing Clerk + plan reads, with a documented read-only invariant that this
  phase does not disturb.

### Verification

`npm run build` — green (needed once for `next-env.d.ts`; also confirms the client/server
boundary of the new layout imports is legal).

`npx tsc --noEmit`:
```
TSC_EXIT=0
```
(no output, no errors — including no `src/app/page.tsx` founder.jpg error post-build)

`npm run test:run`:
```
 Test Files  194 passed | 1 skipped (195)
      Tests  3343 passed | 18 skipped (3361)
   Duration  60.26s
```

Manual dev pass (dashboard card label / Visit site / `confirmDialog()` renders the dialog rather
than `window.confirm`) NOT performed — no dev server run in this phase; left for the phase-5
manual pass where the dialog has a real caller.

### Open risks

- **`DialogHost`'s host singleton is module-global** (`enqueueRequest`, ConfirmDialog.tsx:40).
  If a dashboard route ever nests a second `DialogHost` (e.g. an editor surface embedded under
  `/dashboard/*`), the last one mounted wins and the other's queue goes dead. Only one is
  mounted today; worth a look if a later phase mounts editor chrome inside the dashboard shell.
- **Toast provider duality persists** — the editor tree and the dashboard tree now use different
  toast systems. Fine (disjoint trees), but a shared component calling the wrong one would
  no-op silently. Unifying them is explicitly a consuming-spec job per `toast.tsx:16-18`.
- `publishedUrl` does not consider a live custom domain (documented in the module header).
  Correct for this phase's two call sites — a custom-domain page is still reachable at its
  subdomain — but a future "canonical URL" surface should use `resolvePublishedHost` instead.
