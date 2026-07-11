// hooks/editStore/imageWriteGuard.ts
// Pure, synchronous guard against persisting ephemeral / inlined image sources
// into content JSON. `data:image/...` (base64 blobs) bloat the saved draft and
// balloon published HTML; `blob:` object URLs are per-session and die on reload.
// Both must be uploaded to permanent storage (via the store `uploadImage` action)
// before they land in content — never written directly.
//
// This module is intentionally dependency-free (no fetch, no store access) so it
// can be called at the `updateElementContent` write chokepoint and unit-tested
// in isolation. The async auto-upload lives in the store (formsImageActions),
// where the project `tokenId` needed by `/api/upload-image` is available.

/**
 * True when `value` is an image source that must NOT be persisted into content:
 * a base64 data URI (`data:image/...`) or an ephemeral object URL (`blob:`).
 * Anything else (https URLs, relative paths, empty string, plain text) is allowed.
 */
export function isForbiddenImageSrc(value: string): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith('data:image/') || value.startsWith('blob:');
}
