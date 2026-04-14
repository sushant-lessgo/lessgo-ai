# Custom Domains — PRD (v3, post-PO review round 2)

## 1. Goal
Let users serve published landing pages on their own domain (`mysite.com`, `www.mysite.com`) instead of only `{slug}.lessgo.ai`.

## 2. Context
- Current: publish flow writes to KV `route:{slug}.lessgo.ai:/`, middleware resolves subdomain → blob.
- Custom domain reuses same blob + KV pattern, just different host key.
- Schema already has placeholder fields (`UserPlan.customDomains`, `customDomainsLimit`).

## 3. Non-Goals (v1)
- Wildcard custom domains (`*.mysite.com`)
- Email on custom domain
- Custom domain analytics dashboards (reuse existing)
- Domain purchase/registrar integration
- **One custom domain per `PublishedPage`.** www+apex pairing → v2
- **Root path only (`/`) on custom domain.** Multi-path → v2

## 4. Decisions (locked)
| # | Decision |
|---|----------|
| Hosting | Vercel Domains API (Option 1) |
| Plan | Stay Hobby. Upgrade Pro on first paid customer OR 10 custom domains |
| Apex + CNAME | Both supported (user picks one per page) |
| Pricing | Free during beta. No plan gate yet |
| SSL flow | Async. Subdomain live immediately. Custom domain status polled |
| Subdomain after attach | Stays live. 301 → custom domain (canonical) |
| **Ownership verification** | **TXT challenge required before Vercel attach** |
| Health-check cron | **Deferred** — republish/verify-only for v1 |
| Non-root paths on custom domain | **Root only v1** (multi-path deferred to v2) |
| Failed-domain cleanup | **Manual sweep for v1**, cron in v2 (documented limitation) |
| Stale `live` regression detection | **Lazy on `/api/domains/status` GET**, 60s cache. No cron |
| TXT host format | **Always apex form**: `_lessgo-verify.{registrable-domain}` |
| `customDomainsLimit` default | **Schema default = 1** (changed from 0) in same migration |

## 5. User Flow
1. User in publish modal → "Custom Domain" tab
2. Enters `mysite.com`, picks apex or subdomain (e.g., `www`)
3. **Step 1 — Ownership:** UI shows TXT record to add at the **registrable apex** (always): `_lessgo-verify.mysite.com` → `lessgo-verify=<random-token>`. Same TXT host whether user attaches `mysite.com` or `www.mysite.com`
4. User adds TXT, clicks "Verify ownership" → polls every 10s
5. **Step 2 — Routing:** On TXT verified, UI shows routing DNS:
   - **Apex:** A record → `76.76.21.21` (resolve current IP from Vercel API at runtime)
   - **Subdomain:** CNAME → `cname.vercel-dns.com`
6. User adds DNS, clicks "Verify routing" → backend calls Vercel API to attach + check config
7. States: `pending_ownership` → `pending_dns` → `issuing_ssl` → `live` (or `failed`)
8. Once live, custom domain canonical. Subdomain 301 → custom

## 6. Architecture

### 6.1 Schema (`prisma/schema.prisma`)
Change `UserPlan.customDomainsLimit` default `0 → 1` in same migration.

Add to `PublishedPage`:
```prisma
customDomain          String?   @unique
customDomainStatus    String?   // pending_ownership | pending_dns | issuing_ssl | live | failed
customDomainKind      String?   // apex | subdomain
customDomainVercelId  String?
customDomainOwnershipToken String?  // random nonce for TXT challenge
customDomainOwnershipVerifiedAt DateTime?
customDomainAddedAt   DateTime?
customDomainLiveAt    DateTime?
customDomainFailedAt  DateTime?  // for 30d cleanup
customDomainError     String?
```
Migration: `npx prisma migrate dev --name add_custom_domain`

### 6.2 New API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/domains/add` | POST | Validate + limit check, generate ownership token, create row in `pending_ownership` |
| `/api/domains/verify-ownership` | POST | DNS TXT lookup, on success → call Vercel API to attach, transition to `pending_dns` |
| `/api/domains/verify-dns` | POST | Vercel config check, transition `pending_dns` → `issuing_ssl` → `live` |
| `/api/domains/status` | GET | Return current status. **If `live`, re-check Vercel config (60s cache); flip to `failed` on regression** |
| `/api/domains/remove` | DELETE | Vercel API removal + DB clear + KV cleanup |

### 6.3 Middleware (`src/middleware.ts`) — REWRITTEN
**Current bug:** outer guard `host.includes('.lessgo.ai')` (line 51) skips KV entirely for custom hosts.

**New structure:**
```ts
// Skip Next internals and API routes for ALL hosts
if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
  // fall through to Clerk
}
// Branch A: lessgo.ai subdomain (existing logic, unchanged)
else if (host?.endsWith('.lessgo.ai')) {
  const subdomain = host.split('.')[0]
  if (subdomain !== 'www' && subdomain !== 'lessgo') {
    // 1. Check redirect:{host}:/ first → 301 to custom domain if attached
    // 2. Else KV route lookup → blob proxy
    // 3. Else SSR /p/{subdomain}
  }
}
// Branch B: NEW — custom domain (any host not in LESSGO_APP_HOSTS allowlist)
// Env: LESSGO_APP_HOSTS=lessgo.ai,localhost,*.vercel.app
else if (host && !isLessgoAppHost(host)) {
  // v1: root only — only handle path === '/'
  if (url.pathname !== '/') return new Response('Not Found', { status: 404 })
  // KV lookup route:{host}:/
  // Hit → rewrite to /api/blob-proxy
  // Miss → 404
}
```

Apex IP read dynamically: cache `GET /v4/domains/lessgo.ai/config` result for 24h.

`isLessgoAppHost(host)` — match against env-configured allowlist (apex + wildcard suffixes). Preview deploys (`*.vercel.app`) treated as app, never as custom-domain target.

### 6.4 KV Routing — call-site changes
On custom domain `live` transition, AND on every republish, `atomicPublishWithRetry()` call must include both hosts in `domains[]`:
```ts
const domains = [`${slug}.lessgo.ai`]
if (page.customDomain && page.customDomainStatus === 'live') {
  domains.push(page.customDomain)
}
await atomicPublishWithRetry({ domains, blobUrl, ... })
```
Plus, on `live` transition, write `redirect:{slug}.lessgo.ai:/` → `https://{customDomain}` (301).
On custom domain remove, delete the redirect key + the `route:{customDomain}:*` keys.

### 6.5 Vercel API
Env: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`
- Add: `POST /v10/projects/{id}/domains` body `{ name }`
- Verify config: `GET /v9/projects/{id}/domains/{domain}/config` (check `misconfigured`, `acceptedChallenges`)
- Get apex IP: `GET /v6/domains/{domain}/config` (cache 24h)
- Remove: `DELETE /v9/projects/{id}/domains/{domain}`

### 6.6 Ownership Verification (TXT)
- On `add`: generate `customDomainOwnershipToken` = `crypto.randomBytes(24).toString('base64url')`
- TXT record at **registrable apex always**: `_lessgo-verify.{registrable-domain}` value `lessgo-verify=<token>`
  - For `mysite.com` → `_lessgo-verify.mysite.com`
  - For `www.mysite.com` → still `_lessgo-verify.mysite.com` (extract registrable via PSL: `tldts` or `psl` package)
- Use Node `dns/promises` `resolveTxt()` — short timeout (5s), retry once
- Only after TXT verified do we call Vercel `add domain` (prevents squat)
- Token persists across `failed → pending_ownership` retries; user does NOT re-add TXT — UI shows "Re-checking the TXT record you already added…"

### 6.7 UI
- New `CustomDomainTab.tsx` inside publish modal
- Two-step wizard: ownership → routing
- Status pills + copy buttons for DNS records
- `useCustomDomainStatus(pageId)` hook — 10s poll, 10min timeout per step

## 7. Validation Rules
- Lowercase, valid FQDN, no `lessgo.ai`-suffixed input
- Reserved-domain blocklist (Vercel-owned, common phishing targets, top-1k brands optional)
- Max length 253 chars
- One custom domain per `PublishedPage`; `@unique` enforces global uniqueness
- **Per-user limit:** `UserPlan.customDomainsLimit` (default 1 in beta, configurable)
- **TXT ownership verified** before any Vercel API call

## 8. Error Handling
| Error | UX |
|-------|-----|
| TXT not found | Stay in `pending_ownership`, "DNS may take up to 48h" |
| TXT mismatch | Show expected vs actual value |
| Vercel domain limit hit | Hard error, alert admin (Slack), suggest support |
| Vercel returns "domain already in use" | "This domain is attached elsewhere — verify ownership and contact support" |
| SSL issuance failed | Retry button, link to CAA troubleshooting |
| Domain CAA blocks Let's Encrypt | Show CAA fix instructions (`letsencrypt.org` allowance) |
| User over plan limit | Inline form error with upgrade CTA |
| Re-add immediately after remove (Vercel cache) | `/remove` returns `retryAfter: 60`; UI disables re-add button + countdown toast |

## 9. Status Machine (crisp transitions)
```
[start] → pending_ownership
pending_ownership → pending_dns        (TXT verified + Vercel attach OK)
pending_ownership → failed             (10min timeout or repeated TXT fails)
pending_dns       → issuing_ssl        (Vercel config not misconfigured)
pending_dns       → failed             (10min timeout)
issuing_ssl       → live               (Vercel reports cert issued)
issuing_ssl       → failed             (cert error / CAA / 10min timeout)
live              → failed             (republish OR /status GET regression check detects misconfig)
failed            → pending_ownership  (user retries — restart from step 1)
any               → [removed]          (user deletes, or 30d after failed)
```

## 10. Edge Cases
- User removes DNS after `live` → next republish or status check flips to `failed`
- User changes slug after custom domain attached → slug `redirect:` key updates, custom domain unaffected
- Republish → KV route + redirect keys updated atomically for BOTH hosts (§6.4)
- User deletes published page → cascade: Vercel API remove + KV cleanup + DB clear
- TXT token rotation: keep same token across retries; rotate only on user-initiated re-add

## 11. Implementation Phases (5 days, +1 buffer for SSL/DNS flake)

**Phase A — Backend foundation (2 days)**
- Schema migration (incl. `customDomainsLimit` default → 1)
- Vercel API wrapper (`src/lib/vercel/domains.ts`)
- DNS TXT verifier (`src/lib/domains/verify.ts`) using `tldts` for registrable extraction
- 5 API routes (incl. `/status` regression re-check w/ 60s cache)
- KV redirect + multi-domain logic in `kvRoutes.ts` + `/api/publish` call-site
- Middleware rewrite (§6.3) with `LESSGO_APP_HOSTS` env allowlist

**Phase B — UI (1 day)**
- Custom domain tab + 2-step wizard
- DNS instructions component (apex A vs subdomain CNAME)
- Status polling hook + visual states + CAA help link
- Retry copy: "Re-checking the TXT record you already added…"
- Re-add cooldown countdown (60s after remove)

**Phase C — Polish + cleanup (1 day)**
- Republish handling (multi-domain in `domains[]`)
- Delete-page flow with Vercel + KV cleanup (dedicated task)
- Manual end-to-end test with real domain

**Phase D — Buffer (1 day)** — SSL/DNS flake debugging

## 12. Monitoring
- Log every Vercel API call (success/failure/latency)
- Track time-to-live (added → live) — surface if p95 > 10min
- Alert on Vercel API quota/auth errors
- Slack alert at 8 custom domains (Pro upgrade trigger)
- Rate limit `/verify-*` endpoints: **per-domain, 1 call / 10s**

## 13. Rollout
- Hidden behind PostHog flag `custom_domains_enabled`
- Manual enable for first 3-5 power users
- Watch SSL/DNS issues 1 week
- General release

## 14. Vercel Plan Trigger
**Upgrade to Pro when EITHER:**
- First paid customer transaction
- 10th custom domain added
- Vercel commercial-use warning email

Slack alert at 8 domains.

## 15. Open Questions (deferred, not blocking v1)
- Health-check cron — build in v2 once we see real failure modes
- www+apex auto-pairing (v2)
- Multi-path on custom domain (v2) — needs blob-proxy host-keyed lookup refactor
- Reserved-domain blocklist scope: just Vercel-owned, or top-1k brands too?
- Should `/api/domains/remove` require typed-domain confirmation?
- Failed-domain cleanup cron: build alongside v2 health-check cron (single job)
