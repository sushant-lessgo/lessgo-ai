Changes I’d make before implementing
1) Don’t accept arbitrary imageUrl (SSRF risk)

If the endpoint fetches any URL the client sends, someone can make your server request internal/metadata URLs.

Safer pattern:

Accept pexelsPhotoId (and optionally a size key), not a raw URL

Server calls Pexels API to get the correct image URL for that ID

Or at minimum: only allow hosts like images.pexels.com via strict allowlist

2) Idempotency + caching (avoid paying twice)

Users will click different photos, reselect, undo/redo, etc. You don’t want to reprocess the same Pexels image repeatedly.

Add:

A deterministic key: sha1(pexelsPhotoId + desiredWidth + quality)

Store mapping in DB (or even KV) { key -> blobUrl }

If exists, return existing blobUrl instantly

3) Validate content type + size limits

Before Sharp:

Ensure response is an image (content-type starts with image/)

Enforce max input bytes (e.g., 15–20MB) to protect memory/timeouts

Handle Pexels 403/429 gracefully

4) Choose the right Pexels URL variant

Pexels provides multiple sizes in src (original, large2x, large, medium…).
You probably don’t need original.

Preferred:

pick large2x or large depending on your max target (2400px)

then Sharp still normalizes

5) UX: don’t block editor more than necessary

A spinner is fine, but make it feel instant:

set a temporary preview immediately (use the Pexels URL in the UI)

swap to blobUrl once ready

if proxy fails, fall back to Pexels URL (with a warning) so the user isn’t stuck

6) Consider AVIF (optional)

If you want maximum LCP wins:

try avif at ~50–60 quality, fallback to webp
But WebP alone is totally fine for MVP.