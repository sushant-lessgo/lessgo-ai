🔴 1. Rate limiting purely by sessionId is too weak (as-is)

You already noted the limitation, but here’s the better compromise that still respects privacy:

Recommended approach
Use a compound key, but never store IP:

rateLimitKey = hash(
  sessionId +
  userAgentBucket +
  pageId +
  timeWindow
)


Where:

userAgentBucket = "desktop-chrome" | "mobile-safari" (coarse)

no raw UA string

no IP

hash before storing

This gives you:

better bot resistance

zero personal data storage

no consent issues

You still don’t store identifying data—only a derived hash.

🔴 2. Explicitly document “derived data only” in code + policy

You should codify your privacy stance in two places:

a) Code comment (important)

At the beacon API entry point:

/**
 * Privacy contract:
 * - No IP addresses collected or stored
 * - No cookies or persistent identifiers
 * - Only derived, non-identifying metadata is persisted
 * - Raw request data must not be logged
 */


This protects future contributors from “just adding IPs later”.

b) Privacy policy microcopy

Your badge links to /privacy — make sure that page explicitly states:

“We do not store IP addresses”

“Analytics are anonymous and aggregated”

“Used only to help page owners understand performance”

This matters more than lawyers—users read this now.

🔴 3. Script injection must be server-only, never client toggled

You hinted at this, but I’ll state it clearly:

❌ Don’t conditionally load analytics script via client-side JS

✅ Inject <script src="/assets/a.v1.js"> only at render time if analyticsEnabled === true

Why this matters:

avoids race conditions

prevents “flash of tracking”

guarantees disabled pages truly do nothing

Your test plan implies you’re doing this correctly—just calling it out as non-negotiable.