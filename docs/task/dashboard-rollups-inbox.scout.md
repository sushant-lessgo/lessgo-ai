# dashboard-rollups-inbox — scout findings

> Read-only exploration output. Feeds the planner. Base = main (contains ui-foundation + S1 + S2).

## 1. Route shape

`src/app/dashboard/`:
- `layout.tsx` — the shell (server): `ToastProvider` > `.app-chrome` > `<AppSidebar profile plan>` + `<DashboardTopBar/>` + `<main>{children}</main>` + `<DialogHost/>`.
  **Explicitly NOT an auth boundary** (L23-25): "each page owner-scopes its own query".
  Uses read-only `userPlan.findUnique` / `publishedPage.count({where:{userId}})` — **do NOT swap to `getUserPlan()`** (get-or-create, seeds credits).
- `page.tsx` — projects board (dashboard root).
- `[token]/{page,layout}.tsx` + `[token]/{analytics,leads,blog,testimonials}/` — **per-site, token-scoped**.
  - analytics components: `[token]/analytics/components/{MetricsCards,TrendChart,TrafficSourcesTable,DeviceBreakdown,CtaBreakdown,ExportCSV,EmptyState}.tsx`
  - leads components: `[token]/leads/components/ExportFormCSV.tsx`
- Account-level existing: `billing/`, `settings/`, `testimonials/`.
- **Legacy slug shims (redirects only):** `analytics/[slug]/page.tsx`, `forms/[slug]/page.tsx`, `blog/[slug]/`.

⚠️ **Spec refs L66-68 are STALE** — cites `dashboard/analytics/[slug]/page.tsx` + `forms/[slug]/page.tsx` as the per-site views; those are redirect shims. Real bodies: `dashboard/[token]/{analytics,leads}/page.tsx`.

**Route slots:** `/dashboard/analytics` → new `analytics/page.tsx` sits as sibling of the existing `analytics/[slug]/` shim (legal). `/dashboard/leads` → **free** (account-level slug folder is `forms/`, not `leads/`).

## 2. Sidebar nav

`src/components/dashboard/AppSidebar.tsx` (`'use client'`, `usePathname()` drives active). Items are **hand-written JSX, not an array**.

Greyed via local `DisabledNavItem` (L47-62): `<button disabled aria-disabled="true" className={cn(navItemClasses(false), 'cursor-not-allowed opacity-50 …')}>`.

- **S4 targets** L113-115:
  ```tsx
  <DisabledNavItem icon="monitoring" label="All Analytics" />
  <DisabledNavItem icon="move_to_inbox" label="All Leads" />
  ```
- L132: `<DisabledNavItem icon="language" label="Domains" />` (R15 — **leave greyed**).
- **S3 billing seam = same file, different region**: plan widget L136-154; Upgrade span L150-152.
- **Only genuine collision surface:** header doc-comment L20-23 (lists what's greyed + why) and possibly new `analyticsActive`/`leadsActive` consts near L80-81.

Enabled-item shape to copy (L103-112):
```tsx
<NavItem asChild active={x} className={x ? 'font-semibold' : undefined}>
  <Link href="…"><AppIcon name="…" filled={x} size={20} />Label</Link>
</NavItem>
```
`NavItem` + `navItemClasses` from `src/components/ui/nav-item.tsx` — **frozen foundation primitive, no `disabled` prop, do not edit**.

## 3. Auth + own-data scoping — #1 RISK

### THREE ID SPACES (documented `src/lib/workspace.ts:43-56`)
| Model | `userId` holds |
|---|---|
| `Project.userId` | **internal `User.id`** |
| `PublishedPage.userId` | **Clerk id** |
| `FormSubmission.userId` | **Clerk id** |
| `Testimonial.userId` | **Clerk id** |

**A wrong-space filter is tsc-green and silently returns ZERO rows.** Never join across spaces.

### Canonical patterns
1. **Token-scoped** → `getWorkspaceProject(tokenId)` (`src/lib/workspace.ts:91`) → `{project, publishedPage|null, adminOverride, clerkId}`. Wraps `assertProjectOwner` (`src/lib/security.ts:57-124`) which **returns, never throws**, and whose `{ok:true}` does NOT mean ownership (demo-token/orphan/admin branches widen it). The wrapper's 4-step rejection ladder (`workspace.ts:100-108`) fixes that. Returned `clerkId` = the **OWNER's**, not the admin's. *Not applicable to account-level rollups (no token).*
2. **Account-level (the pattern S4 follows)** → `src/app/dashboard/page.tsx:22-43`:
   ```ts
   const { userId } = await auth()            // Clerk id
   if (!userId) return null
   const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { projects: {…} } })
   const viewerIsAdmin = isAdmin(userId)      // from '@/lib/admin'
   ```
   Admin god-view = explicit `if (viewerIsAdmin) { findMany, no owner filter, take:200 } else { where:{userId} }` (`page.tsx:73-121`), + `user.email` for labelling + truncation notice at 200.
   `publishedPage.findMany({ where:{ userId } })` uses **raw Clerk userId** (correct — PublishedPage.userId is Clerk).

### Existing per-site scoping
- analytics scopes by **`slug` only** (from post-authz `publishedPage`) — `[token]/analytics/page.tsx:81-92`
- leads scopes by **`publishedPageId` only** — `[token]/leads/page.tsx:72-79`
- Both carry 🚨 comments: **do NOT re-add a `userId` filter** (wrong ID space + blanks admin god-view).
- For the account rollup the **inverse** holds: `userId` IS correct, since there's no token authz to inherit.

### 🚨 FormSubmission.userId is ATTACKER-CONTROLLABLE
`/api/forms/submit` takes **both `userId` and `publishedPageId` from the client-supplied request body** (`route.ts:57`, written `:198-199`). So a `where:{userId}` inbox can:
- **miss** the user's own leads whose userId was stamped wrong, and
- **show** rows an attacker stamped with this user's id.

→ **Scope the inbox by `publishedPageId: { in: <user's own PublishedPage.ids> }`** (resolve via `publishedPage.findMany({where:{userId}, select:{id,slug,title}})`). Matches the per-site page's provenance argument. Spec L38 ("every query filters by the user's `userId`") is the **weaker** option here.

## 4. Data model (`prisma/schema.prisma`)

- **`PageAnalytics` (L359-400)** — `id`, **`slug` String (no relation, NO userId)**, `date @db.Date`, `views`, `uniqueVisitors`, `formSubmissions`, `conversionRate`, `avgTimeOnPage?`, `medianTimeOnPage?`, `bounceRate?`, `ctaClicks`, `topReferrers Json?`, `topUtmSources Json?`, `ctaPlacements Json?`, `{desktop,mobile,tablet}Views`, `{desktop,mobile,tablet}Conversions`, `createdAt/updatedAt`.
  Indexes: `@@unique([slug,date])`, `@@index([slug,date])`, `@@index([date])`, `@@index([slug])`.
  → **Join via `PublishedPage.slug`.** Rollup: `publishedPage.findMany({where:{userId}, select:{slug,title,projectId}})` → `pageAnalytics.findMany({where:{ slug:{in:slugs}, date:{gte,lte} }})` → group by slug in JS. `[slug,date]` index supports it.
- **`FormSubmission` (L229-245)** — `id`, `userId` (**Clerk id, bare, no relation**), `publishedPageId String?` (**nullable, indexed scalar, NO relation, NO unique**), `formId`, `formName`, `data Json` (lead payload), `ipAddress?`, `userAgent?`, `createdAt`, `notifiedAt?`, `notifyError?`.
  Indexes: `@@index([userId])`, `@@index([formId])`, `@@index([publishedPageId])`.
  → **No compound `[publishedPageId, createdAt]`** → `orderBy: createdAt desc` + `take` over `publishedPageId:{in:[…]}` sorts in-memory. Fine at beta volume; note for pagination.
- **`PublishedPage` (L145+)** — `userId` (**Clerk id, "external, not a foreign key"**), `slug @unique`, `title?`, `projectId?`, `publishState`, `customDomain?`, `isPublished`, `views Int`. Resolve a user's sites: `publishedPage.findMany({ where:{ userId } })` — **no Project join needed**.
- **`User` (L10-18)** — `id` (cuid), `clerkId @unique`, `email?`, `persona?`, `projects`.
- **No existing aggregation helper** — per-site analytics does all totals inline with `.reduce()` (`[token]/analytics/page.tsx:110-214`). Worth extracting a shared helper.

## 5. UI primitives

- ui-foundation tokens: **`app-*` Tailwind keys only** (never stock Tailwind — those feed template rendering; `src/components/ui/README.md` "Attach rules"). In use: `bg-app-surface`, `border-app-border`, `bg-app-tint`, `text-app-ink`, `text-app-faint`, `text-app-primary`, `text-app-placeholder`, `text-app-cta`, `font-app-sans`, `font-app-mono`, `rounded-app-input`, `rounded-app-pill`.
- `src/components/ui/`: `nav-item.tsx` (`NavItem`, `navItemClasses`), `icon.tsx` (`AppIcon` — ⚠️ material ligature names render as **text**, poisons `toHaveText`), `card.tsx`, `badge.tsx`, `button.tsx`, `tabs.tsx`, `segmented-control.tsx`, `toast.tsx` (`ToastProvider`), `ConfirmDialog.tsx` (`DialogHost`, `confirmDialog`/`promptDialog`), `popover.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`.
- **No table / stat-tile / list-detail / empty-state primitive exists.**
- `src/components/dashboard/FormSubmissionsTable.tsx` — renders `FormSubmission[]`; **directly reusable** for the inbox master list.
- ⚠️ Per-site analytics components (`MetricsCards` takes `{totals, previousTotals, sparklineData}`, `TrendChart`, `TrafficSourcesTable`, `DeviceBreakdown`, `CtaBreakdown`, `EmptyState`, `ExportCSV`) are **all legacy stock Tailwind** (`bg-white border-gray-200 rounded-xl`, `bg-gray-50`, `font-body`, `text-brand-*`), NOT `app-*`. Both per-site pages were "moved as-is, no reskin".
- Canonical `app-*` empty-state markup to copy: `[token]/leads/page.tsx:56-66`.

## 6. Tests

- **Authed Playwright fixture:** `e2e/auth.setup.ts` (Clerk via `@clerk/testing`) + `e2e/global.setup.ts`; helper `e2e/helpers/seedDraft.ts`. Serial/1-worker.
  ⚠️ **Single account only** — no second-user fixture → a true cross-user e2e needs new infra; a **vitest unit test on the query-scoping helper is the cheaper gate**.
- Dashboard patterns: `e2e/dashboard-shell.spec.ts`, `dashboard-workspace.spec.ts`, `dashboard-lifecycle.spec.ts`, `dashboard-redirects.spec.ts`.
- 🚨 **`e2e/dashboard-shell.spec.ts:43-70` WILL FAIL on un-grey** — test `'un-built controls are greyed in place (All Analytics / All Leads / Domains / bell)'` asserts All Analytics + All Leads `toBeDisabled()` + `aria-disabled="true"`; L68-69 asserts `allLeads` `toHaveText(/All Leads$/)` (R14 no-count-pill guard). Must narrow the loop to `['Domains']` (+ bell) and honour the count-pill ruling.
- Primitive test examples: `src/components/ui/{segmented-control,tabs,toast}.test.tsx`. `src/modules/generatedLanding/uiFoundationIsolation.test.tsx` (+ snapshot) and `e2e/ui-isolation.spec.ts` guard `.app-chrome` never reaching template markup.

## Flags raised
1. Spec per-site file refs (L66-68) stale → real bodies under `[token]/`.
2. `FormSubmission.userId` client-supplied → prefer `publishedPageId in (own page ids)`.
3. `PageAnalytics` has no userId → join via `PublishedPage.slug`.
4. Existing analytics components are legacy-Tailwind → conflict with spec L40 "built on ui-foundation".
5. `e2e/dashboard-shell.spec.ts:43-70` must change — un-grey without it = red gate.
6. Admin god-view for a cross-site rollup is semantically undefined (S1 = "all projects, take:200" → admin would see an everyone-analytics blob).
7. S3 merge seam is narrow — only the `AppSidebar.tsx` doc-comment L20-23 genuinely collides.
