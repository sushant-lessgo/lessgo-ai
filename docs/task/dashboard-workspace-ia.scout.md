# dashboard-workspace-ia — scout findings + orchestrator rulings

Condensed from 5 parallel scouts (authz, routing seam, components, middleware, design handoff).
This is the planner's factual base — do NOT re-explore these; trust these findings.
WORKDIR = `C:\Users\susha\lessgo-ai\.claude\worktrees\dashboard-workspace-ia`, branch `feature/dashboard-workspace-ia`.

---

## A. Authz (spec's mandatory gate)

**`assertProjectOwner`** — `src/lib/security.ts:57-124`
```ts
assertProjectOwner(clerkId: string|null|undefined, tokenId: string,
  opts: {action: string; claimIfOrphan?: boolean; allowMissing?: boolean}): Promise<ProjectOwnerResult>
```
- Takes **tokenId only**. Looks up `Project.findUnique({where:{tokenId}})` (`:79`).
- **Returns, never throws.** `{ok:true, isDemo, adminOverride, userRecord, project}` | `{ok:false, status, error}` (401/404/403).
- Ladder: demo token `lessgodemomockdata` → allow (`:63`); owner → allow (`:93`); orphan `userId==null` → allow (+claim if opt) (`:98`); missing project → `allowMissing` ? allow : 404 (`:85`).
- **Admin god-view built in** (`:113`): `isAdmin(clerkId)` → `logAdminOverride()` → `{ok:true, adminOverride:true}`.
- It's **API-shaped** (returns status codes, not `notFound()`) → **pages need a thin server wrapper** that maps `{ok:false}` → `notFound()`/`redirect()`.
- It does **not** return display data — callers re-query the project themselves.

**Current state per route — CRITICAL CORRECTION TO THE SPEC:**

| Route | Check today | Gap? |
|---|---|---|
| `dashboard/page.tsx` | `auth()` + `isAdmin` god-view branch (`:37,56-90`) | no (account-level) |
| `analytics/[slug]` `:34-39` | `publishedPage.findFirst({slug, userId})` — scoped query | no leak, **no admin god-view** |
| `forms/[slug]` `:25-30` | same scoped-query pattern | same |
| `blog/[slug]` `:24-27` | same, then `project.findUnique(id)` | same |
| `blog/[slug]/[postId]` `:20-33` | same + `post.projectId===publishedPage.projectId` | same |
| `blog/[slug]/[postId]/preview` `:23` | `ctx.page.userId!==userId → notFound` | same |
| `testimonials/page.tsx` `:17-31` | `listTestimonialsByOwner(userId)` | no (owner-scoped) |
| `emails/[token]` `:54`, `outreach/[token]` `:34`, `social/[token]` `:33` | **`assertProjectOwner`** | no |

> **The spec assumed a token-only bypass gap. There is none — every route is already owner-scoped.**
> The real asymmetry: `[slug]` routes hard-scope on `userId` and therefore **silently 404 for admins**,
> while `[token]` routes get god-view. **Re-homing slug surfaces onto `assertProjectOwner` ADDS admin
> god-view where none existed — a real behavior change, not a no-op.** Spec lines 59/85 want this; call it out.

**Admin**: `src/lib/admin.ts:6-13` `isAdmin(clerkId)` from `ADMIN_CLERK_IDS`. `requireAdmin(req)` (`:56-65`) is
**API-only** (`NextRequest`→`NextResponse`) — **NOT usable in server components**; pages must use `isAdmin`.
`logAdminOverride` (`:34-54`) is best-effort, swallows errors.

**Rendering model**: all per-project dashboard pages are **async server components doing their own Prisma
lookups** (only `billing/page.tsx` is `'use client'`). Check belongs **in the page body**.
⚠️ A `[token]/layout.tsx` check is **NOT a sufficient auth boundary** — Next.js does not re-run layouts as a
guard on every nested render. Layout may host chrome; **each page still re-checks + owner-scopes its own query.**

---

## B. Routing seam / data model

**Per-surface resolution:**

| Surface | Chain | Keyed on |
|---|---|---|
| `analytics/[slug]` | `publishedPage.findFirst({slug,userId})` `:34-39` → `pageAnalytics.findMany({slug})` `:56` | `PublishedPage.slug` + `PageAnalytics.slug` |
| `forms/[slug]` | `publishedPage.findFirst({slug,userId})` `:25-30` → `formSubmission.findMany({userId, publishedPageId})` `:36-44` | slug → `PublishedPage.id` |
| `blog/[slug]` | `publishedPage.findFirst({slug,userId})` `:24-28` → `project.findUnique({id:projectId},select{tokenId})` `:30-34` → `blogPost.findMany({projectId})` `:36` | **already does the slug→token hop — the re-key precedent** |
| `testimonials/` | `user.findUnique({clerkId}, include projects{token:{value}})` `:22-30` | account-level, Project+Token.value |

`emails/[token]`, `outreach/[token]`, `social/[token]` are **already token-keyed** — analytics/forms/blog are the outliers.

**Data model (`prisma/schema.prisma`):**
- `Token` `:138-143`: `value String @unique`, `project Project?` (1:1).
- `Project.tokenId String @unique` `:24`, relation → `Token.value` (**not** `Token.id`).
  ⇒ **`Project.tokenId` IS the token string itself.** Unique, exists at creation, pre-publish.
  That's why `assertProjectOwner` can take a raw route param.
- `PublishedPage.slug String @unique` `:148`; `projectId String?` `:154` — **nullable, no relation**; exists only post-publish.
- ⚠️ **TWO ID SPACES**: `PublishedPage.userId` = **Clerk id** (`:147`, "external, not a foreign key");
  `Project.userId` = **internal `User.id`**. Never join them directly — known trap.
- `PageAnalytics` `:359-362`: keyed on **`slug` string only**, `@@unique([slug,date])`, no projectId.

**Mappings**: token→project = `project.findUnique({where:{tokenId}})`. token→slug = project → `publishedPage.findFirst({projectId})`.
**No helper exists** (blog hand-rolls the reverse at `:30-34`) → **add `getProjectAndPublishedPage(tokenId)`**.

**Pre-publish reality:**
- **Analytics = genuinely published-only** (PageAnalytics keys on slug; no page ⇒ no slug ⇒ no data) → spec's locked/empty state is required.
- **Forms/Leads = published-only in practice** (filters `publishedPageId`; submissions need a published page).
- **Blog** needs `PublishedPage` for blogIndex/subscriber count (`:49-51`), but `BlogPost.projectId` `:82` is token-reachable.
- **Testimonials = fully pre-publish** (Project-keyed).

**Redirects — forced conclusion:**
- No `next.config` redirects (only `headers()`); existing idiom = route-level `redirect()` from `next/navigation` in server pages.
- slug→token mapping lives **only in Postgres**. Middleware is **edge runtime, no Prisma** (KV holds slug→blob routes, not slug→token). `next.config` redirects are static/no DB.
  ⇒ **Redirects MUST be Node-runtime server pages.**
- **Strategy: keep old `dashboard/{analytics,forms,blog}/[slug]/page.tsx` as thin server-component redirect shims** doing slug→projectId→tokenId then `redirect('/dashboard/{tokenId}/...')`; `notFound()` on missing/unowned (preserves today's behavior). Blog's shim lookup already exists at `blog/[slug]/page.tsx:30-34`.
- ⚠️ Shim dirs must remain **real directories** or `[token]` swallows `/dashboard/analytics/foo`.
- ⚠️ New `[token]` dynamic segment vs literal siblings (`billing`,`settings`,`testimonials`,`analytics`,`forms`,`blog`,`emails`,`outreach`,`social`): Next resolves **static-first**, so fine today; a future token equal to one of those words would be shadowed.

---

## C. Middleware — VERDICT: NO COLLISION

- `src/middleware.ts`: `/api/*`+`/_next/*` bypass host logic (`:72`); Branch A publish subdomain (`:94`); Branch B custom domain (`:139`); app-root-only redirect (`:183`, `pathname==='/'`); apex→app 307 (`:215`); `auth.protect()` (`:251`).
- On `app.lessgo.ai`, `/dashboard/*` **hits no host branch** → falls straight to `auth.protect()` + normal Next routing.
- **Token-mistaken-for-slug risk: none** — slug/custom-domain resolution is **host-gated, not path-gated**; only `/p/*` shapes are slug-parsed.
- Apex→app 307 is **prefix-based** (`APP_PATH_PREFIXES` incl. `/dashboard`, `src/lib/domains/appSplit.ts:62`), path passed through verbatim ⇒ arbitrary nesting already forwards.
- `config.matcher` `:269-275` excludes only `_next`/static extensions — does not exclude `/dashboard`.
- **Clerk protection auto-inherits**: `isPublicRoute` `:14-50` has no `/dashboard` entry ⇒ new nested routes protected with **zero route-list edits**. (authn only — authz still per-page.)
- app-subdomain slice-2 (unmerged) does not conflict.

---

## D. Components

**No `src/app/dashboard/layout.tsx` exists** — all 9 dashboard pages render their own `<Header/>`+`<Footer/>`.
**The new shell should become that layout.**

| Component | Verdict |
|---|---|
| `dashboard/Header.tsx` | **Replace** w/ new top bar. Imported by **9 pages** (page:4, settings:5, social:5, outreach:5, emails:5, forms:4, blog×2, analytics page+loading) — dashboard-only, never `/edit`. Moving to a layout means removing 9 call sites. |
| `DashboardHeader.tsx` | **Replace** — but **preserve its `/api/start` CTA logic** (`POST /api/start` → `window.open(url)`) for sidebar `New site with AI`. Has dead state. |
| `ProjectCard.tsx` | **Replace** with grid card |
| `EmptyState.tsx` | **Replace** with 1a AI-prompt empty state |
| `Footer.tsx` (dashboard) | dead/unimported — ignore |
| `PersonaUpdatedBanner.tsx` | **Keep** (`?personaUpdated=1`) |
| `FormSubmissionsTable.tsx` | **Keep, do NOT reskin** (moves under Leads tab) |
| `dashboard/testimonials/*` (4 dialogs + `TestimonialModerationList`) | **Keep as-is** |

Nothing in `components/dashboard/*` is shared with the editor. **Do-not-touch shared**: `@/components/shared/{Logo,Footer}`.

**`dashboard/page.tsx` facts:**
- Fetch `:20-35`: `auth()` → `user.findUnique` w/ projects (id/title/content/inputText/updatedAt/token.value, `orderBy updatedAt desc`).
- **Admin god-view** `:37,56-83`: `isAdmin(userId)` → `project.findMany` **all, take:200**, includes `user.email` → `ownerEmail`; publishedPages by `projectId in [...]`. Renders `owner` badge (`ProjectCard.tsx:103`) + "Showing first 200 projects" (`:166`).
- **Smart-name logic — PRESERVE VERBATIM** `:104-139`: if title missing/`'Untitled Project'`, fall back in order from `content.onboarding.{validatedFields,confirmedFields}`: `marketCategory+targetAudience` → `"{Cat} for {Aud}"`; then `"{Cat} Tool"`; then `inputText.slice(50)+'...'`; then `oneLiner.slice(50)`; else `'New Project'`. `formatField()` title-cases on `[-_\s]`.
- **Item shape** `:141-152`: `{id,name,status:'Published'|'Draft',updatedAt,tokenId,slug,type:'unified',publishedAt,owner}`.
- **Card actions today** (`ProjectCard.tsx:116-189`): Draft → `Continue` (state-aware via `/api/loadDraft`: finalContent+stepIndex 999 → `/edit/[token]`; stepIndex≥6+features → `/generate/[token]`; else `/onboarding/product/[token]`). Always → `Social`/`Emails`/`Outreach` **behind `NEXT_PUBLIC_*_DISABLED` kill-switches** (`:28-36`). Published → `Edit`, `View Live` (`/p/{slug}`), `Analytics`, `Forms`. PostHog: `project_edit_clicked`, `project_preview_clicked`.

**ui-foundation primitives — CONFIRMED PRESENT in this worktree** (orchestrator verified; a scout wrongly reported absent because it grepped for `--app-*` CSS vars — **tokens are Tailwind config keys, not CSS variables**):
- `@/components/ui/nav-item` → `{NavItem, navItemClasses}`. Props `asChild?, active?, href?, icon?, iconFilled?, label?` + HTMLAttributes. `href` → `<a>`, else `<button>`. **NO `disabled` prop** → grey-out needs `disabled` on the button form + opacity class.
- `@/components/ui/tabs` → `{Tabs,TabsList,TabsTrigger,TabsContent}`. `TabsTrigger` supports `disabled` (`tabs.tsx:146`). **Client-side only, NO routing** → route-backed tabs need a Link-based tab bar, not `TabsContent`.
- `@/components/ui/icon` → `{AppIcon}` `{name, filled?, size?, className?}` (`icon.tsx:26`).
- `@/components/ui/segmented-control` (controlled `value`/`onValueChange`) — for the 1a Describe/Use-my-site toggle.
- `@/components/ui/toast` (`ToastProvider`+`useToast`) — NOT the edit-page-local one.
- `@/components/ui/image-placeholder` (`aspect`/`rounded`) — card thumbnails.
- `@/components/ui/dropdown-menu` — Radix; `DropdownMenuItem` supports `disabled` → `data-[disabled]:opacity-50` (`:87`). ⚠️ **NOT in foundation's reskinned set** — still stock `rounded-sm`/`accent` classes; will look pre-foundation. See ruling R11.
- **Scope class `.app-chrome`** (`src/styles/app-chrome.css`) — foundation defines it, attaches to nothing. **Attach to the dashboard shell wrapper ONLY** — never body/`/p`/`/preview`/editor canvas.
- **Tokens = Tailwind `app-*` keys** in `tailwind.config.js` `theme.extend` (verified): `colors.app.*` (`bg-app-primary`, `text-app-muted`…), `borderRadius['app-ctl' 10px|'app-input' 12px|'app-panel' 14px|'app-card' 16px|'app-modal' 20px|'app-pill' 20px|'app-badge' 6px]`, `boxShadow['app-card'|'app-modal'|'app-float'|'app-btn-primary'|'app-btn-cta']`, `fontFamily['app-sans' (Onest)|'app-mono' ('JetBrains Mono App')|'app-hand']`, `backgroundImage['app-stripes']`.
- 🚨 **NEVER add/mutate a stock Tailwind key** to serve app chrome — feeds template rendering ⇒ editor↔published divergence. 3 isolation guards must stay green: published.css sha256, config-freeze test, `e2e/ui-isolation.spec.ts`.

**`GlobalAppHeader`** = `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx:16`, imported **only** by `EditLayout.tsx:7,138`. **Edit-only** ⇒ the "do NOT extract a shared AppTopBar" ruling holds; dashboard builds its own top bar.

---

## E. Design handoff → build-ready structure

Source: `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Dashboard.dc.html` (screens 1a–1d, 2a–2f, 3a–3e).
Handoff uses **zero CSS variables** — all hardcoded hex. **They map ~1:1 onto `app-*` tokens** (orchestrator verified:
`#006CFF`=`app-primary`, `#0056d6`=`app-primary-hover`, `#003E80`=`app-primary-deep`, `#e6f0ff`=`app-tint`,
`#FF6B3D`=`app-cta`, `#191922`=`app-ink`, `#7b7b86`=`app-muted`, `#a6a6b0`=`app-faint`, `#b0b0ba`=`app-placeholder`,
`#5b5b66`=`app-body`, `#16a34a`=`app-success`, `#e6f5ec`=`app-success-bg`, `#d1483a`=`app-danger`, `#fef2f2`=`app-danger-bg`,
`#f7f8fa`=`app-canvas`, `#ececf1`=`app-border`, `#d7d7dd`=`app-border-strong`, `#f2f2f5`=`app-hairline`).
**Near-misses — use the nearest token, do NOT add keys**: sidebar bg `#fafafb` (no token → nearest `app-canvas`/arbitrary),
chrome border `#f0f0f3` (token `app-divider` = `#eef0f3`), input border `#e2e6ef` (token `app-border-input` = `#e2e4ea`).

- **Shell**: `<aside 244px>` + column (top bar 64px + scroll content). Frame `1240×840` is mock-only; real app is full-viewport. Desktop-only.
- **Sidebar markup is byte-identical across all 12 screens** — one component, `activeKey` prop.
- Fonts: **Onest** (UI, 400–800), **JetBrains Mono** (eyebrows/badges, ls .08–.12em), **Material Symbols Rounded** (`.ms`, fill via `font-variation-settings:'FILL' 1`).

**Sidebar** (`244px; bg #fafafb; border-right 1px #f0f0f3; padding 18px 14px; flex column`):
1. Logo `height:24px`, wrapper `padding:4px 8px 20px`.
2. CTA **"New site with AI"**, icon `auto_awesome` (FILL 1, 20px, white); `bg #FF6B3D; radius 11px; padding 12px; 700 13.5px Onest; shadow 0 10px 22px -8px rgba(255,107,61,.7); mb 22px`; hover `brightness(1.04)`.
3. Heading **"WORKSPACE"** — `700 10px JetBrains Mono; ls .12em; #b0b0ba; padding 0 8px 8px`.
4. Items (`gap:3px`; each `padding 9px 11px; radius 9px; gap 11px`): **"Projects"** `grid_view` · **"All Analytics"** `monitoring` · **"All Leads"** `move_to_inbox` + **right count pill** (`ml:auto; 600 10px JetBrains Mono; bg #FF6B3D; #fff; padding 1px 7px; radius 20`).
   - Active: `600 13px; bg #e6f0ff; color #003E80`, icon `#006CFF` FILL 1. Idle: `500 13px; #5b5b66`, icon `#8a8a94` FILL 0; hover bg `#f1f2f6`.
5. Heading **"ACCOUNT"** (`padding 20px 8px 8px`) → **"Billing & plan"** `credit_card` · **"Domains"** `language`.
6. Bottom (`margin-top:auto; gap 12px`):
   - **Plan widget** (`bg #fff; border 1px #ececf1; radius 12; padding 12px 13px`): row icon `workspace_premium` (15px `#FF6B3D`) + **"Starter plan"** (`700 11px`); progress track `h6; radius 20; bg #eef0f4`, fill `64%; bg #006CFF`; caption **"3 of 5 sites used · Upgrade"** (`400 10.5px #a6a6b0`; "Upgrade" `#006CFF 600`). **Copy pattern = `{N} of {M} sites used · Upgrade`** (2 lines; spec's one-liner is a paraphrase — use design strings).
   - **Profile row** (`padding 4px 8px; gap 10px`): 30px round avatar · "Sushant K." (`600 12px`) + email (`400 10px #a6a6b0`, ellipsis) · trailing **gear `settings`** (18px `#a6a6b0`).

**Top bar** (`h64; padding 0 26px; border-bottom 1px #f0f0f3; bg #fff; gap 14; items center`):
- **Title block** 2-line: eyebrow (`400 11.5px #a6a6b0`) over title (`800 18px; ls -.4px`) — root = "Workspace"/"Projects"; 2a "Overview · last 30 days"/"Analytics"; 2b "Lead management"/"Leads".
- spacer `flex:1` · optional control (2a `"Last 30 days"+expand_more` pill; 1c green `"All systems live"` chip) · **Bell** `notifications` (22px `#8a8a94`).
- ⚠️ **No logo, no avatar in top bar** — both sidebar-resident. 1a's top bar is bare (spacer+bell only).
- **Project-workspace variant (3a/3b)**: 64px bar **replaced** by taller `padding 16px 26px 0` white header (breadcrumb+actions) then tab bar. **Bell absent** on project screens.

**Projects grid (1d canonical)**:
- Filter row (`mb 20`): pills **"All 3"** (active `#003E80` on `#e6f0ff`, radius 20), **"Published"**, **"Drafts"** (idle `1px solid #e6e6ec`) · spacer · **"Recent"+expand_more** sort · blue `add`+**"New site"**.
- Grid `repeat(3,1fr); gap 18px`.
- **Card** (`border 1px #ececf1; radius 14; bg #fff; shadow 0 2px 10px -6px rgba(20,20,40,.2); overflow hidden`):
  - **Thumbnail** `h120` (1d)/`130` (1b), stripes `repeating-linear-gradient(135deg,#eef0f4 0 11px,#e6e8ee 11px 22px)` (= `bg-app-stripes`).
    - top-left **status badge**: green dot + "Published" (`600 9.5px; #16a34a; bg #fff; radius 20`).
    - top-right **`more_horiz`** icon button (20px `#6b6b76` on `#fff`; radius 7; padding 3). Open state: `bg #e6f0ff; color #006CFF` + card border `#cfe0ff`.
  - **Body** (`padding 13px 15px`): name (`700 14px`) then **"{domain} · {typeLabel}"** (`400 10.5px #a6a6b0`) e.g. `"peakfit.co · Local service"`, `"lessgo.ai/p/naayom · SaaS waitlist"`.
  - **Metrics strip** (`border-top 1px #f2f2f5; padding 10px 0; gap 16`): 3 stats, value (`700 14px`) over label (`400 9px #a6a6b0`): `views`, `leads`, `conv.` (conv value green; empty = em-dash `#c0c0c8`).
  - **Footer** (`gap 7`): full-width primary **"Open"** (1d) / "Edit" (1b) — `#006CFF; radius 8; padding 7` — + 34px square outline `ios_share` button.
  - **No date field** on grid cards.
  - **Ghost "Create a new site" card** (1b last cell): `1.5px dashed #cdd4e2; min-height 266`, 52px round `#fff0eb` circle w/ `auto_awesome` `#FF6B3D`, title "Create a new site", sub "Describe it — AI drafts in seconds".
- **`•••` popover** (`w186; top34; right8; border 1px #e6e6ec; radius 11; shadow 0 20px 44px -14px rgba(20,20,40,.34); padding 6`; items `padding 8px 10px; radius 7; 500 12.5px; #2a2a34; hover #f4f5f8`) — **exact order**: "Open editor" `open_in_new` · "Visit site" `visibility` · "Rename" `drive_file_rename_outline` · "Duplicate" `content_copy` · "Domain settings" `language` · *divider* · "Archive" `archive` · "Delete" `delete` (`#d1483a`, hover `#fef2f2`).

**Empty state (1a)**: content bg `radial-gradient(120% 90% at 50% -10%,#eef4ff 0%,#fcfcfd 55%)`; centered col `padding 56px 40px`.
1. Chip `rocket_launch` + "Welcome to Lessgo AI" (`600 11px; #003E80; bg #e6f0ff; radius 20; padding 5px 12px`).
2. H1 **"Let's build your first site, {firstName}"** (`800 34px/1.12; ls -1px; max-w 620`).
3. Sub **"Describe what you're launching — or paste your current website — and Lessgo AI builds a high-converting site with copy, layout, and a lead form in seconds."** (`400 14.5px/1.5 #7b7b86; max-w 520`).
4. **Prompt card** (`max-w 680; bg #fff; border 1px #e2e6ef; radius 16; shadow 0 24px 50px -24px rgba(20,20,40,.3); padding 16px 16px 13px`):
   - **Segmented toggle** (`bg #f2f3f7; radius 10; padding 3`): active "Describe your site" (`edit_note` `#006CFF`; white pill + `0 1px 3px`) | idle "Use my current site" (`link` `#9a9aa4`).
   - **Textarea placeholder**: "A landing site for my Pilates studio with a class schedule, pricing, and a booking form…" (`400 15px/1.5; #b0b0ba; min-h 58`).
   - Footer: hint "Already have a site? Switch to **Use my current site** and paste its URL." (`400 11.5px #a6a6b0`; bold part `#006CFF 600`) · spacer · button **"Build my site"**+`arrow_forward` (`#FF6B3D; 700 13px; radius 10; padding 10px 18px`).

**Project workspace (3a)**:
- **Header** (`bg #fff; padding 16px 26px 0; border-bottom 1px #f0f0f3`), one row `gap 11; mb 14`: `arrow_back` (18px `#9a9aa4`) + **"All Projects"** (`600 12px #7b7b86`, hover `#006CFF`) · sep "/" (`400 13px #c8c8d0`) · 30px rounded-8 thumbnail · project name (`800 18px; ls -.4px`) · status chip green dot+"Live" (`600 9.5px; #16a34a on #e6f5ec; radius 20`) · domain (`400 12px #a6a6b0`) · `ml:auto` outline **"Visit"** (`open_in_new`) + primary **"Open editor"** (`edit`).
- **Tab bar** (`flex; gap 2; padding 0 26px; bg #fff; border-bottom 1px #f0f0f3`; tab `padding 14px 15px 13px`): design order = **Overview · Blog · Leads · Testimonials · Analytics · Grow**. Active `700 13px #191922` + underline (`absolute; left12 right12 bottom-1; h2.5; bg #006CFF; radius 3`); idle `500 13px #7b7b86`.
- **Overview body (3a) is KPI-heavy** (4 KPI cards; "QUICK ACTIONS" eyebrow + 4 cards; "Recent leads" panel + 340px "Pages on this site" panel) — **contradicts spec's "KPIs deferred"**. See ruling R3.

---

## F. ORCHESTRATOR RULINGS (spec × design conflicts — resolved; plan-reviewer may challenge)

The design scout flagged 11 contradictions. Rulings, in force for this build:

- **R1 — Top bar has NO logo/avatar; sidebar owns both.** Design wins on placement (spec line 52 is
  superseded). Top bar = 2-line title block + spacer + **greyed bell**. Breadcrumb lives in the
  project-workspace header (3a), not the root top bar. Spec intent (all elements present) is satisfied.
- **R2 — Tab order = design: Overview · Blog · Leads · Testimonials · Analytics · Grow.**
  **`Grow` renders as a greyed/disabled tab** — it is designed chrome, and the completeness principle
  ("controls whose route doesn't exist render greyed in place") governs. This does NOT build the Grow hub
  (still Scope OUT); it is a disabled tab stub only.
- **R3 — Overview interior: KPIs OUT.** Spec explicitly defers them and the completeness principle is
  scoped to "the main dashboard screen and the workspace chrome" — the Overview *body* is neither.
  Build: workspace header + tab bar (final design) + the **"QUICK ACTIONS" 4-card row**, each card
  **greyed** where its route/track is absent or kill-switched (social posts / email sequences / testimonial
  requests are held/kill-switched tracks — check `NEXT_PUBLIC_*_DISABLED` before enabling any).
  **OUT**: 4 KPI cards, "Recent leads" panel, "Pages on this site" panel.
- **R4 — `•••` menu ships all 7 design items** in design order. **Active**: "Open editor", "Visit site".
  **Greyed**: Rename, Duplicate, Domain settings, Archive, Delete. (Per-card "Domain settings" deep-link
  doesn't exist — grey it even though the sidebar Domains page does. Archive has no backend — S2.)
- **R5 — Card primary button = "Open"** (1d is the canonical Projects page; 1b's "Edit" is the older mock).
- **R6 — Plan widget uses the design's two-line copy**: "Starter plan" + "{N} of {M} sites used · Upgrade".
  Wire N/M to real plan data if trivially available; otherwise **greyed with real-shaped placeholder** —
  do NOT invent fake numbers. "Upgrade" greyed if its route isn't built (S3).
- **R7 — Sidebar profile gear (`settings`) is IN** → links to the existing settings page (enabled).
- **R8 — Admin god-view is NOT in the design but MUST be preserved.** Keep the owner-email affordance on
  the card (small `text-app-faint` line in the card body) + the "Showing first 200 projects" notice.
  Deviating from the mock here is correct — the design simply never covered admin.
- **R9 — Draft-card state is undesigned.** Derive: published card minus metrics values (em-dash per the
  design's empty convention), **amber "Draft" chip** (design's draft-amber `#9a6a1e`/`#fdf2dc`, from 1c),
  primary button **"Continue"** preserving today's **state-aware `/api/loadDraft` routing verbatim**
  (`ProjectCard.tsx:116-189`) — that logic is load-bearing, do not simplify it.
- **R10 — Locked/empty analytics state (pre-publish) is undesigned.** Build a minimal foundation-token
  empty state (icon + one line + "Publish to see analytics"); do NOT invent a new visual language.
- **R11 — `dropdown-menu` is not foundation-reskinned.** **Do NOT edit the shared primitive**
  (foundation is frozen; other surfaces consume it). Style the `•••` popover to the design **at the call
  site** via `className` on `DropdownMenuContent`/`Item`, or use a local menu component under
  `components/dashboard/`. Never mutate a stock Tailwind key to achieve it.
- **R12 — `nav-item` has no `disabled` prop.** Grey out at the call site: render the **button form**
  (omit `href`) + `disabled` + `aria-disabled` + opacity/`cursor-not-allowed` classes. **Do NOT modify
  the frozen `nav-item` primitive.**
- **R13 — Route-backed tabs must NOT use `TabsContent`.** Foundation `tabs` is client-side/no routing;
  the workspace tabs are real routes ⇒ build a **Link-based tab bar** (may reuse `TabsList`/`TabsTrigger`
  visuals via `asChild`-style composition, or hand-roll to the design's underline spec).
- **R14 — Counts/metrics must be real or absent.** Sidebar "All Leads" count pill and card
  views/leads/conv. come from real data or render the design's **em-dash empty state**. Since All Leads is
  greyed (S4), **omit its count pill** rather than fake "7".

---

## G. Non-negotiables carried from the mailbox brief

- **Merge to main-LOCAL only when green. DO NOT PUSH** — founder fires one big-bang push after
  auth + dashboard + editor-shell all land.
- **Do NOT extract a shared `AppTopBar`.** Foundation is frozen; `GlobalAppHeader` is edit-only (verified).
  Dashboard builds its own top bar, matched by tokens/eye.
- **Foundation is frozen** — consume `src/components/ui/*`, don't edit it. If something's missing, solve it
  at the dashboard call site.
- Green gates before merge: `tsc`, `test:run`, **`lint`** (pre-push hook — skipping it blocked a push on
  2026-07-14), `npm run build`.
