✅ Verified                                                                                            
                                                                                                         
  - SlugModal.tsx, Input, Button, cn(), lucide-react ^0.501.0 all present                                
  - preview/[token]/page.tsx: existingPublished state at line 86 with slug + title
  - /api/domains/status?slug= works as plan describes — auth + ownership check at lines 28-46 ✅
  - /api/domains/remove is DELETE, returns { removed: true, retryAfter: 60 } ✅
  - /api/domains/verify-ownership and /verify-dns already return 429 with retryAfter — UI plan's 429
  handling lines up
  - /api/domains/add body shape { slug, customDomain } matches plan's AddDomainForm

  ⚠️  API contract mismatches (UI must align)

  1. Plan refers to ownershipToken (line 53, 65, status state); actual API returns ownership: { txtHost,
  txtValue } already pre-formatted (status/route.ts:75-81). Don't synthesize lessgo-verify=<token> in UI
  — read ownership.txtValue directly.
  2. Plan says DnsStep reads apexIp from response; actual API returns dnsInstructions: { type, host,
  value } with IP already inlined for apex (status/route.ts:69-73). Render dnsInstructions rows directly
  — no per-kind branching needed in UI.
  3. add doesn't accept kind — inferred server-side via validateDomain(). Plan's AddDomainForm (single
  input) matches this. Good. But Phase A verification step 3 in same plan still says { slug,
  customDomain, kind } — outdated, harmless.

  Minor nits

  - Modal mount fetch: plan does fetch on every open toggle. Add cancel/abort on close to avoid
  setState-on-unmounted warnings.
  - Cooldown after Remove: 60s retryAfter only matters if user immediately re-adds. Plan disables Add
  button — fine. But reopening modal after cooldown shouldn't show stale disabled state — derive from
  timestamp, not in-memory bool.
  - isPublicRoute not amended for /api/domains/* — correct (must require auth), already noted in Phase A.
   UI calls will succeed because user is signed-in on /preview/[token].
  - FailedStep "Try Again": plan checks customDomainOwnershipVerifiedAt but status endpoint doesn't
  return that field (selects only token/error). Add to select block in status/route.ts OR derive
  next-step from status itself (failed-after-ownership = pending_dns retry; failed-before =
  pending_ownership retry).
  - status === null branch: status endpoint returns { status: null } when no customDomain. Plan handles
  this. ✓ But dnsInstructions and ownership are absent in that response — modal must guard.

  Open Questions (plan's own)

  - Reuse success overlay (lines 522-558) for LiveStep — worth checking, keeps visual consistency
  - Dashboard cards: defer to Phase C, preview-page-only for now is reasonable
  - "Try Again" auto-invokes verify: prefer show step UI first, let user click Verify — auto-invoke risks
   confusing users who haven't fixed the underlying DNS issue
