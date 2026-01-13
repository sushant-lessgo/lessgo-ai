# Static HTML Export to Vercel Blob - Implementation Plan

## Goal
Transform published landing pages from database-driven SSR (200-500ms TTFB) to static HTML/CSS on Vercel Blob (<50ms TTFB, zero DB queries per pageview).

## Architecture Overview

**Current Flow:**
```
Publish → Save JSON to DB → User visits → Query DB → SSR with React → Serve
```

**Target Flow:**
```
Publish → Generate HTML/CSS → Upload to Blob → Update KV routing → User visits → Edge serves static file
```

**Key Decisions (from SecondOpinion.md):**
- **Forms**: Vanilla JS handler (~5KB), POST to /api/forms/submit
- **Analytics**: Native beacon with navigator.sendBeacon(), opt-in at publish
- **Routing**: Vercel KV routing table, edge middleware proxy to Blob (no redirects)
- **Versioning**: Versioned blob keys with atomic pointer swaps
- **Caching**: Immutable (Cache-Control: public, s-maxage=31536000)

---

## Phase 1: HTML/CSS Static Generation Engine

### 1.1 CSS Compilation

**Create:** `scripts/buildPublishedCSS.js` (build-time) or `src/lib/staticExport/cssCompiler.ts` (publish-time)

**Approach:** Standard Tailwind compilation with published component paths
- Point Tailwind `content` to published components:
  ```js
  content: [
    "src/modules/UIBlocks/**/*.published.tsx",
    "src/components/published/**/*.tsx"
  ]
  ```
- Run `npx tailwindcss` to compile `public/published.css`
- Include theme CSS variables via custom CSS
- Target size: ~30-50KB gzipped
- **Shared across all pages** (not per-page)

**Build-time vs Publish-time:**
- **Build-time** (recommended): Compile once during `npm run build`, serve as static asset
- **Publish-time**: Compile during publish if theme customization needed (defer to Phase 4+)

**DO NOT:** Build custom TSX parser to extract classes (brittle, unnecessary)

### 1.2 HTML Generation

**Create:** `src/lib/staticExport/htmlGenerator.ts`

**Implementation:**
```typescript
export async function generateStaticHTML(options: {
  sections: string[];
  content: Record<string, any>;
  theme: any;
  publishedPageId: string;
  pageOwnerId: string;
  slug: string;
  title: string;
  description?: string;
  previewImage?: string;
  compiledCSS: string;
  analyticsOptIn: boolean;
}): Promise<string>
```

**Steps:**
1. Use `ReactDOMServer.renderToString()` with `LandingPagePublishedRenderer`
2. Generate complete HTML document with:
   - Meta tags (OG, Twitter Card)
   - Google Fonts CDN links (extract from theme)
   - **`<link>` to shared `published.css`** (NOT inline - enables caching)
   - **`<script src="form.js">`** - shared vanilla JS form handler
   - **`<script src="a.js">`** - optional shared analytics (if enabled)
   - Smooth scroll script (inline, tiny ~200 bytes)

### 1.3 Font Handling

**Strategy:** Google Fonts CDN with `display=swap`
```html
<link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
```

**Future optimization:** Self-host fonts in Blob (defer to Phase 5+)

### 1.4 Asset URL Resolution

**Create:** `src/lib/staticExport/assetResolver.ts`

- Validate all image URLs are absolute (Blob URLs)
- Replace relative paths with baseURL if needed
- Ensure consistent HTTPS protocol

---

** Phase 1 is complete. I have tested it and test is successful. 

[Phase 1] Static HTML generated: { size: '2.83 KB', fonts: [ 'Inter' ], cssVariables: 19 }
 POST /api/publish 200 in 7116ms

## Phase 2: Vercel Blob Upload & Versioning

### 2.1 Blob Key Structure

**Per-page versioned HTML:**
```
pages/{pageId}/{version}/index.html
```

**Shared assets (versioned by bundle, not page):**
```
assets/published.v1.css
assets/form.v1.js
assets/a.v1.js
```

**Version ID:** Timestamp-based (sortable, unique)
```typescript
function generateVersionId(): string {
  return new Date().toISOString().replace(/[:.]/g, '').replace('Z', '');
  // Example: 20260107T123045
}
```

**Why pageId not slug:** Slugs can change, multiple domains can point to same page. Page ID is source of truth.

### 2.2 Blob Uploader

**Create:** `src/lib/staticExport/blobUploader.ts`

```typescript
export async function uploadStaticSite(options: {
  pageId: string;
  html: string;
  assetBundleVersion: string; // e.g., "v1" for CSS/JS references
}): Promise<{
  version: string;
  blobKey: string;
  url: string;
}>
```

**Implementation:**
- Use `@vercel/blob` (already installed v2.0.0)
- Upload to `pages/{pageId}/{version}/index.html`
- HTML references shared assets: `/assets/published.{assetBundleVersion}.css`
- Set `cacheControlMaxAge: 31536000` (1 year immutable)
- Set `access: 'public'`
- Return blob key and CDN URL

**Shared assets upload** (separate function, run during build or first publish):
```typescript
export async function uploadSharedAssets(css: string, formJs: string, analyticsJs: string, version: string)
```

### 2.3 Version Cleanup

**Create:** `src/lib/staticExport/versionCleanup.ts`

- Keep last 5 versions per site
- Async cleanup (don't block publish)
- List blobs with prefix, sort by version, delete old ones

### 2.4 Database Schema Updates

**Update:** `prisma/schema.prisma`

```prisma
model PublishedPage {
  // ... existing fields ...

  // New static export fields
  publishState     String   @default("draft") // draft, publishing, published, failed
  currentVersion   String?  // Live version ID
  blobPrefix       String?  // sites/{userId}/{slug}
  lastPublishAt    DateTime?
  publishError     String?
  versionHistory   Json?    // [{ version, blobKey, publishedAt, size }]
  analyticsEnabled Boolean  @default(false)
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_static_export_fields
```

Phase 2 is complete. Test successful.

[Phase 2] Blob uploaded: {
  version: '2026-01-07T174451913-OrurSp',
  blobKey: 'pages/cmk49cwz10003ltfc4ub5fvum/2026-01-07T174451913-OrurSp/index.html',
  size: '2.83 KB',
  duration: '1708ms'
}
 POST /api/publish 200 in 7935ms

---

## Phase 3: Routing Layer with Vercel KV

### 3.1 Vercel KV Setup

**Install:**
```bash
npm install @vercel/kv
```

**Env vars:** (auto-populated by Vercel dashboard)
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 3.2 KV Routing Table

**Create:** `src/lib/routing/kvRoutes.ts`

**Schema (keyed by pageId, not slug):**
```
route:{host}:{path} → { pageId, blobKey, version }
site:{pageId}:current → version ID
site:{pageId}:versions → [v1, v2, v3, ...]
```

**Why pageId not slug:**
- Slugs can change or be reused
- Custom domains need stable mapping
- PageId from PublishedPage table is source of truth

**Functions:**
```typescript
export async function setRoute(domain: string, path: string, config: { pageId: string, blobKey: string, version: string }): Promise<void>
export async function getRoute(domain: string, path: string): Promise<RouteConfig | null>
export async function atomicPublish(pageId: string, domains: string[], version: string, blobKey: string): Promise<void>
export async function rollbackVersion(pageId: string, targetVersion: string): Promise<void>
```

### 3.3 Edge Middleware Proxy

**Update:** `src/middleware.ts`

**Changes:**
1. Add KV lookup for subdomain routing
2. If route found, rewrite to `/__blob_proxy?key={blobKey}`
3. Skip API routes (existing check already in place)
4. Fallback to existing `/p/[slug]` rewrite for legacy pages

**Code pattern:**
```typescript
// After extracting subdomain (line 38)
const route = await kv.get<RouteConfig>(`route:${host}:/`);
if (route) {
  url.pathname = '/__blob_proxy';
  url.searchParams.set('key', route.blobKey);
  // DO NOT pass cache control via query (security issue)
  return NextResponse.rewrite(url);
}
// Fallback to existing logic
```

### 3.4 Blob Proxy Route

**Create:** `src/app/__blob_proxy/route.ts` (NOT under /api/)

```typescript
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const blobKey = searchParams.get('key');

  if (!blobKey) {
    return new NextResponse('Missing blob key', { status: 400 });
  }

  try {
    const blob = await get(blobKey);
    if (!blob) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Fetch blob content
    const response = await fetch(blob.url);

    // DO NOT accept cache control from query string (security/abuse)
    // Use server-side config based on content type
    const cacheControl = blob.pathname.endsWith('.html')
      ? 'public, s-maxage=31536000, immutable' // Versioned HTML
      : 'public, s-maxage=31536000, immutable'; // Assets

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': blob.contentType || 'text/html',
        'Cache-Control': cacheControl,
        'ETag': blob.pathname, // Use pathname as ETag
        'X-Served-From': 'blob-proxy',
        // Optional: Content-Security-Policy
      },
    });
  } catch (error) {
    console.error('Blob proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
```

**Path alignment:** Middleware rewrites to `/__blob_proxy` → route at `src/app/__blob_proxy/route.ts`

---

## Phase 4: Forms & Analytics

### 4.1 Vanilla JS Form Handler

**Create:** `src/lib/staticExport/formHandler.ts` (generates `public/assets/form.v1.js`)

**Shared external script** (NOT inline, for caching):
```typescript
export function generateFormHandlerScript(): string
```

**Features:**
- Find forms with `data-lessgo-form` attribute
- Read `data-page-id` and `data-owner-id` from form attributes
- Collect FormData on submit
- POST to `/api/forms/submit` with `keepalive: true`
- Show success state (replace form with checkmark message)
- Show error state (append error div, remove after 5s)
- Fire analytics event on success (if `window._lessgoTrack` exists)

**Bundle size:** ~3KB gzipped, **shared across all published pages**

**HTML usage:**
```html
<script src="/assets/form.v1.js" defer></script>
```

### 4.2 Create Published Form Component

**Create:** `src/components/published/FormMarkupPublished.tsx` (NEW FILE, don't modify FormIsland)

**Implementation:**
- Server component (no 'use client')
- Renders vanilla HTML form with:
  - `data-lessgo-form={formId}`
  - `data-page-id={publishedPageId}`
  - `data-owner-id={pageOwnerId}`
- Same styling as FormIsland
- No React state or event handlers

**Keep:** `src/components/published/FormIsland.tsx` unchanged (still used in legacy SSR `/p/[slug]` flow)

**Why separate:** Don't mutate existing components. Clear separation between client island and static markup.

### 4.3 Analytics Beacon

**Create:** `src/lib/staticExport/analyticsGenerator.ts` (generates `public/assets/a.v1.js`)

**Shared external script** (NOT inline, for caching):
```typescript
export function generateAnalyticsScript(): string
```

**Features:**
- Read config from `<script>` tag data attributes: `data-page-id`, `data-slug`
- Use `navigator.sendBeacon()` or `fetch(..., { keepalive: true })` fallback
- Track pageview with UTM params (on load)
- Track CTA clicks (elements with `data-lessgo-cta` attribute)
- Expose `window._lessgoTrack(event, data)` for forms
- POST to `/api/analytics/event`

**Bundle size:** ~2KB, **shared across all published pages**

**HTML usage:**
```html
<script src="/assets/a.v1.js" data-page-id="..." data-slug="..." defer></script>
```

### 4.4 Analytics API Endpoint

**Create:** `src/app/api/analytics/event/route.ts`

**Schema:**
```typescript
interface AnalyticsEvent {
  event: 'pageview' | 'cta_click' | 'form_submit';
  pageId: string;
  slug: string;
  timestamp: string;
  url: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}
```

**Implementation:**
- **Node.js runtime** (NOT edge - Prisma + Postgres can be unreliable on edge)
- OR: Store raw events in KV/queue, aggregate later (more reliable)
- For Phase 1: Simple fire-and-forget approach (log to KV, aggregate async)
- Upsert daily aggregate in `PageAnalytics` table (background job)

**Why not edge + Prisma:** Edge + Prisma + Postgres can timeout. Don't let analytics block beacon reliability.

**Database:**
```prisma
model PageAnalytics {
  id              String   @id @default(cuid())
  slug            String
  date            DateTime
  views           Int      @default(0)
  ctaClicks       Int      @default(0)
  formSubmissions Int      @default(0)

  @@unique([slug, date], name: "slug_date")
  @@index([slug])
}
```

### 4.5 Publish UI Enhancement

**Update:** Publish modal/flow to include:
- Checkbox: "Enable analytics tracking"
- Tooltip: "Track pageviews, CTA clicks, and form submissions"

---

## Phase 5: Republish & Rollback

### 5.1 Enhanced Publish API

**Update:** `src/app/api/publish/route.ts`

**New flow:**
1. Set `publishState: 'publishing'` in DB
2. Generate static HTML with `generateStaticHTML()`
3. Upload to Blob with `uploadStaticSite()`
4. Atomic publish to KV with `atomicPublish()`
5. Update DB: set `publishState: 'published'`, save version, update history
6. Async cleanup old versions (catch errors, don't block)
7. On error: set `publishState: 'failed'`, save error message

**Backward compatibility:** Keep existing fields (htmlContent, content, themeValues) for legacy support

### 5.2 Rollback API

**Create:** `src/app/api/publish/rollback/route.ts`

**Flow:**
1. Verify ownership (userId matches page.userId)
2. Verify target version exists in versionHistory
3. Call `rollbackVersion(slug, targetVersion)` (KV atomic swap)
4. Update DB: `currentVersion`, `lastPublishAt`

### 5.3 Version History UI

**Create:** `src/components/dashboard/VersionHistory.tsx`

**Display:**
- Last 5 versions from `versionHistory` JSON
- Show: version timestamp, "Current" badge, rollback button
- Confirm before rollback: "Are you sure? This will make version X live."

**Integration:** Add to project settings or publish modal

---

## Phase 5 Implementation Status (Updated: 2026-01-13)

### ✅ IMPLEMENTED (6/7 Items)

1. **Enhanced Publish API** - `src/app/api/publish/route.ts`
   - Publishing state management (draft → publishing → published → failed)
   - Static HTML generation via Phase 1 generator
   - Blob upload with version tracking
   - Atomic KV routing with retry & verification
   - Error handling with DB rollback
   - Version history persistence in `PublishedPageVersion` table
   - Async version cleanup (keeps last 10)

2. **Database Schema Updates** - `prisma/schema.prisma`
   - `PublishedPage` additions: `publishState`, `currentVersionId`, `lastPublishAt`, `publishError`, `analyticsEnabled`
   - New `PublishedPageVersion` model for version history
   - Foreign key relations with cascading deletes

3. **KV Routing with Retry & Verification** - `src/lib/routing/kvRoutes.ts`
   - `atomicPublish()` - atomic KV updates for all domains
   - `atomicPublishWithRetry()` - 3-attempt retry with exponential backoff
   - KV verification after each write
   - Edge-compatible REST API functions

4. **Blob Proxy Route** - `src/app/api/blob-proxy/route.ts`
   - Edge runtime optimized
   - Route key validation (not user-supplied blob keys)
   - KV lookup via route key
   - Direct blob fetch from CDN URL
   - Conservative cache headers
   - Security headers (X-Content-Type-Options, CORS)

5. **Middleware Integration** - `src/middleware.ts`
   - Subdomain extraction for published pages
   - KV routing lookup (edge-optimized)
   - Rewrite to `blob-proxy` with route key
   - Fallback to legacy SSR if KV fails

6. **Version Cleanup Implementation** - `src/lib/staticExport/versionCleanup.ts`
   - Keeps last 10 versions (configurable)
   - Async cleanup (fire-and-forget)
   - Deletes both blob files and DB records
   - Graceful error handling

### ❌ DEFERRED (1/7 Items) - Implement Later

7. **Rollback API & Version History UI** - **SKIPPED FOR NOW**
   - **Missing:** `src/app/api/publish/rollback/route.ts` (~100 lines)
     - Should verify ownership
     - Call `rollbackVersion()` to swap KV entries
     - Update DB `currentVersionId` and `lastPublishAt`

   - **Missing:** `src/components/dashboard/VersionHistory.tsx` (~150 lines)
     - Display last 5 versions from DB
     - Show version timestamps, "Current" badges
     - Rollback button with confirmation modal
     - Integration point: project settings or publish modal

   **Rationale:** System is production-ready for static export + republish (Phases 1-4). Rollback UI is nice-to-have, not critical path.

   **Future Questions to Resolve:**
   - Where to integrate version history UI (dashboard, modal, separate page)?
   - Rollback ownership verification requirements?
   - Multi-domain rollback handling (atomic swap all domains)?

---

## Migration Strategy

### Backward Compatibility

**Keep:** `/p/[slug]/page.tsx` with fallback logic

```typescript
// Priority 1: Static export (if blobPrefix exists)
if (page.blobPrefix && page.currentVersion) {
  // Middleware should have redirected, this is a fallback
  return <div>Loading... (retrying)</div>;
}

// Priority 2: SSR with published components (current)
if (page.content) {
  return <LandingPagePublishedRenderer ... />;
}

// Priority 3: Legacy static HTML string
if (page.htmlContent) {
  return <div dangerouslySetInnerHTML={{ __html: page.htmlContent }} />;
}
```

### Migration Prompt

**When:** User visits editor for existing published page
**Message:** "Republish to enable static hosting for faster load times"
**Action:** No forced migration, opt-in via republish

---

## Critical Files to Modify/Create

### New Files (10 total)
1. `src/lib/staticExport/htmlGenerator.ts` - HTML generation orchestration
2. `src/lib/staticExport/cssCompiler.ts` - Tailwind CSS compilation (or build script)
3. `src/lib/staticExport/blobUploader.ts` - Vercel Blob upload logic
4. `src/lib/staticExport/versionCleanup.ts` - Old version deletion
5. `src/lib/staticExport/assetResolver.ts` - URL validation
6. `src/lib/staticExport/formHandler.ts` - Generates form.v1.js
7. `src/lib/staticExport/analyticsGenerator.ts` - Generates a.v1.js
8. `src/lib/routing/kvRoutes.ts` - KV routing table management
9. `src/app/__blob_proxy/route.ts` - Edge proxy for Blob (NOT under /api/)
10. `src/components/published/FormMarkupPublished.tsx` - Server-safe form component

### Modified Files (6 total)
1. `src/app/api/publish/route.ts` - Add static generation flow
2. `src/middleware.ts` - Add KV lookup and proxy rewrite
3. `prisma/schema.prisma` - Add static export fields
4. `src/app/p/[slug]/page.tsx` - Add fallback priority logic
5. `tailwind.config.js` - Ensure safelist covers published components (validate)
6. `package.json` - Add `@vercel/kv` dependency

**NOT MODIFIED:** `src/components/published/FormIsland.tsx` (keep for legacy SSR, create separate FormMarkupPublished.tsx)

### New API Endpoints (2 total)
1. `src/app/api/analytics/event/route.ts` - Track analytics events
2. `src/app/api/publish/rollback/route.ts` - Rollback to previous version

### New Components (1 total)
1. `src/components/dashboard/VersionHistory.tsx` - Version management UI

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| TTFB | 200-500ms | <50ms |
| Bundle Size | 87.7KB | <10KB |
| DB Queries/Pageview | 1 (ISR cached) | 0 |
| Edge Cache Hit Rate | N/A | >95% |

---

## Risks & Mitigations

**Risk 1: CSS Class Purging**
- **Mitigation:** Conservative safelist, precompiled CSS bundle
- **Rollback:** Inline all styles if purging fails

**Risk 2: KV Latency**
- **Mitigation:** Edge runtime, cache KV results in middleware
- **Fallback:** Legacy `/p/[slug]` route

**Risk 3: Form Handler Failures**
- **Mitigation:** Extensive browser testing (Chrome, Safari, Firefox, mobile)
- **Monitoring:** `/api/forms/submit` error rates

**Risk 4: Version Cleanup Bugs**
- **Mitigation:** Async cleanup, catch errors, don't block publish
- **Manual cleanup:** Admin tool to delete old blobs if needed

---

## Minimal Viable Implementation Order

Ship in small increments, test each step:

### Step 1: Blob Upload + Versioning (HTML only)
- Generate static HTML from React components
- Upload to Blob: `pages/{pageId}/{version}/index.html`
- Save version in DB
- **Test:** Verify Blob URL serves HTML correctly

### Step 2: Routing Table + Middleware + Proxy
- Setup Vercel KV
- Create routing table keyed by pageId
- Update middleware for KV lookup → rewrite to `/__blob_proxy`
- Create proxy route at `src/app/__blob_proxy/route.ts`
- **Test:** Visit subdomain, verify static HTML served via proxy

### Step 3: Shared CSS
- Compile `published.css` at build-time
- Upload to Blob: `assets/published.v1.css`
- Reference from HTML: `<link rel="stylesheet" href="/assets/published.v1.css">`
- **Test:** Verify styling works, CSS cached across pages

### Step 4: Vanilla Form Handler
- Generate `form.v1.js`
- Create `FormMarkupPublished.tsx` component
- Upload form.js to Blob
- Reference from HTML: `<script src="/assets/form.v1.js">`
- **Test:** Submit form, verify `/api/forms/submit` receives data

### Step 5: Optional Analytics Beacon
- Generate `a.v1.js`
- Create `/api/analytics/event` (KV-based, fire-and-forget)
- Upload analytics.js to Blob
- Reference from HTML if opted-in
- **Test:** Verify beacon fires, events logged

### Step 6: Cleanup + Rollback
- Version cleanup (keep last 5)
- Rollback API
- Version history UI
- **Test:** Rollback to previous version, verify atomic swap

---

## Key Decisions Made (from SecondOpinion.md)

1. **CSS Strategy:** Build-time compilation, shared `published.css` linked via `<link>` ✅
2. **Form Handler:** External `form.v1.js` (not inline) for caching ✅
3. **Analytics:** External `a.v1.js` (not inline) for caching ✅
4. **Proxy Route:** `src/app/__blob_proxy/route.ts` (NOT under /api/) ✅
5. **KV Schema:** Keyed by pageId, not slug ✅
6. **Asset Versioning:** Shared assets versioned separately from pages ✅
7. **FormIsland:** Create separate FormMarkupPublished.tsx (don't mutate existing) ✅
8. **Analytics Endpoint:** Node.js runtime or KV-based (not edge + Prisma) ✅
9. **Cache Control:** Server-side config only (not from query string) ✅

---

## Next Steps After Plan Approval

1. Create `src/lib/staticExport/` directory
2. Implement HTML generator with ReactDOMServer
3. Test rendering on existing published components
4. Database migration for new fields
5. Blob upload integration
6. KV setup and routing table


----------

 Phase 4.5 (Future) - Deferred Items

 - Blob-hosted shared assets for edge CDN serving
 - KV queue for raw analytics events (batch processing)
 - Advanced rate limiting strategies
 - Bot/spam detection and filtering