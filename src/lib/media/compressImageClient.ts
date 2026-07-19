// src/lib/media/compressImageClient.ts
// ============================================================================
// CLIENT-SIDE RASTER DOWNSCALE / RE-ENCODE — pre-upload payload bound (B1).
//
// WHY: Vercel serverless Functions 413 at the EDGE any request whose body
// exceeds ~4.5 MB, BEFORE the handler runs. Full-resolution photographer JPEGs
// routinely exceed that, so raw uploads of 8 photos silently dropped the big
// ones ("uploaded 8, only 4 arrived"). The upload copy is re-encoded here so the
// POSTed bytes are reliably well under the edge cap. The server sharp pipeline
// (`processImage`, route.ts) is UNCHANGED and remains the authoritative producer
// of the stored WebP + blur + checksum + assetId.
//
// Mirrors the server target: longest edge <= 2400px, WebP q~0.85.
//
// PASSTHROUGH (upload the ORIGINAL, no re-encode) when:
//   • SVG (vector — canvas would rasterize away the point) or GIF (canvas kills
//     animation),
//   • the browser can't decode / has no canvas encode (SSR, jsdom),
//   • re-encoding fails or does NOT shrink the file (already small / opaque).
//
// FIREWALL: browser DOM APIs only. No react, no stores, no node/sharp.
// ============================================================================

/** Longest edge of the uploaded copy. Matches server MAX_WIDTH (pipeline.ts). */
export const CLIENT_MAX_EDGE = 2400;
/** WebP encoder quality (0..1). Matches server WEBP_QUALITY (85) as a fraction. */
export const CLIENT_WEBP_QUALITY = 0.85;

/** MIME types we NEVER re-encode — pass the original File straight through. */
const PASSTHROUGH_TYPES = new Set(['image/svg+xml', 'image/gif']);

/**
 * Return an upload-ready copy of `file`: a downscaled/re-encoded WebP for large
 * rasters, or the untouched original for passthrough types / any failure.
 * NEVER throws — on any problem it falls back to the original File so the upload
 * still proceeds (the server + edge cap remain the backstop).
 */
export async function compressImageForUpload(file: File): Promise<File> {
  try {
    if (PASSTHROUGH_TYPES.has(file.type)) return file;
    // Non-image or environments without canvas encode → passthrough.
    if (!file.type.startsWith('image/')) return file;
    if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
      return file;
    }

    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return file;

    try {
      const { width, height } = bitmap;
      if (!width || !height) return file;

      const scale = Math.min(1, CLIENT_MAX_EDGE / Math.max(width, height));
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);

      const blob = await canvasToWebp(canvas);
      // Only adopt the re-encode if it actually shrank the payload; otherwise the
      // original is already small enough and re-encoding would only lose quality.
      if (!blob || blob.size >= file.size) return file;

      const newName = file.name.replace(/\.[^./\\]+$/, '') + '.webp';
      return new File([blob], newName, { type: 'image/webp', lastModified: file.lastModified });
    } finally {
      bitmap.close?.();
    }
  } catch {
    // Any unexpected failure → upload the original untouched.
    return file;
  }
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/webp', CLIENT_WEBP_QUALITY);
    } catch {
      resolve(null);
    }
  });
}
