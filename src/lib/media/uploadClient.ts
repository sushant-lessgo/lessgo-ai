// src/lib/media/uploadClient.ts
// ============================================================================
// ONBOARDING BULK UPLOAD CLIENT (work-onboarding-ingestion E2 · D3).
//
// A thin client caller over the ONE existing image route (`/api/upload-image`)
// — the same server pipeline everything else uses (sharp → WebP q85 + blur +
// checksum + MediaAsset row). "No second pipeline" is about the ROUTE + server
// half; this is just a browser-side batch wrapper for onboarding, which has no
// `EditProvider` and therefore cannot reach the editStore's `bulkUploadImages`.
//
//   • `bulkUploadImages` (editStore action) is LEFT UNTOUCHED (D3, rev 3): it is
//     token-scoped store state and returns no `assetId`, so it is not drop-in
//     reusable here. Both callers still hit the same route.
//   • The route ALREADY returns `metadata.assetId` + `metadata.blurDataUrl`
//     (route.ts) — NO route change of any kind.
//
// FIREWALL: browser `fetch` only. No react, no stores, no template runtime.
// ============================================================================

export interface UploadedImage {
  /** The original File (so callers can join EXIF dates / relativePath by identity). */
  file: File;
  /** The stored image url (WebP, blob or dev-fs). */
  url: string;
  /** The MediaAsset row id — best-effort on the server, so possibly `undefined`. */
  assetId?: string;
  /** Tiny blur placeholder data-url (used for instant thumbnail paint). */
  blurDataUrl?: string;
}

export interface UploadFailure {
  file: File;
  error: string;
}

export interface UploadImageFilesResult {
  uploaded: UploadedImage[];
  failed: UploadFailure[];
}

export interface UploadImageFilesOptions {
  /** Max concurrent in-flight uploads. Default 3 — kind to mobile connections. */
  concurrency?: number;
  /** Progress callback: fired after each file settles (success OR failure). */
  onProgress?: (done: number, total: number) => void;
  /** Test/abort seam — passed straight to `fetch`. */
  signal?: AbortSignal;
}

/** One file → the `/api/upload-image` route. Rejects on a non-2xx / network error. */
async function uploadOne(
  file: File,
  tokenId: string,
  signal?: AbortSignal
): Promise<UploadedImage> {
  const form = new FormData();
  form.append('file', file);
  form.append('tokenId', tokenId);

  const res = await fetch('/api/upload-image', { method: 'POST', body: form, signal });
  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new Error(message);
  }

  const body = await res.json();
  return {
    file,
    url: body.url as string,
    assetId: body?.metadata?.assetId ?? undefined,
    blurDataUrl: body?.metadata?.blurDataUrl ?? undefined,
  };
}

/**
 * Upload a batch of image files through the one route, bounded to `concurrency`
 * in flight. Never throws — a failed file lands in `failed` and the batch
 * continues (an onboarding upload of 40 photos must not die on one bad file).
 * Results preserve INPUT ORDER regardless of settle order.
 */
export async function uploadImageFiles(
  files: File[],
  tokenId: string,
  options: UploadImageFilesOptions = {}
): Promise<UploadImageFilesResult> {
  const concurrency = Math.max(1, options.concurrency ?? 3);
  const total = files.length;
  const uploaded: (UploadedImage | undefined)[] = new Array(total);
  const failed: (UploadFailure | undefined)[] = new Array(total);

  let done = 0;
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= total) return;
      try {
        uploaded[i] = await uploadOne(files[i], tokenId, options.signal);
      } catch (err) {
        failed[i] = { file: files[i], error: err instanceof Error ? err.message : 'Upload failed' };
      } finally {
        done += 1;
        options.onProgress?.(done, total);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));

  return {
    uploaded: uploaded.filter((u): u is UploadedImage => u !== undefined),
    failed: failed.filter((f): f is UploadFailure => f !== undefined),
  };
}
