// Testimonial photo upload (Phase 3). Used by the PUBLIC collect endpoint, so it does its own
// validation and trusts nothing from the client. Sharp ALWAYS re-encodes to webp — that decode is
// the real MIME guard (client `file.type` is forgeable), and it strips any embedded payload.
// NOTE: deliberately NO `image/svg+xml` passthrough (upload-image stores SVG as-is — a stored-XSS
// vector on a public URL). Anything that isn't a decodable raster image is rejected.

import sharp from 'sharp'
import { nanoid } from 'nanoid'
import { put } from '@vercel/blob'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIM = 512 // avatar-sized
const WEBP_QUALITY = 85

export class PhotoError extends Error {}

/**
 * Validate + re-encode an uploaded image and store it. Returns the public URL.
 * Throws PhotoError on oversize / undecodable input.
 */
export async function processAndUploadTestimonialPhoto(file: File, projectId: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new PhotoError(`Photo too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let processed: Buffer
  try {
    processed = await sharp(buffer)
      .resize(MAX_DIM, MAX_DIM, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
  } catch {
    throw new PhotoError('Invalid image file')
  }

  const filename = `${nanoid(12)}.webp`
  const key = `testimonials/${projectId}/${filename}`

  // Dev without a Blob token → filesystem fallback (mirrors api/upload-image).
  if (process.env.NODE_ENV === 'development' && !process.env.BLOB_READ_WRITE_TOKEN) {
    const { writeFile, mkdir } = await import('fs/promises')
    const { existsSync } = await import('fs')
    const path = await import('path')
    const dir = path.join(process.cwd(), 'public', 'uploads', 'testimonials', projectId)
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), processed)
    return `/uploads/testimonials/${projectId}/${filename}`
  }

  const blob = await put(key, processed, {
    access: 'public',
    contentType: 'image/webp',
    addRandomSuffix: false,
  })
  return blob.url
}
